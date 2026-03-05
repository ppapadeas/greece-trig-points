const path = require('path');
const AdmZip = require('adm-zip');
const { XMLParser } = require('fast-xml-parser');
const axios = require('axios');
const pool = require('../src/services/database.service');
const { uploadFile } = require('../src/services/s3.service');

const CONTRIBUTOR_USER_ID = 51;
const MOCK_DATE = '2024-01-01T00:00:00Z';
const DRY_RUN = process.argv.includes('--dry-run');
const PARSE_ONLY = process.argv.includes('--parse-only');

// Status mapping from Greek description text
const STATUS_KEYWORDS = [
  { pattern: /ΑΚΑΤΑΛΛΗΛΟ/i, status: 'DAMAGED' },
  { pattern: /ΚΑΤΕΣ?ΤΡΑΜΕΝΟ/i, status: 'DESTROYED' },
  { pattern: /ΧΤΙΣΜΕΝΟ/i, status: 'DESTROYED' },
  { pattern: /ΔΕΝ ΥΠΑΡΧΕΙ/i, status: 'MISSING' },
  { pattern: /ΓΕΙΡΤΟ/i, status: 'DAMAGED' },
  { pattern: /ΠΕΣΜΕΝΟ/i, status: 'DAMAGED' },
  { pattern: /ΔΥΣΒΑΤΟ/i, status: 'UNKNOWN' },
  { pattern: /ΚΑΤΑΛΛΗΛΟ/i, status: 'OK' },
];

// Icon color → status fallback
const STYLE_STATUS = {
  '#icon-1899-097138': 'OK',        // green
  '#icon-1899-A52714': 'DAMAGED',   // red
};

function determineStatus(description, styleUrl) {
  if (description) {
    const upper = description.toUpperCase();
    for (const { pattern, status } of STATUS_KEYWORDS) {
      if (pattern.test(upper)) return status;
    }
  }
  // Fallback: icon color
  const baseStyle = styleUrl?.replace(/-normal$/, '').replace(/-highlight$/, '');
  return STYLE_STATUS[baseStyle] || 'UNKNOWN';
}

function parseKmz(kmzPath) {
  const zip = new AdmZip(kmzPath);
  const kmlEntry = zip.getEntry('doc.kml');
  if (!kmlEntry) throw new Error('doc.kml not found in KMZ');

  const kmlText = kmlEntry.getData().toString('utf-8');

  const parser = new XMLParser({
    ignoreAttributes: false,
    cdataPropName: '__cdata',
    isArray: (name) => name === 'Placemark' || name === 'Folder' || name === 'Data',
  });
  const doc = parser.parse(kmlText);
  return doc.kml.Document;
}

function collectPlacemarks(node) {
  const results = [];
  if (node.Placemark) {
    for (const pm of node.Placemark) {
      results.push(pm);
    }
  }
  if (node.Folder) {
    for (const folder of node.Folder) {
      results.push(...collectPlacemarks(folder));
    }
  }
  return results;
}

function extractData(placemark) {
  const name = placemark.name?.toString().trim();
  const styleUrl = placemark.styleUrl;
  const coords = placemark.Point?.coordinates?.toString().trim();

  // Extract ExtendedData fields
  const dataFields = {};
  const dataArr = placemark.ExtendedData?.Data;
  if (dataArr) {
    for (const d of dataArr) {
      const fieldName = d['@_name'];
      let val = d.value;
      // Handle CDATA wrapped values
      if (val && typeof val === 'object' && val.__cdata) {
        val = val.__cdata;
      }
      if (val != null) {
        dataFields[fieldName] = val.toString().trim();
      }
    }
  }

  const description = dataFields['περιγραφή'] || dataFields['Περιγραφή'] || null;
  const imageLinks = dataFields['gx_media_links'] || null;

  let lon, lat, elevation;
  if (coords) {
    const parts = coords.split(',').map(s => parseFloat(s.trim()));
    [lon, lat, elevation] = parts;
  }

  return { gysId: name, description, styleUrl, imageLinks, lon, lat, elevation };
}

async function downloadImage(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    return {
      buffer: Buffer.from(response.data),
      mimetype: response.headers['content-type'] || 'image/jpeg',
    };
  } catch (err) {
    console.warn(`  ⚠ Image download failed: ${err.message}`);
    return null;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const fs = require('fs');
  const defaultPaths = [
    path.resolve(__dirname, 'TRIGWNOMETRIKA.kmz'),
    path.resolve(__dirname, '../../TRIGWNOMETRIKA.kmz'),
  ];
  const kmzPath = args[0] || defaultPaths.find(p => fs.existsSync(p)) || defaultPaths[0];
  console.log(`Parsing KMZ: ${kmzPath}`);
  console.log(`Mode: ${PARSE_ONLY ? 'PARSE ONLY' : DRY_RUN ? 'DRY RUN' : 'LIVE IMPORT'}\n`);

  const document = parseKmz(kmzPath);
  const placemarks = collectPlacemarks(document);
  console.log(`Found ${placemarks.length} placemarks\n`);

  if (PARSE_ONLY) {
    for (const pm of placemarks) {
      const data = extractData(pm);
      const status = determineStatus(data.description, data.styleUrl);
      const firstImageUrl = data.imageLinks?.split(/\s+/)[0] || null;
      console.log(`[${data.gysId}] status=${status} desc="${data.description || ''}" image=${firstImageUrl ? 'yes' : 'no'} coords=${data.lat},${data.lon}`);
    }
    console.log(`\nTotal: ${placemarks.length} placemarks parsed`);
    return;
  }

  const stats = { imported: 0, skipped: 0, unmatched: 0, errors: 0, imagesFailed: 0 };

  for (const pm of placemarks) {
    const data = extractData(pm);
    const status = determineStatus(data.description, data.styleUrl);
    const firstImageUrl = data.imageLinks?.split(/\s+/)[0] || null;

    console.log(`[${data.gysId}] status=${status} desc="${data.description || ''}" image=${firstImageUrl ? 'yes' : 'no'}`);

    // Match to database point
    const pointResult = await pool.query(
      'SELECT id, status FROM points WHERE gys_id = $1',
      [data.gysId]
    );

    if (pointResult.rows.length === 0) {
      console.log(`  ✗ No matching point for gys_id=${data.gysId}`);
      stats.unmatched++;
      continue;
    }

    const point = pointResult.rows[0];

    // Idempotency check
    const existing = await pool.query(
      'SELECT id FROM reports WHERE point_id = $1 AND user_id = $2 AND created_at = $3',
      [point.id, CONTRIBUTOR_USER_ID, MOCK_DATE]
    );

    if (existing.rows.length > 0) {
      console.log(`  ⊘ Already imported (report #${existing.rows[0].id})`);
      stats.skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  → Would import: point_id=${point.id} status=${status}`);
      stats.imported++;
      continue;
    }

    try {
      // Download and upload image
      let imageUrl = null;
      if (firstImageUrl) {
        const file = await downloadImage(firstImageUrl);
        if (file) {
          imageUrl = await uploadFile(file);
          console.log(`  ✓ Image uploaded: ${imageUrl}`);
        } else {
          stats.imagesFailed++;
        }
        await sleep(200);
      }

      // Insert report with custom created_at + conditional point status update
      const { rows } = await pool.query(`
        WITH inserted_report AS (
          INSERT INTO reports (point_id, user_id, status, comment, image_url, created_at, is_reviewed)
          VALUES ($1, $2, $3, $4, $5, $6, true)
          RETURNING *
        ), updated_point AS (
          UPDATE points
          SET status = $3, updated_at = $6
          WHERE id = $1
          AND NOT EXISTS (
            SELECT 1 FROM reports WHERE point_id = $1 AND created_at > $6
          )
          RETURNING id
        )
        SELECT * FROM inserted_report;
      `, [point.id, CONTRIBUTOR_USER_ID, status, data.description, imageUrl, MOCK_DATE]);

      console.log(`  ✓ Report #${rows[0].id} created`);
      stats.imported++;
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
      stats.errors++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total placemarks: ${placemarks.length}`);
  console.log(`Imported:         ${stats.imported}`);
  console.log(`Skipped (dupe):   ${stats.skipped}`);
  console.log(`Unmatched:        ${stats.unmatched}`);
  console.log(`Errors:           ${stats.errors}`);
  console.log(`Images failed:    ${stats.imagesFailed}`);

  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
