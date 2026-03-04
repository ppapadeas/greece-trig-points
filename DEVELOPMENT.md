# Development Roadmap

## Completed

### Security / Infrastructure
- [x] Add `express.json()` body parser middleware (`backend/index.js`)
- [x] Add `frontend/vercel.json` SPA rewrite rules (React Router direct links were 404ing)
- [x] `helmet` middleware for security headers
- [x] `express-rate-limit` — global API limiter (200 req/15min) + per-user report limiter (20/hr)
- [x] File upload validation — multer `fileFilter` (images only) + `limits` (5MB max)
- [x] Input validation — whitelist `status` enum values, cap `comment` at 1000 chars
- [x] `lat`/`lon` isNaN guard in getNearestPoint controller
- [x] Move `dotenv-cli` to devDependencies

### Statistics Page (Phase 1 — Layout & i18n)
- [x] Fix MUI Grid API: `Grid` with `size={}` prop (MUI v7, Grid2 doesn't exist)
- [x] Status donut chart with custom tooltip showing count + %
- [x] Translated status labels in chart legend
- [x] Split layout: chart left (7/12) + top contributors right (5/12)
- [x] Gold/silver/bronze trophy icons for top 3 contributors
- [x] Fallback avatar initials for users without profile picture
- [x] All strings translated via i18n (el + en)

### Statistics Page (Phase 2 — New Data)
- [x] Backend: map sheet breakdown query (top 15 by `map_sheet_name_gr`)
- [x] Backend: geodetic order breakdown query (I/II/III/IV only)
- [x] Backend: include `profile_picture_url` in topUsers query
- [x] Frontend: horizontal bar chart — points by map sheet
- [x] Frontend: donut chart — points by geodetic order with count labels in legend
- [x] Fix: `prefecture` column is NULL for all points — use `map_sheet_name_gr` instead
- [x] Fix: filter out corrupted `ΑΓΝΩΣΤΗ` value in point_order

### Statistics Page (Phase 3 — Polish)
- [x] Skeleton loaders matching full layout (4 stat cards + 4 charts) instead of CircularProgress
- [x] "Coverage" stat card — % of points with at least one report + raw count subtitle
- [x] 4 stat cards in a row (xs:6/md:3 grid)

### Community & Discord
- [x] Discord server link in Header (desktop icon button + mobile menu item)
- [x] Discord section in About page with branded button
- [x] i18n keys for Discord (el + en)

---

## Pending

### Near-term
- [x] Mobile responsiveness: bar chart YAxis shrinks on small screens, names truncated
- [x] "You are here" blue dot + accuracy ring when Find My Location is used
- [x] Navigate-to-point dropdown: Google Maps + OpenStreetMap directions options
- [x] Fix filter panel hidden behind fixed AppBar (top offset 15→72px)

### Performance & Stability
- [x] DB indexes on `points(status)` and `points(point_order)` via migration `1772406755095`
- [x] Fix LocationButton listener leak — `map.off()` before `map.on()`
- [x] Revert bounds-based loading — MarkerCluster handles render perf; load all points once on mount
- [x] Fix white map on point click — use `window.history.pushState()` instead of `navigate()` to avoid MapPage remount
- [x] Fix map not rendering — `.app-container` needs `height: 100%` not `flex-grow: 1` (parent is not a flex container)
- [x] gzip compression on all API responses (`compression` middleware)
- [x] Slim `/api/points` list to 5 columns (was 17) — sidebar fetches full detail on click
- [x] Discord invite link updated to non-expiring `discord.gg/Kqn3UEZsGp`
- [x] `ST_X`/`ST_Y` for lat/lon as plain numbers — eliminates 25k `JSON.parse()` calls on frontend
- [x] MarkerCluster group persisted in `useRef` — `clearLayers()`+`addLayers()` batch on filter change, no group rebuild

### Testing
- [x] Vitest + @testing-library/react set up (`npm test` in `frontend/`)
- [x] App routing tests — map renders on `/` and `/point/:gysId`, not on `/stats` or `/about`
- [x] MapPage tests — stays mounted after `pushState`, fetches on mount, permalink support

### Data Export (requested by community)
- [x] Export points as CSV with coordinates and attributes (`/api/export/csv`)
- [x] Export as KML for Google Earth (`/api/export/kml`)
- [x] Download buttons on About page with i18n (el/en)
- [x] Export as GPX with status/order/bbox filters (`/api/export/gpx`) — Garmin/OsmAnd/Wikiloc compatible
- [ ] Export as SHP (Shapefile) — requires GDAL bindings

### Community Engagement
- [x] Recent activity feed on Statistics page (`/api/activity` — last 15 reports with user, point link, status badge)
- [x] Leaderboard expanded from top 3 to top 10 with rank numbers
- [x] Share button on point sidebar (Web Share API with clipboard fallback)
- [x] Fix scroll regression on About/Stats/Admin pages (`overflow: hidden` → `auto`)

### Future Features
- [x] Time-series chart — reports submitted over time (`/api/stats/timeline` + AreaChart)
- [x] User profile page with report history, mini-map, rank badges (`/profile/:userId`)
- [x] Email notifications for admin on new reports (nodemailer + Resend SMTP)
- [x] First Reporter badge on point sidebar
- [x] Clickable leaderboard + activity feed user names → profile links
- [x] "Nearest unvisited" prompt for logged-in users — PostGIS nearest-neighbor query + dismissable map banner
- [x] Challenges system on user profiles — Order I/II Compleater, First 100 Club, Map Sheet Explorer with progress bars

---

## Priority Queue

### Do Priority
- [ ] QGIS Plugin — load vathra.xyz points as a WFS/vector layer, auto-style by status
- [ ] OSM Tasking Manager project — coordinate community surveying of trig points by map sheet
- [x] AR compass view — camera feed + compass overlay showing nearby trig points with bearing/distance (`/compass`)
- [ ] GitHub Sponsors + Ko-fi — donation links in About page and README
- [ ] Hiking club sponsorships — partner with EOOA, local hiking clubs for fieldwork campaigns
- [ ] NLnet NGI0 Commons Fund application — up to €50k for open data/heritage infrastructure

### Do Later
- [ ] PWA offline mode — cache map tiles + visited point data, sync reports when back online
- [ ] Scrollytelling landing page — animated narrative about trig point heritage
- [ ] Merchandise — stickers, T-shirts, patches via print-on-demand

### Backlog
- [ ] Telegram bot for field reporting
- [ ] Map heatmap layer for report density
- [ ] Statistics per prefecture/region (prefecture column is currently NULL — needs data fix)
- [ ] Route planner — select points and get optimal hiking route
- [ ] Export as SHP (Shapefile) — requires GDAL bindings
- [ ] AI photo analysis — auto-detect trig point condition from uploaded photos
- [ ] Strava/Komoot integration — auto-log visited points from GPS tracks
- [ ] Public read-only API with docs for third-party data consumers
- [ ] Multi-language support beyond el/en (de, fr, etc.)
- [ ] "Adopt a Trig Point" monitoring program
- [ ] Zenodo DOI auto-publish via GitHub Actions (currently manual)
