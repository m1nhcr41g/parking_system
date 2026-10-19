const sql = require("mssql");
const env = require("./env.config");

const dbConfig = {
  user: env.db.user,
  password: env.db.password,
  server: env.db.server,
  database: env.db.database,

  options: {
    encrypt: false,
    trustServerCertificate: true
  },

  pool: {
    max: 20,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Nếu dùng SQL Server named instance thì ưu tiên instanceName.
// Nếu không, dùng port khi được cấu hình.
if (env.db.instanceName) {
  dbConfig.options.instanceName = env.db.instanceName;
} else if (env.db.port) {
  dbConfig.port = env.db.port;
}

const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then((pool) => {
    console.log("✅ Connected to SmartParkingDB");
    return pool;
  })
  .catch((error) => {
    console.error("❌ Database connection failed:", error.message);
    throw error;
  });

module.exports = {
  sql,
  poolPromise
};
