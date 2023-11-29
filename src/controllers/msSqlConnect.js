const sql = require('mssql');
const configData = require('../../cfg-data/mssqlConfig.json');

// SQL Server connection configuration
const sqlConfig = {
  user: configData.user,
  password: configData.password,
  server: configData.server,
  database: configData.database,
  options: {
    encrypt: configData.options.encrypt
  },
};

// Table names for data and logs
const tableName = configData.tableName;
const logTableName = configData.logTableName;

async function insertDataToSql(queryData) {
  try {
    // Open a connection to SQL Server
    await sql.connect(sqlConfig);

    // Build the SQL query for data insertion
    const query = `
      INSERT INTO ${tableName} (${Object.keys(queryData).map((key) => `[${key}]`).join(',')})
      VALUES (${Object.values(queryData).map((value) => (typeof value === 'string' ? `'${value}'` : value)).join(',')})
    `;

    // Execute the query
    await sql.query(query);

    console.log('Insert successful.');
  } catch (error) {
    console.error('(insertDataToSql) - Error:', error.message);
    await logToMsSql(error.message);
  } finally {
    // Close the connection to SQL Server
    await sql.close();
  }
}

async function logToMsSql(logInfo) {
  try {
    // Open a connection to SQL Server
    await sql.connect(sqlConfig);

    // Build the SQL query for logging information
    const query = `
      INSERT INTO ${logTableName} ("info")
      VALUES ('${logInfo}')`;

    // Execute the query
    await sql.query(query);

    console.log('Info logged.');
  } catch (error) {
    console.error('(logToMsSql) - Error:', error.message);
  } finally {
    // Close the connection to SQL Server
    await sql.close();
  }
}

module.exports.insertDataToSql = insertDataToSql;
module.exports.sqlLog = logToMsSql;
