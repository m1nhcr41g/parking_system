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

if (env.db.instanceName) {
  dbConfig.options.instanceName = env.db.instanceName;
} else if (env.db.port) {
  dbConfig.port = env.db.port;
}

// 1. Tạo poolPromise cho các file code nào dùng pool
const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then((pool) => {
    console.log("Connected to SmartParkingDB via Pool");
    return pool;
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    throw error;
  });

// 2. KÍCH HOẠT KẾT NỐI TOÀN CỤC: Giúp các lệnh `new sql.Request()` của nhóm chạy ngon lành mà không bị lỗi "No connection is specified"
sql.connect(dbConfig)
  .then(() => {
    console.log("Global SQL connection established");
  })
  .catch((err) => {
    console.error("Global SQL connection failed:", err.message);
  });

module.exports = {
  sql,
  poolPromise,
  connectDB: () => poolPromise // 
};