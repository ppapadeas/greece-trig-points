const axios = require('axios');
const pool = require('../src/services/database.service');
const FormData = require('form-data');

const BASE_ARCGIS_URL = 'https://services3.arcgis.com/XHzOnTCjjYWQyVf4/arcgis/rest/services/%CE%A4%CE%A1%CE%99%CE%93%CE%A9%CE%9D%CE%9F%CE%9C%CE%95%CE%A4%CE%A1%CE%99%CE%9A%CE%91_%CE%95%CE%9B%CE%9B%CE%91%CE%94%CE%91%CE%A3/FeatureServer/0/query';

// THIS IS THE FINAL, CORRECT LIST OF FIELDS BASED ON YOUR DIAGNOSTIC LOG
const ARCGIS_FIELDS = 'TR_FULL_CO,TR_NAME,TR_HEIGHT,TR_PERIGRF,TR_TAXI,TR_YPARXI,SHEET_ID,TX50_NAME_,TX50_NAME1';

// --- Data Fetching Function ---
const fetchAllArcgisData = async () => {
  console.log('- Step A: Fetching all object IDs (FIDs) from ArcGIS...');
  const idResponse = await axios.get(BASE_ARCGIS_URL, { params: { where: '1=1', returnIdsOnly: true, f: 'json' } });
  const objectIds = idResponse.data.objectIds;
  if (!objectIds || objectIds.length === 0) throw new Error('No object IDs found from ArcGIS service.');

  console.log(`- Found ${objectIds.length} total object IDs.`);
  console.log(`- Step B: Fetching data for [${ARCGIS_FIELDS}] in pages...`);

  const allFeatures = [];
  const chunkSize = 400;

  for (let i = 0; i < objectIds.length; i += chunkSize) {
    const chunk = objectIds.slice(i, i + chunkSize);
    console.log(`- Fetching details for records ${i + 1} to ${i + chunk.length}...`);

    const form = new FormData();
    form.append('f', 'json');
    form.append('returnGeometry', 'false');
    form.append('outFields', ARCGIS_FIELDS);
    form.append('objectIds', chunk.join(','));

    const chunkResponse = await axios.post(BASE_ARCGIS_URL, form, { headers: form.getHeaders() });

    if (chunkResponse.data.error) {
        throw new Error(`ArcGIS Server Error: ${JSON.stringify(chunkResponse.data.error)}`);
    }

    allFeatures.push(...(chunkResponse.data.features || []));
  }
  return allFeatures;
};

// --- Execute Logic ---
const runUpdate = async () => {
    const arcgisFeatures = await fetchAllArcgisData();
    console.log(`\n🔄 Starting update process for ${arcgisFeatures.length} records...`);
    const client = await pool.connect();
    let updatedCount = 0;
    let notFoundCount = 0;

    try {
        for (const feature of arcgisFeatures) {
            const attr = feature.attributes;
            const gysId = parseInt(attr.TR_FULL_CO, 10);
            if (!gysId) continue;

            let status = 'UNKNOWN';
            if (attr.TR_YPARXI === 1) status = 'OK';
            else if (attr.TR_YPARXI === 0) status = 'MISSING';

            const result = await client.query(
                `UPDATE points SET 
                    name=$1, 
                    elevation=$2, 
                    description=$3, 
                    point_order=$4, 
                    status=$5,
                    map_sheet_id=$6, 
                    map_sheet_name_gr=$7, 
                    map_sheet_name_en=$8
                WHERE gys_id::integer = $9`,
                [
                    attr.TR_NAME,
                    attr.TR_HEIGHT,
                    attr.TR_PERIGRF,
                    attr.TR_TAXI,
                    status,
                    String(attr.SHEET_ID),
                    attr.TX50_NAME_,
                    attr.TX50_NAME1,
                    gysId
                ]
            );
            if (result.rowCount > 0) {
                updatedCount++;
            } else {
                notFoundCount++;
            }
        }
    } finally {
        client.release();
    }
    console.log(`\n--- Execution Report ---`);
    console.log(`✅ Successfully updated ${updatedCount} matching records.`);
    console.log(`🟡 Records from ArcGIS not found in our DB: ${notFoundCount}`);
    console.log('------------------------\n');
};

// --- Main Execution Block ---
const main = async () => {
    console.log('⚠️  This script will modify the database.');
    await runUpdate();
    await pool.end();
};

main().catch(err => {
    console.error('\n❌ A critical error occurred:');
    if (err.response) {
        console.error('ArcGIS Server Response:', JSON.stringify(err.response.data, null, 2));
    } else {
        console.error(err);
    }
    pool.end();
});