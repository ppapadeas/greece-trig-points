const path = require('path');
const gdal = require('gdal-async');
const axios = require('axios');
const FormData = require('form-data');
const pool = require('../src/services/database.service');

const GPKG_FILE_PATH = path.resolve(__dirname, 'gysmerged.gpkg');
const BASE_ARCGIS_URL = 'https://services3.arcgis.com/XHzOnTCjjYWQyVf4/arcgis/rest/services/%CE%A4%CE%A1%CE%99%CE%93%CE%A9%CE%9D%CE%9F%CE%9C%CE%95%CE%A4%CE%A1%CE%99%CE%9A%CE%91_%CE%95%CE%9B%CE%9B%CE%91%CE%94%CE%91%CE%A3/FeatureServer/0/query';
const ARCGIS_FIELDS = 'TR_FULL_CO,TR_NAME,TR_HEIGHT,TR_PERIGRF,TR_TAXI,TR_YPARXI,SHEET_ID,TX50_NAME_,TX50_NAME1';

const main = async () => {
  console.log('🚀 Starting unified database setup...');
  const client = await pool.connect();

  try {
    // --- 1. Get Initial Data from GeoPackage ---
    console.log('1. Reading initial data from gysmerged.gpkg...');
    const egsa87 = gdal.SpatialReference.fromEPSG(2100);
    const wgs84 = gdal.SpatialReference.fromEPSG(4326);
    const transform = new gdal.CoordinateTransformation(egsa87, wgs84);

    const dataset = gdal.open(GPKG_FILE_PATH);
    const layer = dataset.layers.get('trig');
    const initialPoints = new Map();

    layer.features.forEach(feature => {
      const gysId = feature.fields.get('Text');
      if (gysId && !initialPoints.has(gysId)) { // Only add if it's not already in the map
        const geom = feature.getGeometry();
        const wgs84Point = geom.clone();
        wgs84Point.transform(transform);
        initialPoints.set(parseInt(gysId, 10), {
          gys_id: gysId,
          egsa87_x: geom.x,
          egsa87_y: geom.y,
          egsa87_z: geom.z,
          longitude: wgs84Point.y,
          latitude: wgs84Point.x,
        });
      }
    });
    dataset.close();
    console.log(`- Found ${initialPoints.size} unique initial points.`);

    // --- 2. Fetch Rich Data from ArcGIS ---
    console.log('2. Fetching rich data from ArcGIS service...');
    // (This is the same robust fetching logic from our previous scripts)
    const idResponse = await axios.get(BASE_ARCGIS_URL, { params: { where: '1=1', returnIdsOnly: true, f: 'json' } });
    const objectIds = idResponse.data.objectIds;
    const allArcgisFeatures = [];
    for (let i = 0; i < objectIds.length; i += 400) {
      const chunk = objectIds.slice(i, i + 400);
      const form = new FormData();
      form.append('f', 'json');
      form.append('outFields', ARCGIS_FIELDS);
      form.append('objectIds', chunk.join(','));
      const res = await axios.post(BASE_ARCGIS_URL, form, { headers: form.getHeaders() });
      allArcgisFeatures.push(...(res.data.features || []));
    }
    console.log(`- Fetched ${allArcgisFeatures.length} rich data records.`);

    // --- 3. Merge and Upsert Data ---
    console.log('3. Merging and upserting data into the database...');
    await client.query('BEGIN');

    for (const feature of allArcgisFeatures) {
      const attr = feature.attributes;
      const gysId = parseInt(attr.TR_FULL_CO, 10);
      if (!gysId || !initialPoints.has(gysId)) continue;

      const initialPoint = initialPoints.get(gysId);
      const status = attr.TR_YPARXI === 1 ? 'OK' : 'UNKNOWN';

      const upsertQuery = `
        INSERT INTO points (gys_id, name, elevation, location, status, egsa87_x, egsa87_y, egsa87_z, description, point_order, map_sheet_id, map_sheet_name_gr, map_sheet_name_en)
        VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (gys_id) DO UPDATE SET
          name = EXCLUDED.name,
          elevation = EXCLUDED.elevation,
          location = EXCLUDED.location,
          status = EXCLUDED.status,
          egsa87_x = EXCLUDED.egsa87_x,
          egsa87_y = EXCLUDED.egsa87_y,
          egsa87_z = EXCLUDED.egsa87_z,
          description = EXCLUDED.description,
          point_order = EXCLUDED.point_order,
          map_sheet_id = EXCLUDED.map_sheet_id,
          map_sheet_name_gr = EXCLUDED.map_sheet_name_gr,
          map_sheet_name_en = EXCLUDED.map_sheet_name_en,
          updated_at = NOW();
      `;

      await client.query(upsertQuery, [
        initialPoint.gys_id,
        attr.TR_NAME,
        attr.TR_HEIGHT,
        initialPoint.longitude,
        initialPoint.latitude,
        status,
        initialPoint.egsa87_x,
        initialPoint.egsa87_y,
        initialPoint.egsa87_z,
        attr.TR_PERIGRF,
        attr.TR_TAXI,
        String(attr.SHEET_ID),
        attr.TX50_NAME_,
        attr.TX50_NAME1
      ]);
    }
    await client.query('COMMIT');
    console.log(`✅ Database setup complete. ${allArcgisFeatures.length} points processed.`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ An error occurred during database setup:', error);
    throw error; // Throw error to make the deployment fail if seeding fails
  } finally {
    client.release();
    pool.end();
  }
};

main();