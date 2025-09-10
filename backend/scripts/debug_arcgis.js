const axios = require('axios');

const BASE_ARCGIS_URL = 'https://services3.arcgis.com/XHzOnTCjjYWQyVf4/arcgis/rest/services/%CE%A4%CE%A1%CE%99%CE%93%CE%A9%CE%9D%CE%9F%CE%9C%CE%95%CE%A4%CE%A1%CE%99%CE%9A%CE%91_%CE%95%CE%9B%CE%9B%CE%91%CE%94%CE%91%CE%A3/FeatureServer/0/query';

const runDebug = async () => {
  console.log('🚀 Running ArcGIS debug script...');
  try {
    const response = await axios.get(BASE_ARCGIS_URL, {
      params: {
        where: 'OBJECTID = 1', // Get only the very first point
        outFields: '*',        // Ask for ALL available fields
        f: 'json'
      }
    });

    console.log('\n--- Full Server Response ---');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data && response.data.features && response.data.features.length > 0) {
      console.log('\n--- Attributes for the First Point ---');
      console.log(response.data.features[0].attributes);
    } else {
      console.log('\n--- No features found in the response. ---');
    }

  } catch (error) {
    console.error('\n❌ An error occurred during the debug run:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
};

runDebug();