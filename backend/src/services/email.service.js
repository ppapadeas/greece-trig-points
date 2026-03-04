const nodemailer = require('nodemailer');

const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const sendNewReportNotification = async ({ point, report, user }) => {
  if (!transporter || !process.env.ADMIN_EMAIL) return;

  const pointLabel = point.name
    ? `${point.name} (GYS ${point.gys_id})`
    : `GYS ${point.gys_id}`;

  const html = `
    <h2>New Report on ${pointLabel}</h2>
    <table style="border-collapse:collapse;">
      <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Point</td><td>${pointLabel}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Status</td><td>${report.status}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Reporter</td><td>${user.display_name} (${user.email})</td></tr>
      ${report.comment ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Comment</td><td>${report.comment}</td></tr>` : ''}
      ${report.image_url ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Photo</td><td><a href="${report.image_url}">View Photo</a></td></tr>` : ''}
    </table>
    <p style="margin-top:16px;">
      <a href="https://vathra.xyz/point/${point.gys_id}">View on Map</a> ·
      <a href="https://vathra.xyz/admin">Admin Panel</a>
    </p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `[vathra.xyz] New report: ${pointLabel} → ${report.status}`,
      html,
    });
  } catch (error) {
    console.error('Failed to send admin notification email:', error.message);
  }
};

module.exports = { sendNewReportNotification };
