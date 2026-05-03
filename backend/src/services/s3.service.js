const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const sharp = require('sharp');

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const compressImage = async (buffer) => {
  return sharp(buffer)
    .rotate() // auto-rotate based on EXIF
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
};

const uploadFile = async (file) => {
  const randomImageName = (bytes = 16) => crypto.randomBytes(bytes).toString('hex');
  const key = randomImageName();

  const compressed = await compressImage(file.buffer);

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: compressed,
    ContentType: 'image/webp',
  });

  await s3.send(command);
  return `${process.env.PUBLIC_BUCKET_URL}/${key}`;
};

const deleteFile = async (imageUrl) => {
  const publicPrefix = process.env.PUBLIC_BUCKET_URL;
  if (!imageUrl || !publicPrefix || !imageUrl.startsWith(publicPrefix)) {
    console.warn('deleteFile: unrecognized URL format, skipping:', imageUrl);
    return false;
  }
  const key = imageUrl.slice(publicPrefix.length + 1);
  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    }));
    return true;
  } catch (err) {
    console.error('deleteFile: failed to delete from R2:', key, err.message);
    return false;
  }
};

module.exports = { uploadFile, compressImage, deleteFile };