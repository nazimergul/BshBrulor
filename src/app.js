// Import necessary modules
const dorukDataModule = require('./controllers/dorukDataGetXML');
const opcuaClientModule = require('./controllers/opcuaClient');
const msSqlModule = require('./controllers/msSqlConnect');
const plcTagConfig = require('../cfg-data/plcTagConfig.json');

// Function to fetch data from Doruk
async function fetchDataFromDoruk() {
  try {
    return await dorukDataModule();
  } catch (error) {
    console.error('(fetchDataFromDoruk) - Error:', error.message);
    throw error;
  }
}

// Function to fetch data from OPC-UA
async function fetchDataFromOpcUa() {
  try {
    // Get PLC tag configuration information
    const { plcTagsNodeIds, tagNames } = getOpcUaTagInfo(plcTagConfig);
    
    // Perform OPC-UA data reading
    const opcUaReadData = await opcuaClientModule(plcTagsNodeIds);

    // Process OPC-UA data
    return processOpcUaData(opcUaReadData, tagNames);
  } catch (error) {
    console.error('(fetchDataFromOpcUa) - Error:', error.message);
    throw error;
  }
}

// Function to prepare PLC tag configuration information
function getOpcUaTagInfo(plcTagConfig) {
  const plcTagsNodeIds = Object.values(plcTagConfig).map((plcTag) => plcTag.opcNodeId);
  const tagNames = Object.values(plcTagConfig).map((plcTag) => plcTag.tagName);
  return { plcTagsNodeIds, tagNames };
}

// Function to process OPC-UA data
function processOpcUaData(opcUaReadData, tagNames) {
  if (!opcUaReadData) {
    return null;
  }

  // Object to hold processed OPC-UA data
  const opcData = {};

  // Process OPC-UA data with a loop
  Object.keys(opcUaReadData).forEach((opcNodeId, index) => {
    switch (typeof opcUaReadData[opcNodeId]) {
      case 'number':
        // Process numeric data, round to two decimal places if not an integer
        opcData[tagNames[index]] = isFinite(opcUaReadData[opcNodeId]) && (Math.floor(opcUaReadData[opcNodeId]) === opcUaReadData[opcNodeId])
          ? opcUaReadData[opcNodeId]
          : opcUaReadData[opcNodeId].toFixed(2);
        break;
      case 'boolean':
        // Process boolean data
        opcData[tagNames[index]] = opcUaReadData[opcNodeId] ? 1 : 0;
        break;
      case 'string':
        // Process string data
        opcData[tagNames[index]] = opcUaReadData[opcNodeId];
        break;
      default:
        console.log("Undefined data type!");
    }
  });

  return opcData;
}

// Main function to collect and insert data into SQL database
async function collectAndInsertData() {
  try {
    // Fetch Doruk and OPC-UA data simultaneously
    const dorukData = await fetchDataFromDoruk();
    const opcData = await fetchDataFromOpcUa();

    // Check if both OPC-UA and Doruk data are available
    if (!opcData && !dorukData) {
      console.log("No OPC data, NO Doruk Data!");
    } else {
      // Merge the data and insert into SQL database
      const mergedData = { ...dorukData, ...opcData };
      await msSqlModule.insertDataToSql(mergedData);
    }
  } catch (error) {
    // Log the error and terminate the process in case of an error
    console.error('(collectAndInsertData) - Error:', error.message);
    await msSqlModule.sqlLog(error.message);
  }
}

// Function to perform data collection at specific intervals
setInterval(collectAndInsertData, 15000);
