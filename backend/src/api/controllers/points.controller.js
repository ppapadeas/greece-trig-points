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
    const { q } = req.query; // Get the search term from the URL query string
    if (!q) {
      return res.json([]); // Return empty array if search is empty
    }
    const results = await pointsService.searchPointsByName(q);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error in searchPoints controller:', error);
    res.status(500).json({ message: 'Error searching for points' });
  }
};

module.exports = {
  getAllPoints,
  createReport,
  getReportsForPoint,
  searchPoints,
};