# Development Roadmap

## Now (Sept 2026 review)

- [ ] Merge PR #40 (ROLLBACK before early returns — closes #12, the only P1 with a ready fix)
- [ ] #13 CSRF: drop wildcard `*.vercel.app` CORS with credentials, or add CSRF tokens
- [ ] #14 single PG pool + `pool.on('error')` + statement timeout — the API machine crashed twice in June (exit 1, no OOM) and there is no crash log
- [ ] #30 `/health` endpoint + Fly `[[http_service.checks]]` — Fly currently has zero health checks on the machine
- [ ] #17 gate Fly deploy on frontend lint/tests; pin `superfly/flyctl-actions`
- [ ] #15 + #16 + #22 together — `/api/points` full-table query per request, map remount per navigation, `SELECT *` per request
- [ ] Bundled `tar@7.5.9` inside `gdal-async` (GHSA critical) — build-time only, wait for a gdal-async release

## Priority

- [ ] QGIS Plugin — load vathra.xyz points as a WFS/vector layer, auto-style by status
- [ ] OSM Tasking Manager project — coordinate community surveying of trig points by map sheet
- [ ] Hiking club sponsorships — partner with EOOA, local hiking clubs for fieldwork campaigns

## Next

- [ ] PWA offline mode — runtime cache for map tiles + `/api/points`, Background Sync queue for reports (installable PWA + asset precache already shipped via vite-plugin-pwa)
- [ ] Public read-only API with OpenAPI docs for third-party data consumers (unblocks QGIS plugin)
- [ ] OGC WFS 2.0 endpoint (INSPIRE-compliant) via pygeoapi or pg_featureserv
- [ ] Zenodo DOI auto-publish via GitHub Actions (currently manual)
- [ ] Export as SHP (Shapefile) — gdal-async already a backend dep

## Backlog

- [ ] Scrollytelling landing page — animated narrative about trig point heritage
- [ ] Telegram bot for field reporting
- [ ] Map heatmap layer for report density
- [ ] Statistics per prefecture/region (prefecture column is currently NULL — needs data fix)
- [ ] Route planner — select points and get optimal hiking route
- [ ] AI photo analysis — auto-detect trig point condition from uploaded photos
- [ ] Strava/Komoot integration — auto-log visited points from GPS tracks
- [ ] Multi-language support beyond el/en (de, fr, etc.)
- [ ] "Adopt a Trig Point" monitoring program
- [ ] Merchandise — stickers, T-shirts, patches via print-on-demand

## Done

- [x] Sept 2026 major upgrades — MUI 7→9 (+ icons, x-data-grid 8→9; `InputProps`/`inputProps` → `slotProps`, removed `*Outline` icon aliases → `*Outlined`, system props → `sx`), MapLibre GL 5→6 (ESM-only, `import * as maplibregl`; data-driven `circle-translate` no longer allowed → one warning-badge layer per order group; `optimizeDeps.exclude` for the worker in Vite dev), i18next 26 + react-i18next 17, @vercel/og 1.0, @simplewebauthn 14 (needs Node 22 — matches the new base image), nodemailer 10, sharp 0.35, adm-zip 0.6, node-pg-migrate 9 (all 17 migrations replayed on a fresh PostGIS 17 container). Frontend audit 2→0 high, backend 4→1 (bundled `tar` in gdal-async).
- [x] Sept 2026 maintenance — fixed OG link previews + `/sitemap-points.xml` (Vercel functions were getting 403 from the API since the April non-browser gate; they now send a Referer + `vathra-vercel/` UA), Node 20→22 base image (Node 20 EOL April 2026), semver-safe dependency refresh (frontend audit 21→2, backend 20→4, all remaining need majors), eslint clean (git-hash globals, node globals for `api/`, unused vars)
- [x] Public tag UI — sidebar warning banner + tag chips (read-only display), warning glyph badge on individual map markers (clusters not decorated by design), filter capsule (status pills + order chips + tags accordion + base-layer segmented control) with URL sync, tags integrated into the report form (delta against current tags + warning-tag confirmation dialog).
- [x] Point tags (admin-only, schema + admin UI) — orthogonal `tags` + `point_tags` join, seeded with access/approach/quality/heritage tags (e.g. `inaccessible:military`, `panoramic`, `requires_4x4`). Admins assign tags from the All Points Data tab.
- [x] Stats dedupe — same-day reports per user/point count once in dashboard totals, leaderboard, timeline, and per-user rank progression
- [x] Installable PWA — vite-plugin-pwa with autoUpdate service worker, manifest, asset precache (~3 MB)
- [x] Dependency refresh (Apr 2026) — semver-safe bumps across frontend (Sentry, MapLibre, axios, vitest, recharts, MUI patch) and backend (AWS SDK, pg, multer, express-rate-limit, nodemailer)
- [x] Sentry error tracking — @sentry/react (frontend) + @sentry/node (backend), browser tracing, session replay on errors
- [x] Immutable cache headers — Vercel `/assets/*` with `max-age=31536000, immutable` for hashed bundles
- [x] About page redesign — hero banner + card grid layout, IBM Plex Mono for Greek glyph support
- [x] NLnet NGI0 Commons Fund application — submitted March 2026
- [x] GitHub Sponsors + Ko-fi — donation links in About page and README
- [x] EarthArXiv preprint published (DOI: 10.31223/X5VN13)
- [x] Zenodo dataset v2 archived (DOI: 10.5281/zenodo.17111961)
- [x] CITATION.cff + .zenodo.json metadata
- [x] AR compass view with camera overlay and nearby points
- [x] GPX export, nearest unvisited prompt, challenges system
- [x] User profiles + admin email notifications
- [x] Git commit hash in About page
- [x] Form field accessibility (id/name attributes)
- [x] v3 brand identity — custom palette (ink/parchment/terracotta/slate), Fraunces + Noto Serif typography, new logomark
- [x] Self-hosted contour lines overlay — SRTM DEM → GDAL → tippecanoe → PMTiles on R2, 50m/200m intervals
- [x] Migrate from Leaflet to MapLibre GL JS + Protomaps (self-hosted vector tiles on Cloudflare R2/Workers)
- [x] Remove Stadia Maps dependency — zero-cost self-hosted map tiles via PMTiles
- [x] Replace leaflet.markercluster with MapLibre built-in GeoJSON clustering
- [x] Code splitting with React.lazy — initial bundle 1,781KB → 429KB
- [x] Vite manual chunks — MUI, Recharts, MapLibre split into cacheable vendor chunks
- [x] SuperclusterLayer marker diffing — only add/remove changed markers on pan/zoom (now built into MapLibre)
- [x] Client-side filtering — fetch all points once, filter with useMemo
- [x] HTTP cache headers — /api/points 5min, /api/stats 1hr
- [x] Sidebar memoization — React.memo + useCallback for stable props
- [x] Database pool config — explicit 20 max connections, 30s idle timeout
