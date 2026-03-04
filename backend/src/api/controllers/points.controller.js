const pointsService = require('../../services/points.service');
const { uploadFile } = require('../../services/s3.service');
const { sendNewReportNotification } = require('../../services/email.service');

const getAllPoints = async (req, res) => {
  try {
    // Pass the entire req.query object, which contains bounds, status, order, etc.
    const points = await pointsService.findAllPoints(req.query);
    res.status(200).json(points);
  } catch (error) {
    console.error('Error in getAllPoints controller:', error);
    res.status(500).json({ message: 'Error fetching points' });
  }
};

const VALID_STATUSES = ['OK', 'DAMAGED', 'DESTROYED', 'MISSING', 'UNKNOWN'];

const createReport = async (req, res) => {
  try {
    const { id: pointId } = req.params;
    const { status, comment } = req.body;
    const userId = req.user.id;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }
    if (comment && comment.length > 1000) {
      return res.status(400).json({ message: 'Comment must be 1000 characters or fewer.' });
    }
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadFile(req.file);
    }
    const report = await pointsService.addReportToPoint({
      pointId,
      userId,
      status,
      comment,
      imageUrl,
    });

    // Non-blocking admin email notification
    pointsService.findPointById(pointId).then(p => {
      if (p) sendNewReportNotification({ point: p, report, user: req.user });
    }).catch(() => {});

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
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);
    if (isNaN(parsedLat) || isNaN(parsedLon)) {
      return res.status(400).json({ message: 'Invalid latitude or longitude.' });
    }
    const point = await pointsService.findNearestPoint(parsedLat, parsedLon);
    res.status(200).json(point);
  } catch (error) {
    console.error('Error in getNearestPoint controller:', error);
    res.status(500).json({ message: 'Error finding nearest point' });
  }
};

const getPointByGysId = async (req, res) => {
  try {
    const point = await pointsService.findPointByGysId(req.params.gysId);
    if (!point) {
      return res.status(404).json({ message: 'Point not found' });
    }
    res.status(200).json(point);
  } catch (error) {
    console.error('Error finding point by GYS ID:', error);
    res.status(500).json({ message: 'Error finding point' });
  }
};

module.exports = {
  getAllPoints,
  createReport,
  getReportsForPoint,
  searchPoints,
  getNearestPoint,
  getPointByGysId,
};