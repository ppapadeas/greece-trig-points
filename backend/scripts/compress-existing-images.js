#!/usr/bin/env node
/**
 * One-time script to compress all existing images in R2.
 *
 * Downloads each image, compresses with sharp (1600px max, WebP quality 80),
 * re-uploads in-place with the same key, and updates the DB content type.
 *
 * Usage:
 *   fly ssh console --app vathra-api -C "node scripts/compress-existing-images.js"
 *
 *   Or locally with .env:
 *   node scripts/compress-existing-images.js
 */

require('dotenv').config();
const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.S3_BUCKET_NAME;

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function compressAndReupload(key) {
  // Download
  const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const response = await s3.send(getCmd);
  const original = await streamToBuffer(response.Body);
  const originalSize = original.length;

  // Skip if already small (likely already compressed)
  if (originalSize < 100 * 1024) {
    console.log(`  SKIP ${key} (${(originalSize / 1024).toFixed(0)} KB — already small)`);
    return { skipped: true };
  }

  // Compress
  let compressed;
  try {
    compressed = await sharp(original)
      .rotate()
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch (err) {
    console.log(`  FAIL ${key} — sharp error: ${err.message}`);
    return { failed: true };
  }

  const compressedSize = compressed.length;
  const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);

  // Only re-upload if we actually saved space
  if (compressedSize >= originalSize) {
    console.log(`  SKIP ${key} (${(originalSize / 1024).toFixed(0)} KB — compression would increase size)`);
    return { skipped: true };
  }

  // Re-upload with same key
  const putCmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: compressed,
    ContentType: 'image/webp',
  });
  await s3.send(putCmd);

  console.log(`  OK   ${key}: ${(originalSize / 1024).toFixed(0)} KB -> ${(compressedSize / 1024).toFixed(0)} KB (${savings}% saved)`);
  return { originalSize, compressedSize };
}

async function main() {
  console.log('Compressing existing images in R2...\n');

  let continuationToken;
  let totalOriginal = 0;
  let totalCompressed = 0;
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  do {
    const listCmd = new ListObjectsV2Command({
      Bucket: BUCKET,
      ContinuationToken: continuationToken,
    });
    const listRes = await s3.send(listCmd);

    if (!listRes.Contents) break;

    for (const obj of listRes.Contents) {
      const result = await compressAndReupload(obj.Key);
      if (result.skipped) {
        skipped++;
      } else if (result.failed) {
        failed++;
      } else {
        totalOriginal += result.originalSize;
        totalCompressed += result.compressedSize;
        processed++;
      }
    }

    continuationToken = listRes.IsTruncated ? listRes.NextContinuationToken : undefined;
  } while (continuationToken);

  console.log('\n--- Summary ---');
  console.log(`Compressed: ${processed} files`);
  console.log(`Skipped:    ${skipped} files`);
  console.log(`Failed:     ${failed} files`);
  if (processed > 0) {
    console.log(`Before:     ${(totalOriginal / 1024 / 1024).toFixed(1)} MB`);
    console.log(`After:      ${(totalCompressed / 1024 / 1024).toFixed(1)} MB`);
    console.log(`Saved:      ${((totalOriginal - totalCompressed) / 1024 / 1024).toFixed(1)} MB (${((1 - totalCompressed / totalOriginal) * 100).toFixed(1)}%)`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
