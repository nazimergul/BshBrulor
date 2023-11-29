const { OPCUAClient, AttributeIds } = require('node-opcua');
const MsSqlConnection = require('./MsSqlConnection');
const OpcConfig = require("../../cfg-data/opcConfig.json");

// Class for reading data from OPC-UA server
class OpcuaClient {
  constructor() {
    this.msSqlConnect = new MsSqlConnection();
    this.endpointUrl = OpcConfig.endpointUrl;
  }

  // Method to read data from OPC-UA nodes
  async readOpcUaData(nodeIds) {
    const client = OPCUAClient.create({ endpointMustExist: false });

    try {
      await Promise.race([
        client.connect(this.endpointUrl),
        new Promise((_, reject) => setTimeout(() => reject(new Error('OPC UA - Connection timeout!')), 5000))
      ]);

      const session = await client.createSession();

      const nodesToRead = nodeIds.map((nodeId) => ({ nodeId, attributeId: AttributeIds.Value }));

      const dataValues = await session.read(nodesToRead);

      const data = {};
      dataValues.forEach((dataValue, index) => {
        const nodeId = nodeIds[index];
        data[nodeId] = dataValue.value.value;
      });

      return data;
    } catch (error) {
      console.error('(readOpcUaData) - Error:', error.message);
      await this.msSqlConnect.logToMsSql(error.message);
    } finally {
      await client.disconnect();
    }
  }
}

module.exports = OpcuaClient;
