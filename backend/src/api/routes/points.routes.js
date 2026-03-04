const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const pointsController = require('../controllers/points.controller');
const { ensureAuth } = require('../middleware/auth.middleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many reports submitted, please try again later.' },
});

// Public route to get points for the map (can be filtered by bounds)
router.get('/', pointsController.getAllPoints);

// Public route to find the nearest point to a given coordinate
router.get('/nearest', pointsController.getNearestPoint);

// Public route to find the nearest point with no reports
router.get('/nearest-unvisited', pointsController.getNearestUnvisited);

// Public route to search for points by name/ID
router.get('/search', pointsController.searchPoints);

// Public route to get a single point by its GYS ID (for permalinks)
router.get('/:gysId', pointsController.getPointByGysId);

// Public route to get all reports for a specific point
router.get('/:id/reports', pointsController.getReportsForPoint);

// Protected route to create a new report for a specific point
router.post(
  '/:id/reports',
  ensureAuth,
  reportLimiter,
  upload.single('image'),
  pointsController.createReport
);

module.exports = router;