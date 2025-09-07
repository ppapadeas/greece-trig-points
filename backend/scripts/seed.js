const path = require('path');
const gdal = require('gdal-async');
if (process.env.NODE_ENV !== 'production') {
}
const pool = require('../src/services/database.service');

const GPKG_FILE_PATH = path.resolve(__dirname, 'gysmerged.gpkg');

// Define the coordinate systems (SRIDs)
const egsa87 = gdal.SpatialReference.fromEPSG(2100); // GGRS87/Greek Grid
const wgs84 = gdal.SpatialReference.fromEPSG(4326);  // WGS84 (GPS)
const transform = new gdal.CoordinateTransformation(egsa87, wgs84);

const seedDatabase = async () => {
  console.log(`Reading GeoPackage file from: ${GPKG_FILE_PATH}`);
  const dataset = gdal.open(GPKG_FILE_PATH);

  const layer = dataset.layers.get('trig'); // Use the correct layer name: "trig"
  console.log(`Found layer "trig" with ${layer.features.count()} features.`);

  const pointsData = [];

  layer.features.forEach(feature => {
    const geom = feature.getGeometry();
    const egsa87_x = geom.x;
    const egsa87_y = geom.y;
    const egsa87_z = geom.z;

    // The name of the point is stored in the "Text" field of the layer
    const name = feature.fields.get('Text');

    // Transform coordinates to WGS84 for the map
    const wgs84Point = geom.clone();
    wgs84Point.transform(transform);

    pointsData.push({
      name: name || `Point_${egsa87_x.toFixed(0)}`,
      egsa87_x,
      egsa87_y,
      egsa87_z,
      longitude: wgs84Point.y,
      latitude: wgs84Point.x,
      elevation: wgs84Point.z,
    });
  });

  console.log('Finished processing GeoPackage file.');
  console.log(`Starting to seed the database with ${pointsData.length} points...`);

  try {
    await pool.query('TRUNCATE TABLE points RESTART IDENTITY;');
    console.log('Cleared existing points from the table.');

    for (const point of pointsData) {
      const query = `
        INSERT INTO points (name, elevation, location, status, egsa87_x, egsa87_y, egsa87_z)
        VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), 'UNKNOWN', $5, $6, $7)
      `;
      const values = [
        point.name,
        point.elevation,
        point.longitude,
        point.latitude,
        point.egsa87_x,
        point.egsa87_y,
        point.egsa87_z,
      ];
      await pool.query(query, values);
    }
    console.log('Database seeding completed successfully! 🎉');
  } catch (error) {
    console.error('Error during database seeding:', error);
  } finally {
    await pool.end();
    dataset.close();
  }
};

seedDatabase();