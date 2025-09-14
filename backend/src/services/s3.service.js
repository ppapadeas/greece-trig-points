const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const uploadFile = async (file) => {
  const randomImageName = (bytes = 16) => crypto.randomBytes(bytes).toString('hex');
  const key = randomImageName();

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);
  return `${process.env.PUBLIC_BUCKET_URL}/${key}`;
};

module.exports = { uploadFile };