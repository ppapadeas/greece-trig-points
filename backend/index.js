require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');

// Import configurations and routes
require('./src/config/passport');
const pointsRouter = require('./src/api/routes/points.routes');
const authRouter = require('./src/api/routes/auth.routes');

const app = express();

// --- Middleware Setup ---
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  })
);

app.use(passport.initialize());
app.use(passport.session());

const port = process.env.PORT || 3001;

// --- Routes ---
app.use(authRouter);
app.use('/api/points', pointsRouter);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
