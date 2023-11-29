const { OPCUAClient, AttributeIds } = require('node-opcua');
const msSqlConnect = require('./msSqlConnect'); // MS-SQL Writing module
const config = require("../../cfg-data/opcConfig.json")
const endpointUrl = config.endpointUrl;

async function readOpcUaData(nodeIds) {
  const client = OPCUAClient.create({ endpointMustExist: false });

  try {
    // Connect to OPC UA server with a timeout
    await Promise.race([
      client.connect(endpointUrl),
      new Promise((_, reject) => setTimeout(() => reject(new Error('OPC UA - Connection timeout!')), 5000))
    ]);

    const session = await client.createSession();

    // Prepare nodes to read
    const nodesToRead = nodeIds.map((nodeId) => ({ nodeId, attributeId: AttributeIds.Value }));

    // Read data from nodes
    const dataValues = await session.read(nodesToRead);

    // Process and structure the data
    const data = {};
    dataValues.forEach((dataValue, index) => {
      const nodeId = nodeIds[index];
      data[nodeId] = dataValue.value.value;
    });

    return data;
  } catch (error) {
    console.error('(readOpcUaData) - Error:', error.message);
    await msSqlConnect.sqlLog(error.message);
  } finally {
    // Disconnect from the OPC UA server in all cases
    await client.disconnect();
  }
}

module.exports = readOpcUaData;
