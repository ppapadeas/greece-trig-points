const pointsService = require('../../services/points.service');

const getAllPoints = async (req, res) => {
  try {
    const points = await pointsService.findAllPoints();
    res.status(200).json(points);
  } catch (error) {
    console.error('Error in getAllPoints controller:', error);
    res.status(500).json({ message: 'Error fetching points' });
  }
};

const createReport = async (req, res) => {
  try {
    const { id: pointId } = req.params;
    const { status, comment } = req.body;
    const userId = req.user.id;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const report = await pointsService.addReportToPoint({
      pointId,
      userId,
      status,
      comment,
      imageUrl,
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Error in createReport controller:', error);
    res.status(500).json({ message: 'Error creating report' });
  }
};

const getReportsForPoint = async (req, res) => {
  try {
    const { id: pointId } = req.params;
    const reports = await pointsService.findReportsByPointId(pointId);
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error in getReportsForPoint controller:', error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
};

const searchPoints = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.json([]);
    }
    const results = await pointsService.searchPointsByName(q);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error in searchPoints controller:', error);
    res.status(500).json({ message: 'Error searching for points' });
  }
};

const getNearestPoint = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
    const point = await pointsService.findNearestPoint(parseFloat(lat), parseFloat(lon));
    res.status(200).json(point);
  } catch (error) {
    console.error('Error in getNearestPoint controller:', error);
    res.status(500).json({ message: 'Error finding nearest point' });
  }
};

module.exports = {
  getAllPoints,
  createReport,
  getReportsForPoint,
  searchPoints,
  getNearestPoint,
};