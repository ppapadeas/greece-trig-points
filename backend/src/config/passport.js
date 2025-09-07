const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../services/database.service');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { id, displayName, emails, photos } = profile;
        const email = emails[0].value;
        const profilePicture = photos[0].value;

        const existingUserResult = await pool.query('SELECT * FROM users WHERE google_id = $1', [id]);

        if (existingUserResult.rows.length > 0) {
          return done(null, existingUserResult.rows[0]);
        }

        const newUserResult = await pool.query(
          'INSERT INTO users (google_id, email, display_name, profile_picture_url) VALUES ($1, $2, $3, $4) RETURNING *',
          [id, email, displayName, profilePicture]
        );
        
        return done(null, newUserResult.rows[0]);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, userResult.rows[0]);
  } catch (err) {
    done(err, null);
  }
});
