const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const pointsController = require('../controllers/points.controller');
const tagsService = require('../../services/tags.service');
const { ensureAuth } = require('../middleware/auth.middleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 3 }, // 10MB per file, max 3
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

// Public tag catalog (list of all tags with labels/icon/category) — served at /api/points/tags
// Long cache: tag taxonomy changes very rarely
router.get('/tags', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=3600');
    res.json(await tagsService.listTags());
  } catch (e) {
    console.error('Error listing tags:', e);
    res.status(500).json({ message: 'Failed to fetch tags' });
  }
});

// Public route to get points for the map (can be filtered by bounds)
// Points rarely change — 5 minute cache reduces redundant DB queries
const cachePoints = (req, res, next) => { res.set('Cache-Control', 'public, max-age=300'); next(); };
router.get('/', cachePoints, pointsController.getAllPoints);

// Public route to find the nearest point to a given coordinate
router.get('/nearest', pointsController.getNearestPoint);

// Public route to find the nearest point with no reports
router.get('/nearest-unvisited', pointsController.getNearestUnvisited);

// Public route to find nearby points within a radius (for AR compass)
router.get('/nearby', pointsController.getNearbyPoints);

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
  upload.array('images', 3),
  pointsController.createReport
);

// Protected route to update own report (status, comment, optionally replace images)
router.put(
  '/:id/reports/:reportId',
  ensureAuth,
  upload.array('images', 3),
  pointsController.updateReport
);

// Protected route to delete own report
router.delete(
  '/:id/reports/:reportId',
  ensureAuth,
  pointsController.deleteReport
);

module.exports = router;