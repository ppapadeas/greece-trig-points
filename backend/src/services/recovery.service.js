const crypto = require('crypto');
const pool = require('./database.service');

const TOKEN_BYTES = 32;
const TOKEN_TTL_HOURS = 24;

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const createRecoveryToken = async (userId) => {
  const plaintext = crypto.randomBytes(TOKEN_BYTES).toString('base64url');
  const tokenHash = hashToken(plaintext);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO passkey_recovery_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

  return { token: plaintext, expiresAt };
};

const findValidToken = async (token) => {
  if (!token || typeof token !== 'string') return null;
  const tokenHash = hashToken(token);
  const { rows } = await pool.query(
    `SELECT t.id, t.user_id, t.expires_at, t.used_at,
            u.email, u.display_name
     FROM passkey_recovery_tokens t
     JOIN users u ON u.id = t.user_id
     WHERE t.token_hash = $1`,
    [tokenHash]
  );
  const row = rows[0];
  if (!row) return null;
  if (row.used_at) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return row;
};

const consumeToken = async (tokenId) => {
  await pool.query(
    'UPDATE passkey_recovery_tokens SET used_at = NOW() WHERE id = $1',
    [tokenId]
  );
};

module.exports = {
  createRecoveryToken,
  findValidToken,
  consumeToken,
};
