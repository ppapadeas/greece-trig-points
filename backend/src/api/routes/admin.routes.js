const express = require('express');
const router = express.Router();
const adminService = require('../../services/admin.service');
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

router.post('/api/admin/reports/:id/approve', async (req, res) => {
  try {
    await adminService.approveReport(req.params.id);
    res.status(200).json({ message: 'Report approved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve report' });
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

module.exports = router;
