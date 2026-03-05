if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('passport');
const pg = require('pg');
const connectPgSimple = require('connect-pg-simple');

require('./src/config/passport');
const pointsRouter = require('./src/api/routes/points.routes');
const authRouter = require('./src/api/routes/auth.routes');
const statsRouter = require('./src/api/routes/stats.routes');
const adminRouter = require('./src/api/routes/admin.routes');
const exportRouter = require('./src/api/routes/export.routes');
const usersRouter = require('./src/api/routes/users.routes');
const passkeyRouter = require('./src/api/routes/passkey.routes');

const app = express();

app.set('trust proxy', 1);
app.use(compression());
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many reports submitted, please try again later.' },
});

app.use('/api/', apiLimiter);

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
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

const port = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.send('Welcome to the vathra.xyz API!');
});

// --- Routes ---
app.use(authRouter);
app.use(statsRouter);
app.use(adminRouter);
app.use('/api/points', pointsRouter);
app.use('/api/export', exportRouter);
app.use(usersRouter);
app.use(passkeyRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
