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
const statsRouter = require('./src/api/routes/stats.routes');

const app = express();

// --- Middleware Setup ---
// This tells Express to trust the proxy that Koyeb uses
app.set('trust proxy', 1); 

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));
app.use('/uploads', express.static('uploads'));

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
    // --- THIS IS THE CRITICAL FIX ---
    cookie: { 
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

const port = process.env.PORT || 8080;

// --- Routes ---
app.use(authRouter);
app.use(statsRouter);
app.use('/api/points', pointsRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});