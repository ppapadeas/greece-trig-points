# Hellas Trig Points | vathra.gr

![A screenshot of the vathra.gr map interface, showing clustered points over Greece and the details sidebar open.](https://i.imgur.com/3LeAtEK.png) A crowd-sourced, interactive map dedicated to documenting the status and accessibility of the Hellenic Army Geographical Service (ΓΥΣ) trigonometric points across Greece. This project aims to create a living archive for surveyors, hikers, and history enthusiasts.

### ✨ **Live Demo**

The project is deployed and accessible at: **[https://vathra.gr](https://vathra.gr)**

---

## ## Features

* **Interactive Map**: A fast, mobile-friendly map displaying over 25,000 trigonometric points.
* **Marker Clustering**: Efficiently handles a large number of points for a smooth, high-performance user experience.
* **Custom Styling**: Markers are color-coded based on their reported status (OK, Damaged, Unknown, etc.).
* **Geolocation**: A "Find My Location" button to center the map on the user's current position and highlight the nearest point.
* **Search**: A search bar to quickly find points by name/ID and fly the map to the location.
* **Map Layers**: Switch between a clean map view and a high-resolution satellite view.
* **Detailed Sidebar**: Clicking a point reveals a sidebar with detailed information, coordinates (WGS84 & ΕΓΣΑ87), and a history of user reports and photos.
* **Statistics Page**: A dashboard with charts and stats on point statuses, user contributions, and more.
* **Social Login**: Easy and secure user authentication via Google accounts.
* **User Contributions**: Logged-in users can submit status updates, add comments, and upload photos.
* **Admin Panel**: A protected dashboard for administrators to view, approve, and reject user-submitted reports.
* **Responsive Design**: The UI is fully responsive and mobile-friendly.

---

## ## Tech Stack

This project is built with a modern, full-stack architecture.

* **Frontend**: React (with Vite), Leaflet, MUI (Material UI), Recharts
* **Backend**: Node.js, Express.js, Passport.js for authentication
* **Database**: PostgreSQL with the PostGIS extension for geospatial data
* **Containerization**: Docker & Docker Compose
* **Deployment**: Backend on Koyeb, Frontend on Vercel

---

## ## Getting Started

To run this project locally, you will need **Docker Desktop** installed.

1.  **Clone the repository:**
    ```bash
    git clone [https://gitlab.com/pierros/greece-trig-points.git](https://gitlab.com/pierros/greece-trig-points.git)
    cd greece-trig-points
    ```

2.  **Configure Environment:**
    * Create a `.env` file in the root directory by copying `.env.example`.
    * Fill in your Google OAuth credentials and create a session secret.

3.  **Build and Start the Application:**
    * From the root directory, run:
        ```bash
        docker-compose up -d --build
        ```

4.  **Set Up the Database (First time only):**
    * Wait about 15 seconds for the database to initialize.
    * Run the migrations and the seeder script:
        ```bash
        docker-compose exec backend npm run migrate up
        docker-compose exec backend npm run seed
        ```

5.  **Run the Frontend Server:**
    * In a new terminal, navigate to the `frontend` directory and run `npm run dev`.

The application will be available at `http://localhost:5173`.

---

## ## License

This project is open source and licensed under the **GNU AGPLv3**. See the [LICENSE](LICENSE) file for details.