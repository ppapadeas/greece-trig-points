const express = require('express');
const router = express.Router();
const userService = require('../../services/user.service');

router.get('/api/users/:userId', async (req, res) => {
  try {
    const profile = await userService.getUserProfile(req.params.userId);
    if (!profile) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

router.get('/api/users/:userId/reports', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = parseInt(req.query.offset, 10) || 0;
    const reports = await userService.getUserReports(req.params.userId, limit, offset);
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ message: 'Error fetching user reports' });
  }
});

module.exports = router;
