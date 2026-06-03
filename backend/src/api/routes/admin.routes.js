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

router.get('/api/admin/users/:id', async (req, res) => {
  try {
    const user = await adminService.getUserDetail(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user detail:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

router.delete('/api/admin/users/:userId/passkeys/:passkeyId', async (req, res) => {
  try {
    const removed = await adminService.deleteUserPasskey(req.params.userId, req.params.passkeyId);
    if (!removed) return res.status(404).json({ message: 'Passkey not found' });
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting passkey:', error);
    res.status(500).json({ message: 'Failed to delete passkey' });
  }
});

router.delete('/api/admin/users/:id/passkeys', async (req, res) => {
  try {
    const count = await adminService.resetUserPasskeys(req.params.id);
    res.status(200).json({ removed: count });
  } catch (error) {
    console.error('Error resetting passkeys:', error);
    res.status(500).json({ message: 'Failed to reset passkeys' });
  }
});

router.patch('/api/admin/users/:id/role', async (req, res) => {
  const { role } = req.body || {};
  if (role !== 'USER' && role !== 'ADMIN') {
    return res.status(400).json({ message: 'role must be USER or ADMIN' });
  }
  if (Number(req.params.id) === req.user.id && role === 'USER') {
    return res.status(400).json({ message: 'You cannot demote yourself' });
  }
  try {
    const updated = await adminService.setUserRole(req.params.id, role);
    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error setting user role:', error);
    res.status(500).json({ message: 'Failed to set role' });
  }
});

router.post('/api/admin/users/:id/recovery-link', async (req, res) => {
  try {
    const result = await adminService.generateUserRecoveryToken(req.params.id);
    if (!result) return res.status(404).json({ message: 'User not found' });
    const origin = process.env.WEBAUTHN_ORIGIN || `${req.protocol}://${req.get('host')}`;
    const url = `${origin.replace(/\/$/, '')}/passkey/recover?token=${result.token}`;
    res.status(200).json({ url, expiresAt: result.expiresAt });
  } catch (error) {
    console.error('Error creating recovery link:', error);
    res.status(500).json({ message: 'Failed to create recovery link' });
  }
});

router.post('/api/admin/users/:id/anonymize', async (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ message: 'You cannot anonymize yourself' });
  }
  try {
    const result = await adminService.anonymizeUser(req.params.id);
    if (!result) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(result);
  } catch (error) {
    console.error('Error anonymizing user:', error);
    res.status(500).json({ message: 'Failed to anonymize user' });
  }
});

router.delete('/api/admin/users/:id', async (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete yourself' });
  }
  try {
    const result = await adminService.hardDeleteUser(req.params.id);
    if (!result) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(result);
  } catch (error) {
    console.error('Error hard-deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

module.exports = router;
