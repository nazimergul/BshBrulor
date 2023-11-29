const axios = require('axios');
const xml2js = require('xml2js');
const msSqlConnect = require('./msSqlConnect'); // MS-SQL Writing module
const config = require("../../cfg-data/dorukApiConfig.json");

async function getAndParseXML() {
  // Extracting configuration information from the config file
  const { url, username, password } = config;

  try {
    // Making a request to the Doruk API
    const response = await axios.get(url, {
      auth: { username, password }
    });

    // Parsing the XML response
    const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
    const result = await parser.parseStringPromise(response.data);

    // Extracting relevant information from the parsed XML
    const { Makine, ParcaAdi, PlanMiktar, PlanKalanMiktar } = result.ArrayOfOnlineKPI.OnlineKPI;

    // Structuring the extracted data
    const data = {
      Makine,
      ParcaAdi,
      PlanMiktar,
      PlanKalanMiktar,
    };

    return data;
  } catch (error) {
    // Logging the error and returning null in case of an API connection fault
    console.error('(getAndParseXML) - Error:', error.message);
    await msSqlConnect.sqlLog('Doruk API Connection Fault.');
    return null;
  }
}

module.exports = getAndParseXML;
