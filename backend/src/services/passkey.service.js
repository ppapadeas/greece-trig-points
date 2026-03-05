const pool = require('./database.service');

const getCredentialsByUserId = async (userId) => {
  const { rows } = await pool.query(
    'SELECT id, credential_id, device_name, created_at FROM passkey_credentials WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return rows;
};

const getCredentialByCredentialId = async (credentialId) => {
  const { rows } = await pool.query(
    `SELECT pc.*, u.id as uid, u.email, u.display_name, u.profile_picture_url, u.role
     FROM passkey_credentials pc
     JOIN users u ON pc.user_id = u.id
     WHERE pc.credential_id = $1`,
    [credentialId]
  );
  return rows[0] || null;
};

const getAllCredentialIdsForUser = async (userId) => {
  const { rows } = await pool.query(
    'SELECT credential_id, transports FROM passkey_credentials WHERE user_id = $1',
    [userId]
  );
  return rows;
};

const saveCredential = async (userId, { credentialId, publicKey, counter, transports, deviceName }) => {
  const { rows } = await pool.query(
    `INSERT INTO passkey_credentials (user_id, credential_id, public_key, counter, transports, device_name)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, credentialId, publicKey, counter, transports || [], deviceName || null]
  );
  return rows[0];
};

const updateCredentialCounter = async (credentialId, newCounter) => {
  await pool.query(
    'UPDATE passkey_credentials SET counter = $1 WHERE credential_id = $2',
    [newCounter, credentialId]
  );
};

const deleteCredential = async (credentialId, userId) => {
  const { rowCount } = await pool.query(
    'DELETE FROM passkey_credentials WHERE id = $1 AND user_id = $2',
    [credentialId, userId]
  );
  return rowCount > 0;
};

const createPasskeyUser = async (email, displayName) => {
  const { rows } = await pool.query(
    'INSERT INTO users (email, display_name) VALUES ($1, $2) RETURNING *',
    [email, displayName]
  );
  return rows[0];
};

const getUserByEmail = async (email) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
};

module.exports = {
  getCredentialsByUserId,
  getCredentialByCredentialId,
  getAllCredentialIdsForUser,
  saveCredential,
  updateCredentialCounter,
  deleteCredential,
  createPasskeyUser,
  getUserByEmail,
};
