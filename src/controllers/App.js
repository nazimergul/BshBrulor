const DorukDataFetcher = require('./DorukDataFetcher');
const OpcuaClient = require('./OpcuaClient');
const MsSqlConnection = require('./MsSqlConnection');
const PlcTagConfig = require('../../cfg-data/plcTagConfig.json');

// Main application class
class App {
  constructor() {
    this.dorukDataModule = new DorukDataFetcher();
    this.opcuaClientModule = new OpcuaClient();
    this.msSqlModule = new MsSqlConnection();
    this.plcTagConfig = PlcTagConfig;
  }

  // Method to fetch data from Doruk
  async fetchDataFromDoruk() {
    try {
      return await this.dorukDataModule.getAndParseXML();
    } catch (error) {
      console.error('(fetchDataFromDoruk) - Error:', error.message);
      throw error;
    }
  }

  // Method to fetch data from OPC-UA
  async fetchDataFromOpcUa() {
    try {
      const { plcTagsNodeIds, tagNames } = this.getOpcUaTagInfo(this.plcTagConfig);
      const opcUaReadData = await this.opcuaClientModule.readOpcUaData(plcTagsNodeIds);
      return this.processOpcUaData(opcUaReadData, tagNames);
    } catch (error) {
      console.error('(fetchDataFromOpcUa) - Error:', error.message);
      throw error;
    }
  }

  // Method to prepare OPC-UA tag configuration information
  getOpcUaTagInfo(plcTagConfig) {
    const plcTagsNodeIds = Object.values(plcTagConfig).map((plcTag) => plcTag.opcNodeId);
    const tagNames = Object.values(plcTagConfig).map((plcTag) => plcTag.tagName);
    return { plcTagsNodeIds, tagNames };
  }

  // Method to process OPC-UA data
  processOpcUaData(opcUaReadData, tagNames) {
    if (!opcUaReadData) {
      return null;
    }

    const opcData = {};
    Object.keys(opcUaReadData).forEach((opcNodeId, index) => {
      switch (typeof opcUaReadData[opcNodeId]) {
        case 'number':
          opcData[tagNames[index]] = isFinite(opcUaReadData[opcNodeId]) && (Math.floor(opcUaReadData[opcNodeId]) === opcUaReadData[opcNodeId])
            ? opcUaReadData[opcNodeId]
            : opcUaReadData[opcNodeId].toFixed(2);
          break;
        case 'boolean':
          opcData[tagNames[index]] = opcUaReadData[opcNodeId] ? 1 : 0;
          break;
        case 'string':
          opcData[tagNames[index]] = opcUaReadData[opcNodeId];
          break;
        default:
          console.log("Undefined data type!");
      }
    });

    return opcData;
  }

  // Method to collect and insert data into SQL database
  async collectAndInsertData() {
    try {
      const dorukData = await this.fetchDataFromDoruk();
      const opcData = await this.fetchDataFromOpcUa();

      if (!opcData && !dorukData) {
        console.log("No OPC data, NO Doruk Data!");
      } else {
        const mergedData = { ...dorukData, ...opcData };
        await this.msSqlModule.insertDataToSql(mergedData);
      }
    } catch (error) {
      console.error('(collectAndInsertData) - Error:', error.message);
      await this.msSqlModule.logToMsSql(error.message);
    }
  }

  // Method to start data collection at specific intervals
  startDataCollectionInterval() {
    setInterval(() => this.collectAndInsertData(), 15000);
  }
}

module.exports = App;
