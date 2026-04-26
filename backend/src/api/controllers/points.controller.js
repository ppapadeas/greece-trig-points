const pointsService = require('../../services/points.service');
const { uploadFile } = require('../../services/s3.service');

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

// observed_at must be a YYYY-MM-DD string between 1900-01-01 and tomorrow
// (tomorrow buys some timezone slack so we don't reject "today" on the client).
function parseObservedAt(raw) {
  if (raw == null || raw === '') return { value: null };
  if (typeof raw !== 'string') return { error: 'observed_at must be a date string' };
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return { error: 'observed_at must be YYYY-MM-DD' };
  const d = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return { error: 'observed_at is not a valid date' };
  const tomorrow = new Date();
  tomorrow.setUTCHours(0, 0, 0, 0);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (d > tomorrow) return { error: 'observed_at cannot be in the future' };
  if (d.getUTCFullYear() < 1900) return { error: 'observed_at must be 1900 or later' };
  return { value: raw };
}

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
    const files = req.files || [];
    const imageUrls = await Promise.all(files.map(f => uploadFile(f)));

    // Tag deltas come in as JSON-stringified arrays in the multipart body
    const parseTagArray = (raw) => {
      if (!raw) return [];
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(parsed) ? parsed.filter(s => typeof s === 'string') : [];
      } catch { return []; }
    };
    const tagsAdded = parseTagArray(req.body.tags_added);
    const tagsRemoved = parseTagArray(req.body.tags_removed);

    const observed = parseObservedAt(req.body.observed_at);
    if (observed.error) return res.status(400).json({ message: observed.error });

    const report = await pointsService.addReportToPoint({
      pointId,
      userId,
      status,
      comment,
      imageUrls,
      tagsAdded,
      tagsRemoved,
      observedAt: observed.value,
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

const getNearestUnvisited = async (req, res) => {
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
    const point = await pointsService.findNearestUnvisited(parsedLat, parsedLon);
    if (!point) {
      return res.status(404).json({ message: 'No unvisited points found' });
    }
    res.status(200).json(point);
  } catch (error) {
    console.error('Error in getNearestUnvisited controller:', error);
    res.status(500).json({ message: 'Error finding nearest unvisited point' });
  }
};

const getNearbyPoints = async (req, res) => {
  try {
    const { lat, lon, radius } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);
    if (isNaN(parsedLat) || isNaN(parsedLon)) {
      return res.status(400).json({ message: 'Invalid latitude or longitude.' });
    }
    const parsedRadius = Math.min(Math.max(parseInt(radius) || 5000, 100), 20000);
    const points = await pointsService.findNearbyPoints(parsedLat, parsedLon, parsedRadius);
    res.status(200).json(points);
  } catch (error) {
    console.error('Error in getNearbyPoints controller:', error);
    res.status(500).json({ message: 'Error finding nearby points' });
  }
};

const updateReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, comment } = req.body;
    const userId = req.user.id;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }
    if (comment && comment.length > 1000) {
      return res.status(400).json({ message: 'Comment must be 1000 characters or fewer.' });
    }

    const files = req.files || [];
    // If new files uploaded, replace images; otherwise pass null to keep existing
    const imageUrls = files.length > 0
      ? await Promise.all(files.map(f => uploadFile(f)))
      : null;

    const observed = parseObservedAt(req.body.observed_at);
    if (observed.error) return res.status(400).json({ message: observed.error });

    const report = await pointsService.updateReport({ reportId, userId, status, comment, imageUrls, observedAt: observed.value });
    if (!report) return res.status(404).json({ message: 'Report not found or not yours.' });

    res.status(200).json(report);
  } catch (error) {
    console.error('Error in updateReport controller:', error);
    res.status(500).json({ message: 'Error updating report' });
  }
};

const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;

    const deleted = await pointsService.deleteReport({ reportId, userId });
    if (!deleted) return res.status(404).json({ message: 'Report not found or not yours.' });

    res.status(204).end();
  } catch (error) {
    console.error('Error in deleteReport controller:', error);
    res.status(500).json({ message: 'Error deleting report' });
  }
};

module.exports = {
  getAllPoints,
  createReport,
  updateReport,
  deleteReport,
  getReportsForPoint,
  searchPoints,
  getNearestPoint,
  getNearestUnvisited,
  getNearbyPoints,
  getPointByGysId,
};