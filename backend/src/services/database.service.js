// backend/src/services/database.service.js
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const { Pool } = require('pg');

// Create the connection pool using the single DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;