# Development Roadmap

## Completed

### Security / Infrastructure
- [x] Add `express.json()` body parser middleware (`backend/index.js`)
- [x] Add `frontend/vercel.json` SPA rewrite rules (React Router direct links were 404ing)

### Statistics Page (Phase 1 — Layout & i18n)
- [x] Fix MUI Grid API: `Grid` with `size={}` prop (MUI v7, Grid2 doesn't exist)
- [x] Status donut chart (was solid pie) with custom tooltip showing count + %
- [x] Translated status labels in chart legend (was hardcoded English)
- [x] Split layout: chart left (7/12) + top contributors right (5/12)
- [x] Gold/silver/bronze trophy icons for top 3 contributors
- [x] Fallback avatar initials for users without profile picture
- [x] All strings translated via i18n (el + en)

### Statistics Page (Phase 2 — New Data)
- [x] Backend: prefecture breakdown query (top 15 by count)
- [x] Backend: geodetic order breakdown query (I/II/III/IV)
- [x] Backend: include `profile_picture_url` in topUsers query
- [x] Frontend: horizontal bar chart — points by prefecture
- [x] Frontend: donut chart — points by geodetic order

---

## Pending

### Phase 3 — Statistics Polish
- [ ] Skeleton loaders instead of CircularProgress
- [ ] "Coverage" stat card — % of points with at least one report
- [ ] Mobile responsiveness check on charts (especially bar chart with long prefecture names)

### Security Hardening
- [ ] Rate limiting — `express-rate-limit` on report POST + search routes
- [ ] File upload validation — multer `fileFilter` (images only) + `limits` (5MB max)
- [ ] Input validation — whitelist `status` enum values, cap `comment` length
- [ ] `lat`/`lon` isNaN guard in getNearestPoint controller
- [ ] `helmet` middleware for security headers
- [ ] Move `dotenv-cli` to devDependencies

### Future Features
- [ ] Time-series chart — reports submitted over time
- [ ] Map heatmap layer for report density
- [ ] User profile page with their own report history
- [ ] Email notifications for admin on new reports
