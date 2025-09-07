if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const pg = require('pg');
const connectPgSimple = require('connect-pg-simple');

require('./src/config/passport');
const pointsRouter = require('./src/api/routes/points.routes');
const authRouter = require('./src/api/routes/auth.routes');

const app = express();

// --- Middleware Setup ---
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));
app.use('/uploads', express.static('uploads'));

// Create a session store that uses our PostgreSQL database with SSL
const pgPool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
const sessionStore = new (connectPgSimple(session))({ pool: pgPool });

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
  })
);

app.use(passport.initialize());
app.use(passport.session());

const port = process.env.PORT || 8080;

// --- Routes ---
app.use(authRouter);
app.use('/api/points', pointsRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
