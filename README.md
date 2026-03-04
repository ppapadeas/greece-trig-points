# Hellas Trig Points | vathra.xyz

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
  A crowd-sourced, interactive map dedicated to documenting the Hellenic Army Geographical Service (ΓΥΣ) trigonometric points across Greece.
</p>

<p align="center">
  <a href="#-live-demo"><strong>Live Demo</strong></a> ·
  <a href="#-features">Features</a> ·
  <a href="#-tech-stack">Tech Stack</a> ·
  <a href="#-paper">Paper</a> ·
  <a href="#-getting-started">Getting Started</a> ·
  <a href="#-deployment">Deployment</a> ·
  <a href="#-license">License</a>
</p>

<p align="center">
  <img src="https://i.imgur.com/vetM4xI.png" alt="A screenshot of the vathra.xyz map interface" width="80%">
</p>
---

### ✨ Live Demo

The project is deployed and accessible at: **[https://vathra.xyz](https://vathra.xyz)**

---

## Features

* **Interactive Map**: A fast, mobile-friendly map displaying over 25,000 trigonometric points.
* **Marker Clustering**: Efficiently handles a large number of points for a smooth, high-performance user experience.
* **Custom Styling**: Markers are color-coded and sized based on their reported status and geodetic order.
* **Geolocation**: A "Find My Location" button to center the map on the user's current position and highlight the nearest point.
* **Search**: A search bar to quickly find points by name/ID and fly the map to the location.
* **Map Layers**: Switch between Map, Topographic, and Satellite views.
* **Detailed Sidebar**: Clicking a point reveals a sidebar with detailed information, coordinates (WGS84 & ΕΓΣΑ87), and a history of user reports and photos.
* **Statistics Page**: A dashboard with charts and stats on point statuses, user contributions, and more.
* **Social Login**: Easy and secure user authentication via Google accounts.
* **User Contributions**: Logged-in users can submit status updates, add comments, and upload photos.
* **Admin Panel**: A protected dashboard for administrators to view, approve, and reject user-submitted reports, as well as a full data table of all points.
* **Responsive Design**: The UI is fully responsive and mobile-friendly using Material UI.

---

## Tech Stack

This project is built with a modern, full-stack architecture.

* **Frontend**: React 19 (Vite), Leaflet, MUI (Material UI), Recharts
* **Backend**: Node.js, Express.js, Passport.js
* **Database**: PostgreSQL with the PostGIS extension (hosted on Supabase)
* **Containerization**: Docker & Docker Compose for local development
* **Deployment**:
    * **Frontend**: Vercel
    * **Backend**: Fly.io
    * **CI/CD**: GitHub Actions

---

## Paper

This project is described in a peer-reviewed preprint published on EarthArXiv:

> Papadeas, P. (2026). *vathra.xyz — Crowdsourced Monitoring of Greece's Geodetic Heritage: Architecture, Empirical Results, and Legal Framework*. EarthArXiv. https://doi.org/10.31223/X5VN13

The paper covers the platform architecture, empirical results from the first six months of operation, and the EU/Greek legal framework governing the reuse of geodetic data.

### Citing

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

## Getting Started

To run this project locally, you will need **Docker Desktop** installed.

### 1. Clone the Repository
```bash
git clone [https://github.com/ppapadeas/greece-trig-points.git](https://github.com/ppapadeas/greece-trig-points.git)
cd greece-trig-points
````

### 2\. Configure Environment

Create a `.env` file in the root directory by copying the `.env.example` file.

```bash
cp .env.example .env
```

Fill in the required variables in the `.env` file (like your Google OAuth credentials).

### 3\. Build and Start the Application

From the root directory, run:

```bash
docker-compose up -d --build
```

### 4\. Set Up the Database (First time only)

Wait about 15-20 seconds for the database to initialize, then run the migrations and the setup script:

```bash
# From the root directory
docker-compose exec backend npm run migrate up
docker-compose exec backend npm run db:setup
```

### 5\. Run the Frontend Server

In a new terminal, navigate to the `frontend` directory and run `npm run dev`.

```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`.

-----

## License

This project is open source and licensed under the **GNU AGPLv3**. See the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.
