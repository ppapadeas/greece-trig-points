# Development Roadmap

## Now (Sept 2026 review)

- [ ] Merge PR #40 (ROLLBACK before early returns — closes #12, the only P1 with a ready fix)
- [ ] #13 CSRF: drop wildcard `*.vercel.app` CORS with credentials, or add CSRF tokens
- [ ] #14 single PG pool + `pool.on('error')` + statement timeout — the API machine crashed twice in June (exit 1, no OOM) and there is no crash log
- [ ] #30 `/health` endpoint + Fly `[[http_service.checks]]` — Fly currently has zero health checks on the machine
- [ ] #17 gate Fly deploy on frontend lint/tests; pin `superfly/flyctl-actions`
- [ ] #15 + #16 + #22 together — `/api/points` full-table query per request, map remount per navigation, `SELECT *` per request
- [ ] Cloudflare cache rule for `/sw.js` (+ `registerSW.js`, `workbox-*.js`, `manifest.webmanifest`): Cloudflare overrides Vercel's `max-age=0` with a 4h browser TTL, so service-worker updates lag up to 4h after a deploy — set Browser TTL "respect origin" or bypass cache for those paths in the Cloudflare dashboard
- [ ] Contour label layer has no `text-font`, so MapLibre requests the default `Open Sans Regular,Arial Unicode MS Regular` glyphs from cdn.protomaps.com, which fails CORS (labels still render via fallback) — set `'text-font': ['Noto Sans Regular']`
- [ ] Bundled `tar@7.5.9` inside `gdal-async` (GHSA critical) — build-time only, wait for a gdal-async release

## Community growth (Oct 2026 review)

Baseline from the live API on 28 Oct 2026: 122 accounts, 66 of them with at least one report, 1,036 reports, 934 points checked (3.7% of the network). 306 of the checked points (33%) are damaged, destroyed or missing.

What the numbers say:

- Signups come in waves: 36 in Sept 2025 (launch), 36 in March 2026 (preprint + Zenodo), 0–8 in every other month.
- Since April, 5–11 people report in any given month. The top 3 contributors hold 47.7% of all reports, the top 10 hold 76.4%.
- 43 of the 66 contributors reported on a single day and never came back. 56 accounts have no report at all.
- Reports peak in spring and autumn and drop in June–July (34 and 21 reports).
- Search brings about 90 visits a month (Cloudflare Web Analytics).

The plan runs two outreach waves a year, autumn and spring, when people are on the mountains.

### Prep — until 17 Nov 2026

- [ ] Ask the top 10 contributors how they found vathra, what keeps them reporting and what is missing. Their answers say where to look for the next ones.
- [ ] Zenodo v3 with all reports. The v2 `reports.csv` has only 15 rows (it looks like the `/api/activity` output) and its Greek names are double-encoded (UTF-8 read as Windows-1253). In `points.csv`, separate "OK from the ΓΥΣ `TR_YPARXI` flag" from "OK from a field visit".
- [ ] Confirm that the ΕΓΣΑ87 x/y/z in `points.csv` and `/api/points/nearby` match what ΓΥΣ itself publishes, and note the source in the dataset description, before the visibility push.
- [ ] Google Search Console + Bing Webmaster Tools: submit the sitemaps and check that `/point/` pages get indexed.
- [ ] Fill prefecture and municipality for every point with a spatial join on the open municipal boundaries (the prefecture column is NULL across the dataset). Unblocks per-municipality pages and per-region stats. *(was in Backlog: "Statistics per prefecture/region")*
- [ ] Opt-in user notifications: "your point got a new report" and "new report on the map sheet you adopted". Today the only email is the admin digest. The privacy policy lists only sign-in, display and operating the service, so it needs a new line and an opt-out link in every email.

### Autumn wave — 18 Nov to 31 Dec 2026

- [ ] Launch on GIS Day (Wed 18 Nov) with the finding "1 in 3 checked points is damaged, destroyed or missing": press, r/greece, michanikos.gr, hiking groups. Target: a March-sized wave, 30+ signups.
- [ ] Public "First-order points" page: all 118, which are checked (30), which have problems (10), which are left, who claimed which. Per-user challenges already exist; this is the shared view. Add a field-safety note, since most of them sit on summits, and surface the access/danger tags.
- [ ] Adopt a map sheet: a steward per ΓΥΣ 1:50,000 sheet (172 of 385 sheets have a report). Start with the top 10, who already have their own areas. *(replaces Priority "OSM Tasking Manager project" and Backlog "Adopt a Trig Point")*
- [ ] Bring back the 56 accounts with no report: an in-app banner on next sign-in, and email only to those who opt in once notifications ship.
- [ ] Self-service KML/GPX import of past visits, with preview and admin approval. `backend/scripts/import-kml-reports.js` exists; one file brought in 59 reports at once.
- [ ] Targeted outreach: EOOA and hiking clubs, ΠΣΔΑΤΜ and surveying schools, SOTA radio amateurs. *(replaces Priority "Hiking club sponsorships")*

### Spring wave — Jan to Mar 2027

- [ ] Field exercise in the spring semester with one or two surveying schools.
- [ ] Annual dataset release on 4 Mar 2027, a year after v2, and submit the paper to a journal.
- [ ] Field weekend around Open Data Day in March.
- [ ] OSM forum discussion on linking field-verified points, once licensing is settled ([thread](https://community.openstreetmap.org/t/topic/137264)).
- [ ] June–July, when reports drop, goes to code, not outreach.

### Later — from Apr 2027

- [ ] Meet ΓΥΣ and Κτηματολόγιο about the condition data.
- [ ] A second maintainer for code and infrastructure; regional moderators.
- [ ] Funding: the NLnet decision or a new application, for whatever no longer fits in spare time.

### Targets for 31 Mar 2027

| Metric | 28 Oct 2026 | Target |
| --- | --- | --- |
| Active contributors per month | 5–11 | 20 |
| New contributors per month outside waves | 0–5 | 8 |
| Contributors with reports on 2+ days | 23 of 66 (35%) | 50% |
| Share of the top 3 contributors | 47.7% | under 35% |
| Points checked | 934 | 2,000 |
| First-order points checked | 30 of 118 | 70 |
| Map sheets with a report | 172 of 385 | 250 |
| Reports with a photo | 69% | 75% |
| Search visits per month | ~90 | 270 |

Keep reports from KML imports out of the monthly numbers, or they inflate them. 2,000 points means roughly double the pace since March (about 105 new points a month).

## Priority

- [ ] QGIS Plugin — load vathra.xyz points as a WFS/vector layer, auto-style by status

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
- [ ] Route planner — select points and get optimal hiking route
- [ ] AI photo analysis — auto-detect trig point condition from uploaded photos
- [ ] Strava/Komoot integration — auto-log visited points from GPS tracks
- [ ] Multi-language support beyond el/en (de, fr, etc.)
- [ ] Merchandise — stickers, T-shirts, patches via print-on-demand

## Done

- [x] Sept 2026 major upgrades, shipped as separate PRs after a production incident (#42 merged straight to main broke the map for ~10 min; reverted in #43): #44 backend (nodemailer 10, sharp 0.35, adm-zip 0.6, @simplewebauthn/server 14, node-pg-migrate 9 — all 17 migrations replayed on a fresh PostGIS 17 container), #45 MUI 7→9 + x-data-grid 9 + i18next 26 + @vercel/og 1 + @simplewebauthn/browser 14 (`InputProps`/`inputProps` → `slotProps`, `paragraph`/`display` system props → `sx`, `*Outline` icon aliases → `*Outlined`), #46 MapLibre GL 5→6 (ESM-only `import * as maplibregl`; worker registered via `?worker&url` + `setWorkerUrl()` — the missing piece in #42; data-driven `circle-translate` replaced by one warning-badge layer per order group, which also fixes the badge that v5.24 was already refusing to draw in production), #47 no-cache headers for the service worker files. Each frontend PR verified on its Vercel preview and, after merge, on vathra.xyz with a headless-Chrome script that waits for the map `load` (search bar mounted) and checks the worker request.
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
