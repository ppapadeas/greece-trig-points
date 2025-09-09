const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send({ message: 'You must be logged in to do that.' });
};

const ensureAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    return next();
  }
  res.status(403).send({ message: 'Forbidden: You do not have admin privileges.' });
};

module.exports = {
  ensureAuth,
  ensureAdmin,
};
