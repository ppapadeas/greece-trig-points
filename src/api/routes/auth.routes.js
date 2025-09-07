const express = require('express');
const passport = require('passport');
const router = express.Router();

// Route to start the Google authentication process
router.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// The callback route that Google redirects to after successful login
router.get('/auth/google/callback', 
  passport.authenticate('google'),
  (req, res) => {
    // Redirect to the frontend application after successful login
    res.redirect('http://localhost:5173');
  }
);

// Route to check if a user is logged in and get their data
router.get('/api/me', (req, res) => {
  if (req.user) {
    res.send(req.user);
  } else {
    res.status(401).send({ message: 'Not authenticated' });
  }
});

// Route to log the user out
router.get('/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('http://localhost:5173');
  });
});

module.exports = router;
