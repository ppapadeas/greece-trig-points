const express = require('express');
const router = express.Router();
const multer = require('multer');
const pointsController = require('../controllers/points.controller');
const { ensureAuth } = require('../middleware/auth.middleware');

// Configure multer to store files in memory as buffers for cloud upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Public route to get points for the map (can be filtered by bounds)
router.get('/', pointsController.getAllPoints);

// Public route to find the nearest point to a given coordinate
router.get('/nearest', pointsController.getNearestPoint);

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
  upload.single('image'), // Use the new multer config
  pointsController.createReport
);

module.exports = router;