const path = require('path');
const gdal = require('gdal-async');
const pool = require('../src/services/database.service');

const GPKG_FILE_PATH = path.resolve(__dirname, 'gysmerged.gpkg');

// Define the coordinate systems (SRIDs)
const egsa87 = gdal.SpatialReference.fromEPSG(2100); // GGRS87/Greek Grid
const wgs84 = gdal.SpatialReference.fromEPSG(4326);  // WGS84 (GPS)
const transform = new gdal.CoordinateTransformation(egsa87, wgs84);

const seedDatabase = async () => {
  console.log(`🚀 Starting database seed from: ${GPKG_FILE_PATH}`);
  const dataset = gdal.open(GPKG_FILE_PATH);
  const layer = dataset.layers.get('trig');
  console.log(`- Found layer "trig" with ${layer.features.count()} features.`);
  
  const pointsData = [];
  
  layer.features.forEach(feature => {
    const geom = feature.getGeometry();
    const gysId = feature.fields.get('Text'); // The 'Text' field is our GYS ID

    // Transform coordinates to WGS84 for the map
    const wgs84Point = geom.clone();
    wgs84Point.transform(transform);
    
    pointsData.push({
      gys_id: gysId, // This is the new mapping
      longitude: wgs84Point.x,
      latitude: wgs84Point.y,
      elevation: wgs84Point.z,
    });
  });

  console.log('- Finished processing GeoPackage file.');
  console.log(`- Starting to seed the database with ${pointsData.length} points...`);
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // A robust truncate that clears all related tables
    console.log('- Clearing old data (points, reports, users, session)...');
    await client.query('TRUNCATE TABLE points, reports, users, session RESTART IDENTITY CASCADE;');

    for (const point of pointsData) {
      // This INSERT statement now matches our final table structure
      const query = `
        INSERT INTO points (gys_id, elevation, location, status)
        VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), 'UNKNOWN')
      `;
      const values = [
        point.gys_id,
        point.elevation,
        point.longitude,
        point.latitude,
      ];
      await client.query(query, values);
    }
    
    await client.query('COMMIT');
    console.log('✅ Database seeding completed successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during database seeding:', error);
  } finally {
    client.release();
    pool.end();
    dataset.close();
  }
};

seedDatabase();