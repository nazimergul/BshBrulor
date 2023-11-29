const sql = require('mssql');
const configData = require('../../cfg-data/mssqlConfig.json');

// Class for SQL connection
class MsSqlConnection {
  constructor() {
    // SQL connection configuration
    this.sqlConfig = {
      user: configData.user,
      password: configData.password,
      server: configData.server,
      database: configData.database,
      options: {
        encrypt: configData.options.encrypt
      },
    };
    this.tableName = configData.tableName;
    this.logTableName = configData.logTableName;
  }

  // Method to insert data into SQL
  async insertDataToSql(queryData) {
    try {
      await sql.connect(this.sqlConfig);

      const query = `
        INSERT INTO ${this.tableName} (${Object.keys(queryData).map((key) => `[${key}]`).join(',')})
        VALUES (${Object.values(queryData).map((value) => (typeof value === 'string' ? `'${value}'` : value)).join(',')})
      `;

      await sql.query(query);

      console.log('Insert successful.');
    } catch (error) {
      console.error('(insertDataToSql) - Error:', error.message);
      await this.logToMsSql(error.message);
    } finally {
      await sql.close();
    }
  }

  // Method to log information to SQL
  async logToMsSql(logInfo) {
    try {
      await sql.connect(this.sqlConfig);

      const query = `
        INSERT INTO ${this.logTableName} ("info")
        VALUES ('${logInfo}')`;

      await sql.query(query);

      console.log('Info logged.');
    } catch (error) {
      console.error('(logToMsSql) - Error:', error.message);
    } finally {
      await sql.close();
    }
  }
}

module.exports = MsSqlConnection;
