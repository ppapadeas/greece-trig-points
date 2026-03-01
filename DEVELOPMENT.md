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

### Performance
- [x] Bounds-based point loading — MapPage sends viewport bounds; BoundsWatcher fires on moveend/zoomend; AbortController cancels stale requests
- [x] DB indexes on `points(status)` and `points(point_order)` via migration `1772406755095`
- [x] Fix LocationButton listener leak — `map.off()` before `map.on()`

### Data Export (requested by community)
- [ ] Export points as CSV with coordinates and attributes
- [ ] Export as SHP (Shapefile)
- [ ] Export as KMZ

### Future Features
- [ ] Time-series chart — reports submitted over time
- [ ] Map heatmap layer for report density
- [ ] User profile page with their own report history
- [ ] Statistics per prefecture/region (prefecture column is currently NULL — needs data fix)
- [ ] Email notifications for admin on new reports
- [ ] Route planner — select points and get optimal hiking route
