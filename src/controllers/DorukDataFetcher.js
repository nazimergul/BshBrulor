const axios = require('axios');
const xml2js = require('xml2js');
const MsSqlConnection = require('./MsSqlConnection');
const DorukApiConfig = require("../../cfg-data/dorukApiConfig.json");

// Class for fetching data from Doruk API
class DorukDataFetcher {
  constructor() {
    this.config = DorukApiConfig;
    this.msSqlConnect = new MsSqlConnection();
  }

  // Method to fetch and parse XML data
  async getAndParseXML() {
    const { url, username, password } = this.config;

    try {
      const response = await axios.get(url, {
        auth: { username, password }
      });

      const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
      const result = await parser.parseStringPromise(response.data);

      const { Makine, ParcaAdi, PlanMiktar, PlanKalanMiktar } = result.ArrayOfOnlineKPI.OnlineKPI;

      const data = {
        Makine,
        ParcaAdi,
        PlanMiktar,
        PlanKalanMiktar,
      };
      console.log(data);
      return data;
    } catch (error) {
      console.error('(getAndParseXML) - Error:', error.message);
      await this.msSqlConnect.logToMsSql('Doruk API Connection Fault.');
      return null;
    }
  }
}

module.exports = DorukDataFetcher;
