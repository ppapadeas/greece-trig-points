// backend/scripts/check_layers.js
const path = require('path');
const gdal = require('gdal-async');

const GPKG_FILE_PATH = path.resolve(__dirname, 'gysmerged.gpkg');

const checkLayers = () => {
  try {
    console.log(`Reading layers from: ${GPKG_FILE_PATH}`);
    const dataset = gdal.open(GPKG_FILE_PATH);

    console.log('Found the following layers:');
    dataset.layers.forEach((layer) => {
      console.log(`- Name: "${layer.name}", Feature Count: ${layer.features.count()}`);
    });

    dataset.close();
  } catch (error) {
    console.error("Failed to read GeoPackage file:", error);
  }
};

checkLayers();