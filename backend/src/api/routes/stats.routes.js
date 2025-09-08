const express = require('express');
const router = express.Router();
const statsService = require('../../services/stats.service');

router.get('/api/stats', async (req, res) => {
  try {
    const stats = await statsService.getDashboardStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

module.exports = router;