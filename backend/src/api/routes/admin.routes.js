const express = require('express');
const router = express.Router();
const adminService = require('../../services/admin.service');
const tagsService = require('../../services/tags.service');
const { ensureAuth, ensureAdmin } = require('../middleware/auth.middleware');

router.use('/api/admin', ensureAuth, ensureAdmin);

router.get('/api/admin/reports', async (req, res) => {
  try {
    const reports = await adminService.getAllReports();
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching all reports for admin:', error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

// GET /api/admin/points - Fetches all point data from the database
router.get('/api/admin/points', async (req, res) => {
  try {
    const points = await adminService.getAllPoints();
    res.status(200).json(points);
  } catch (error) {
    console.error('Error fetching all points for admin:', error);
    res.status(500).json({ message: 'Failed to fetch points' });
  }
});

router.post('/api/admin/reports/:id/approve', async (req, res) => {
  try {
    await adminService.approveReport(req.params.id);
    res.status(200).json({ message: 'Report approved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve report' });
  }
});

router.get('/api/admin/image-stats', async (req, res) => {
  try {
    const stats = await adminService.getImageStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching image stats:', error);
    res.status(500).json({ message: 'Failed to fetch image stats' });
  }
});

router.delete('/api/admin/reports/:id', async (req, res) => {
  try {
    await adminService.deleteReport(req.params.id);
    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete report' });
  }
});

router.get('/api/admin/tags', async (req, res) => {
  try {
    res.status(200).json(await tagsService.listTags());
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Failed to fetch tags' });
  }
});

router.get('/api/admin/points/:gysId/tags', async (req, res) => {
  try {
    res.status(200).json(await tagsService.getTagsForPoint(req.params.gysId));
  } catch (error) {
    console.error('Error fetching point tags:', error);
    res.status(500).json({ message: 'Failed to fetch point tags' });
  }
});

router.post('/api/admin/points/:gysId/tags', async (req, res) => {
  const { slug } = req.body || {};
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ message: 'slug is required' });
  }
  try {
    await tagsService.addTagToPoint(req.params.gysId, slug, req.user.id);
    res.status(204).end();
  } catch (error) {
    if (error.code === '23503') {
      return res.status(404).json({ message: 'Point or tag not found' });
    }
    console.error('Error adding tag to point:', error);
    res.status(500).json({ message: 'Failed to add tag' });
  }
});

router.delete('/api/admin/points/:gysId/tags/:slug', async (req, res) => {
  try {
    const removed = await tagsService.removeTagFromPoint(req.params.gysId, req.params.slug);
    if (!removed) return res.status(404).json({ message: 'Tag not on point' });
    res.status(204).end();
  } catch (error) {
    console.error('Error removing tag from point:', error);
    res.status(500).json({ message: 'Failed to remove tag' });
  }
});

router.get('/api/admin/users', async (req, res) => {
  try {
    const users = await adminService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

module.exports = router;
