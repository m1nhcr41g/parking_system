const sql = require('mssql');
require('dotenv').config();
const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || process.env.DB_DATABASE || 'SmartParkingDB',
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: process.env.DB_INSTANCE
  },
  pool: {
    max: 20,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// cach 1
const connectDB = async () => {
  try {
    const pool = await sql.connect(config);
    console.log('ket noi thanh cong');
    return pool;
  } catch (error) {
    console.error('loi ket noi', error.message);
    process.exit(1);
  }
};

// cach 2
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('ket noi thanh cong');
    return pool;
  })
  .catch(err => {
    console.error('loi ket noi', err.message);
    process.exit(1);
  });

module.exports = {
  sql,
  connectDB,
  poolPromise
};