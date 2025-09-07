const express = require('express');
const router = express.Router();
const multer = require('multer');
const pointsController = require('../controllers/points.controller');
const { ensureAuth } = require('../middleware/auth.middleware');

const upload = multer({ dest: 'uploads/' });

// Public route to get all points
router.get('/', pointsController.getAllPoints);

// Public route to get all reports for a specific point
router.get('/:id/reports', pointsController.getReportsForPoint);

// Protected route to create a new report for a specific point
router.post(
  '/:id/reports',
  ensureAuth,
  upload.single('image'),
  pointsController.createReport
);

module.exports = router;
