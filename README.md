# 🏔️ Hellas Trig Points | vathra.xyz

<p align="center">
  <img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" alt="License">
  <a href="https://doi.org/10.31223/X5VN13"><img src="https://img.shields.io/badge/DOI-10.31223%2FX5VN13-blue?logo=doi" alt="EarthArXiv Preprint"></a>
  <a href="https://doi.org/10.5281/zenodo.17111961"><img src="https://img.shields.io/badge/DOI-10.5281%2Fzenodo.17111961-blue?logo=zenodo" alt="Zenodo Dataset"></a>
  <img src="https://img.shields.io/badge/react-19-blue.svg?logo=react" alt="React">
  <img src="https://img.shields.io/badge/node.js-20.x-green.svg?logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/postgres-17-blue.svg?logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/docker-enabled-blue.svg?logo=docker" alt="Docker">
</p>

<p align="center">
  🗺️ A crowd-sourced, interactive map dedicated to documenting the Hellenic Army Geographical Service (ΓΥΣ) trigonometric points across Greece.
</p>

<p align="center">
  <a href="#-live-demo"><strong>🌐 Live Demo</strong></a> ·
  <a href="#-features">✨ Features</a> ·
  <a href="#%EF%B8%8F-tech-stack">🛠️ Tech Stack</a> ·
  <a href="#-paper">📄 Paper</a> ·
  <a href="#-getting-started">🚀 Getting Started</a> ·
  <a href="#-support">💖 Support</a> ·
  <a href="#-license">📝 License</a>
</p>

<p align="center">
  <img src="https://i.imgur.com/vetM4xI.png" alt="A screenshot of the vathra.xyz map interface" width="80%">
</p>

---

### 🌐 Live Demo

The project is deployed and accessible at: **[https://vathra.xyz](https://vathra.xyz)**

---

## ✨ Features

* 🗺️ **Interactive Map** — A fast, mobile-friendly map displaying over 25,000 trigonometric points
* 📍 **Marker Clustering** — Efficiently handles a large number of points for a smooth experience
* 🎨 **Custom Styling** — Markers are color-coded and sized based on status and geodetic order
* 📡 **Geolocation** — "Find My Location" button to center the map and highlight the nearest point
* 🔍 **Search** — Quickly find points by name/ID and fly the map to the location
* 🗂️ **Map Layers** — Switch between Map, Topographic, and Satellite views
* 📋 **Detailed Sidebar** — Point information, coordinates (WGS84 & ΕΓΣΑ87), report history, and photos
* 📊 **Statistics Page** — Dashboard with charts on point statuses, contributions, and coverage
* 🧭 **AR Compass** — Camera-based augmented reality view showing nearby points with direction and distance
* 🔐 **Authentication** — Sign in with Google OAuth or passwordless Passkeys (WebAuthn/FIDO2)
* 📝 **User Contributions** — Submit status updates, add comments, and upload photos
* 🛡️ **Admin Panel** — Dashboard for administrators to review and moderate reports
* 📱 **Responsive Design** — Fully responsive and mobile-friendly using Material UI
* 🔗 **SEO & Social** — Dynamic OG images, structured data (JSON-LD), sitemaps, and per-point link previews
* 📈 **Privacy Analytics** — Plausible-powered, cookie-free visitor analytics

---

## 🛠️ Tech Stack

* **Frontend**: React 19 (Vite), Leaflet, MUI (Material UI), Recharts, react-helmet-async
* **Backend**: Node.js, Express 5, Passport.js, @simplewebauthn/server
* **Database**: PostgreSQL 17 with PostGIS (hosted on Supabase)
* **Containerization**: Docker & Docker Compose for local development
* **Deployment**:
    * 🖥️ **Frontend**: Vercel (with serverless functions for OG images & sitemaps)
    * ⚙️ **Backend**: Fly.io (Frankfurt)
    * 🔄 **CI/CD**: GitHub Actions

---

## 📄 Paper

This project is described in a preprint published on EarthArXiv:

> Papadeas, P. (2026). *vathra.xyz — Crowdsourced Monitoring of Greece's Geodetic Heritage: Architecture, Empirical Results, and Legal Framework*. EarthArXiv. https://doi.org/10.31223/X5VN13

The paper covers the platform architecture, empirical results from the first six months of operation, and the EU/Greek legal framework governing the reuse of geodetic data.

### 📚 Citing

If you use this software or dataset in your research, please cite:

```bibtex
@article{papadeas2026vathra,
  title   = {vathra.xyz --- Crowdsourced Monitoring of Greece's Geodetic Heritage:
             Architecture, Empirical Results, and Legal Framework},
  author  = {Papadeas, Pierros},
  year    = {2026},
  doi     = {10.31223/X5VN13},
  journal = {EarthArXiv (preprint)},
  url     = {https://doi.org/10.31223/X5VN13}
}
```

The dataset is archived on Zenodo: [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.17111961.svg)](https://doi.org/10.5281/zenodo.17111961)

---

## 🚀 Getting Started

To run this project locally, you will need **Docker Desktop** installed.

### 1. Clone the Repository
```bash
git clone https://github.com/ppapadeas/greece-trig-points.git
cd greece-trig-points
```

### 2. Configure Environment

Create a `.env` file in the root directory by copying the `.env.example` file.

```bash
cp .env.example .env
```

Fill in the required variables in the `.env` file (like your Google OAuth credentials).

### 3. Build and Start the Application

From the root directory, run:

```bash
docker-compose up -d --build
```

### 4. Set Up the Database (First time only)

Wait about 15-20 seconds for the database to initialize, then run the migrations and the setup script:

```bash
docker-compose exec backend npm run migrate up
docker-compose exec backend npm run db:setup
```

### 5. Run the Frontend Server

In a new terminal, navigate to the `frontend` directory and run `npm run dev`.

```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 💖 Support

vathra.xyz is a volunteer-run, self-funded project. If you find it useful, consider supporting its development:

<a href="https://ko-fi.com/papadeas"><img src="https://img.shields.io/badge/Ko--fi-Support-FF5E5B?logo=ko-fi&logoColor=white" alt="Ko-fi"></a>
<a href="https://github.com/sponsors/ppapadeas"><img src="https://img.shields.io/badge/GitHub_Sponsors-Support-EA4AAA?logo=github-sponsors&logoColor=white" alt="GitHub Sponsors"></a>

Join our community on Discord: [![Discord](https://img.shields.io/badge/Discord-Join-5865F2?logo=discord&logoColor=white)](https://discord.gg/Kqn3UEZsGp)

---

## 📝 License

This project is open source and licensed under the **GNU AGPLv3**. See the [LICENSE](LICENSE) file for details.
