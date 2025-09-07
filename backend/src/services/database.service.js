// backend/src/services/database.service.js
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const { Pool } = require('pg');

// Create the connection pool with SSL enabled for production
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

module.exports = pool;