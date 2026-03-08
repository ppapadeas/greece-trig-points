import {
  Compression,
  EtagMismatch,
  PMTiles,
  RangeResponse,
  ResolvedValueCache,
  Source,
  TileType,
  tileTypeExt,
} from "pmtiles";

interface Env {
  ALLOWED_ORIGINS?: string;
  BUCKET: R2Bucket;
  CACHE_CONTROL?: string;
}

class KeyNotFoundError extends Error {}

async function nativeDecompress(
  buf: ArrayBuffer,
  compression: Compression
): Promise<ArrayBuffer> {
  if (compression === Compression.None || compression === Compression.Unknown) {
    return buf;
  }
  if (compression === Compression.Gzip) {
    const stream = new Response(buf).body;
    const result = stream?.pipeThrough(new DecompressionStream("gzip"));
    return new Response(result).arrayBuffer();
  }
  throw new Error("Compression method not supported");
}

const CACHE = new ResolvedValueCache(25, undefined, nativeDecompress);

class R2Source implements Source {
  env: Env;
  archiveName: string;

  constructor(env: Env, archiveName: string) {
    this.env = env;
    this.archiveName = archiveName;
  }

  getKey() {
    return this.archiveName;
  }

  async getBytes(
    offset: number,
    length: number,
    _signal?: AbortSignal,
    etag?: string
  ): Promise<RangeResponse> {
    const resp = await this.env.BUCKET.get(this.archiveName + ".pmtiles", {
      range: { offset, length },
      onlyIf: { etagMatches: etag },
    });
    if (!resp) {
      throw new KeyNotFoundError("Archive not found");
    }
    const o = resp as R2ObjectBody;
    if (!o.body) {
      throw new EtagMismatch();
    }
    const a = await o.arrayBuffer();
    return {
      data: a,
      etag: o.etag,
      cacheControl: o.httpMetadata?.cacheControl,
      expires: o.httpMetadata?.cacheExpiry?.toISOString(),
    };
  }
}

const TILE =
  /^\/(?<NAME>[0-9a-zA-Z\/!\-_\.\*\'\(\)]+)\/(?<Z>\d+)\/(?<X>\d+)\/(?<Y>\d+).(?<EXT>[a-z]+)$/;
const TILESET = /^\/(?<NAME>[0-9a-zA-Z\/!\-_\.\*\'\(\)]+).json$/;

function tilePath(path: string) {
  const tileMatch = path.match(TILE);
  if (tileMatch) {
    const g = tileMatch.groups!;
    return { ok: true, name: g.NAME, tile: [+g.Z, +g.X, +g.Y] as [number, number, number], ext: g.EXT };
  }
  const tilesetMatch = path.match(TILESET);
  if (tilesetMatch) {
    const g = tilesetMatch.groups!;
    return { ok: true, name: g.NAME, tile: undefined, ext: "json" };
  }
  return { ok: false, name: "", tile: undefined, ext: "" };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method.toUpperCase() === "POST")
      return new Response(undefined, { status: 405 });

    const url = new URL(request.url);
    const { ok, name, tile, ext } = tilePath(url.pathname);
    const cache = caches.default;

    if (!ok) {
      return new Response("Invalid URL", { status: 404 });
    }

    let allowedOrigin = "";
    if (env.ALLOWED_ORIGINS) {
      for (const o of env.ALLOWED_ORIGINS.split(",")) {
        if (o === request.headers.get("Origin") || o === "*") {
          allowedOrigin = o;
        }
      }
    }

    const cached = await cache.match(request.url);
    if (cached) {
      const respHeaders = new Headers(cached.headers);
      if (allowedOrigin) respHeaders.set("Access-Control-Allow-Origin", allowedOrigin);
      respHeaders.set("Vary", "Origin");
      return new Response(cached.body, { headers: respHeaders, status: cached.status });
    }

    const cacheableResponse = (
      body: ArrayBuffer | string | undefined,
      cacheableHeaders: Headers,
      status: number
    ) => {
      cacheableHeaders.set("Cache-Control", env.CACHE_CONTROL || "public, max-age=86400");
      const cacheable = new Response(body, { headers: cacheableHeaders, status });
      ctx.waitUntil(cache.put(request.url, cacheable));
      const respHeaders = new Headers(cacheableHeaders);
      if (allowedOrigin) respHeaders.set("Access-Control-Allow-Origin", allowedOrigin);
      respHeaders.set("Vary", "Origin");
      return new Response(body, { headers: respHeaders, status });
    };

    const cacheableHeaders = new Headers();
    const source = new R2Source(env, name);
    const p = new PMTiles(source, CACHE, nativeDecompress);

    try {
      const pHeader = await p.getHeader();

      if (!tile) {
        cacheableHeaders.set("Content-Type", "application/json");
        const t = await p.getTileJson(`https://${url.hostname}/${name}`);
        return cacheableResponse(JSON.stringify(t), cacheableHeaders, 200);
      }

      if (tile[0] < pHeader.minZoom || tile[0] > pHeader.maxZoom) {
        return cacheableResponse(undefined, cacheableHeaders, 404);
      }

      const extToType: Record<string, TileType> = {
        mvt: TileType.Mvt,
        pbf: TileType.Mvt,
        png: TileType.Png,
        jpg: TileType.Jpeg,
        webp: TileType.Webp,
        avif: TileType.Avif,
      };

      const expectedType = extToType[ext];
      if (pHeader.tileType !== expectedType && tileTypeExt(pHeader.tileType) !== "") {
        return cacheableResponse(
          `Bad request: requested .${ext} but archive has type ${tileTypeExt(pHeader.tileType)}`,
          cacheableHeaders,
          400
        );
      }

      const tiledata = await p.getZxy(tile[0], tile[1], tile[2]);

      switch (pHeader.tileType) {
        case TileType.Mvt: cacheableHeaders.set("Content-Type", "application/x-protobuf"); break;
        case TileType.Png: cacheableHeaders.set("Content-Type", "image/png"); break;
        case TileType.Jpeg: cacheableHeaders.set("Content-Type", "image/jpeg"); break;
        case TileType.Webp: cacheableHeaders.set("Content-Type", "image/webp"); break;
      }

      if (tiledata) {
        return cacheableResponse(tiledata.data, cacheableHeaders, 200);
      }
      return cacheableResponse(undefined, cacheableHeaders, 204);
    } catch (e) {
      if (e instanceof KeyNotFoundError) {
        return cacheableResponse("Archive not found", cacheableHeaders, 404);
      }
      throw e;
    }
  },
};
