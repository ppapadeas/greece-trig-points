const nodemailer = require('nodemailer');
const pool = require('./database.service');

// Default to Resend SMTP if only RESEND_API_KEY is set
const transporter = (() => {
  if (process.env.RESEND_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: { user: 'resend', pass: process.env.RESEND_API_KEY },
    });
  }
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return null;
})();

// Track when we last sent a digest (initialized to now so we don't
// send a backlog on first deploy)
let lastDigestSentAt = new Date();

const DIGEST_INTERVAL_MS = (parseInt(process.env.DIGEST_INTERVAL_HOURS, 10) || 24) * 60 * 60 * 1000;

const fetchReportsSince = async (since) => {
  const query = `
    SELECT
      r.id,
      r.status,
      r.comment,
      r.created_at,
      p.gys_id,
      p.name AS point_name,
      u.display_name AS user_name,
      u.email AS user_email,
      COALESCE(
        (SELECT json_agg(ri.image_url) FROM report_images ri WHERE ri.report_id = r.id),
        '[]'
      ) AS images
    FROM reports r
    JOIN points p ON r.point_id = p.id
    JOIN users u ON r.user_id = u.id
    WHERE r.created_at > $1
    ORDER BY r.created_at DESC;
  `;
  const result = await pool.query(query, [since]);
  return result.rows;
};

const buildDigestHtml = (reports) => {
  const statusColors = {
    OK: '#28a745',
    DAMAGED: '#ffc107',
    DESTROYED: '#dc3545',
    MISSING: '#6c757d',
    UNKNOWN: '#17a2b8',
  };

  const rows = reports.map((r) => {
    const pointLabel = r.point_name
      ? `${r.point_name} (GYS ${r.gys_id})`
      : `GYS ${r.gys_id}`;
    const color = statusColors[r.status] || '#333';
    const time = new Date(r.created_at).toLocaleString('en-GB', { timeZone: 'Europe/Athens' });
    const images = typeof r.images === 'string' ? JSON.parse(r.images) : r.images;
    const photoLinks = images.length
      ? images.map((url, i) => `<a href="${url}">Photo ${i + 1}</a>`).join(', ')
      : '';

    return `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">
          <a href="https://vathra.xyz/point/${r.gys_id}">${pointLabel}</a>
        </td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">
          <span style="color:${color};font-weight:bold;">${r.status}</span>
        </td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${r.user_name}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${r.comment || ''}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${photoLinks}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${time}</td>
      </tr>`;
  }).join('');

  return `
    <h2>vathra.xyz — Daily Report Digest</h2>
    <p>${reports.length} new report${reports.length === 1 ? '' : 's'} since last digest.</p>
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd;">Point</th>
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd;">Status</th>
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd;">Reporter</th>
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd;">Comment</th>
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd;">Photos</th>
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd;">Time</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:16px;">
      <a href="https://vathra.xyz/admin">Open Admin Panel</a>
    </p>
  `;
};

const sendDigest = async () => {
  if (!transporter || !process.env.ADMIN_EMAIL) return;

  try {
    const since = lastDigestSentAt;
    const reports = await fetchReportsSince(since);

    if (reports.length === 0) {
      lastDigestSentAt = new Date();
      return;
    }

    const html = buildDigestHtml(reports);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'notifications@vathra.xyz',
      to: process.env.ADMIN_EMAIL,
      subject: `[vathra.xyz] Daily digest: ${reports.length} new report${reports.length === 1 ? '' : 's'}`,
      html,
    });

    console.log(`Digest email sent: ${reports.length} reports`);
    lastDigestSentAt = new Date();
  } catch (error) {
    console.error('Failed to send digest email:', error.message);
  }
};

let digestTimer = null;

const startDigestScheduler = () => {
  if (!transporter || !process.env.ADMIN_EMAIL) {
    console.log('Digest scheduler not started: no email transport or ADMIN_EMAIL configured');
    return;
  }

  const hours = parseInt(process.env.DIGEST_INTERVAL_HOURS, 10) || 24;
  console.log(`Digest scheduler started: sending every ${hours}h`);
  digestTimer = setInterval(sendDigest, DIGEST_INTERVAL_MS);
};

const stopDigestScheduler = () => {
  if (digestTimer) {
    clearInterval(digestTimer);
    digestTimer = null;
  }
};

module.exports = { startDigestScheduler, stopDigestScheduler, sendDigest };
