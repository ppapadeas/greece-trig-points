const express = require('express');
const router = express.Router();
const statsService = require('../../services/stats.service');

router.get('/api/stats', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=3600');
    const stats = await statsService.getDashboardStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

router.get('/api/activity', async (req, res) => {
  try {
    const activity = await statsService.getRecentActivity();
    res.status(200).json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ message: 'Error fetching activity' });
  }
});

router.get('/api/stats/timeline', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=3600');
    const timeline = await statsService.getReportTimeline();
    res.status(200).json(timeline);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ message: 'Error fetching timeline' });
  }
});

module.exports = router;