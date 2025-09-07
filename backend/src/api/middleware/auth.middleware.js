const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send({ message: 'You must be logged in to do that.' });
};

module.exports = { ensureAuth };
