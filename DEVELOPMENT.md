# Development Roadmap

## Priority

- [ ] QGIS Plugin — load vathra.xyz points as a WFS/vector layer, auto-style by status
- [ ] OSM Tasking Manager project — coordinate community surveying of trig points by map sheet
- [ ] Hiking club sponsorships — partner with EOOA, local hiking clubs for fieldwork campaigns

## Next

- [ ] PWA offline mode — cache map tiles + visited point data, sync reports when back online
- [ ] Public read-only API with OpenAPI docs for third-party data consumers
- [ ] OGC WFS 2.0 endpoint (INSPIRE-compliant) via pygeoapi or pg_featureserv
- [ ] Zenodo DOI auto-publish via GitHub Actions (currently manual)
- [ ] Export as SHP (Shapefile) — requires GDAL bindings

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
- [x] Replace leaflet.markercluster with Supercluster + Canvas renderer (0 FPS freezes → smooth)
- [x] Code splitting with React.lazy — initial bundle 1,781KB → 429KB
- [x] Vite manual chunks — MUI, Recharts, Leaflet split into cacheable vendor chunks
- [x] SuperclusterLayer marker diffing — only add/remove changed markers on pan/zoom
- [x] Client-side filtering — fetch all points once, filter with useMemo
- [x] HTTP cache headers — /api/points 5min, /api/stats 1hr
- [x] Sidebar memoization — React.memo + useCallback for stable props
- [x] Database pool config — explicit 20 max connections, 30s idle timeout
