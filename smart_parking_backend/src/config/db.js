const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: process.env.DB_INSTANCE,
  },
};

const connectDB = async () => {
  try {
    const pool = await sql.connect(config);
    console.log('✅ Kết nối SQL Server (SmartParkingDB) thành công!');
    return pool;
  } catch (error) {
    console.error('❌ Lỗi kết nối SQL Server:', error.message);
    process.exit(1);
  }
};

module.exports = { sql, connectDB };