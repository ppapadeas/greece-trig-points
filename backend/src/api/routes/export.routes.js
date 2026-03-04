const express = require('express');
const router = express.Router();
const exportService = require('../../services/export.service');

// GET /api/export/csv
router.get('/csv', async (req, res) => {
  try {
    const rows = await exportService.getAllPointsForExport();
    const csv = exportService.toCSV(rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="gys_points.csv"');
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8 support
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ message: 'Export failed' });
  }
});

// GET /api/export/kml
router.get('/kml', async (req, res) => {
  try {
    const rows = await exportService.getAllPointsForExport();
    const kml = exportService.toKML(rows);
    res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
    res.setHeader('Content-Disposition', 'attachment; filename="gys_points.kml"');
    res.send(kml);
  } catch (err) {
    console.error('KML export error:', err);
    res.status(500).json({ message: 'Export failed' });
  }
});

// GET /api/export/gpx?status=OK,DAMAGED&order=I,II&bbox=minLon,minLat,maxLon,maxLat
router.get('/gpx', async (req, res) => {
  try {
    const rows = await exportService.getFilteredPointsForExport(req.query);
    const gpx = exportService.toGPX(rows);
    res.setHeader('Content-Type', 'application/gpx+xml');
    res.setHeader('Content-Disposition', 'attachment; filename="vathra-points.gpx"');
    res.send(gpx);
  } catch (err) {
    console.error('GPX export error:', err);
    res.status(500).json({ message: 'Export failed' });
  }
});

module.exports = router;
