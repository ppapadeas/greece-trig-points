const axios = require('axios');
const pool = require('../src/services/database.service');
const FormData = require('form-data');

const BASE_ARCGIS_URL = 'https://services3.arcgis.com/XHzOnTCjjYWQyVf4/arcgis/rest/services/%CE%A4%CE%A1%CE%99%CE%93%CE%A9%CE%9D%CE%9F%CE%9C%CE%95%CE%A4%CE%A1%CE%99%CE%9A%CE%91_%CE%95%CE%9B%CE%9B%CE%91%CE%94%CE%91%CE%A3/FeatureServer/0/query';

const fetchAllArcgisData = async () => {
  console.log('- Step A: Fetching all object IDs (FIDs) from ArcGIS...');
  const idResponse = await axios.get(BASE_ARCGIS_URL, {
    params: { where: '1=1', returnIdsOnly: true, f: 'json' }
  });
  const objectIds = idResponse.data.objectIds;

  if (!objectIds || objectIds.length === 0) {
    throw new Error('No object IDs found from ArcGIS service.');
  }
  console.log(`- Found ${objectIds.length} total object IDs.`);
  console.log('- Step B: Fetching TR_FULL_CO data in pages...');

  const allKodikos = new Set();
  const chunkSize = 500;

  for (let i = 0; i < objectIds.length; i += chunkSize) {
    const chunk = objectIds.slice(i, i + chunkSize);
    console.log(`- Fetching details for records ${i + 1} to ${i + chunk.length}...`);

    const form = new FormData();
    form.append('f', 'json');
    form.append('returnGeometry', 'false');
    form.append('outFields', 'TR_FULL_CO');
    form.append('objectIds', chunk.join(','));

    const chunkResponse = await axios.post(BASE_ARCGIS_URL, form, {
      headers: form.getHeaders(),
    });

    const features = chunkResponse.data.features || [];
    features.forEach(feature => {
      if (feature.attributes.TR_FULL_CO) {
        allKodikos.add(parseInt(feature.attributes.TR_FULL_CO, 10));
      }
    });
  }
  return allKodikos;
};


const runDryRun = async () => {
  console.log('🚀 Starting final dry run with type correction...');

  try {
    console.log('Fetching points from our database...');
    const localRes = await pool.query('SELECT name FROM points;');
    const localKodikosSet = new Set(localRes.rows.map(row => parseInt(row.name, 10)));
    console.log(`- Found ${localKodikosSet.size} unique points in our database.`);

    console.log('Fetching points from ArcGIS service...');
    const arcgisKodikosSet = await fetchAllArcgisData();
    console.log(`- Found ${arcgisKodikosSet.size} unique points in the ArcGIS service.`);

    console.log('\n🔍 Comparing datasets (numeric comparison)...');
    let matchCount = 0;

    for (const kodikos of localKodikosSet) {
      if (arcgisKodikosSet.has(kodikos)) {
        matchCount++;
      }
    }

    const localOnlyCount = localKodikosSet.size - matchCount;
    const arcgisOnlyCount = arcgisKodikosSet.size - matchCount;

    console.log('\n--- Final Dry Run Report ---');
    console.log(`✅ Matching Points: ${matchCount}`);
    console.log(`🔵 Points ONLY in our DB: ${localOnlyCount}`);
    console.log(`🟢 Points ONLY in ArcGIS DB: ${arcgisOnlyCount}`);
    console.log('--------------------------\n');

    const matchPercentage = matchCount > 0 ? (matchCount / localKodikosSet.size) * 100 : 0;
    console.log(`The new, more accurate match rate is ~${matchPercentage.toFixed(2)}%`);

  } catch (error) {
    console.error('\n❌ An error occurred during the dry run:');
    if (error.response) {
      console.error('ArcGIS Server Response Status:', error.response.status);
      console.error('ArcGIS Server Response Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  } finally {
    await pool.end();
  }
};

runDryRun();