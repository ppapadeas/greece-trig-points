# Development Roadmap

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
