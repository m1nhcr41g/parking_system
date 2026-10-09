const sql = require("mssql");

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        instanceName: process.env.DB_INSTANCE,
        encrypt: false,
        trustServerCertificate: true
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then((pool) => {
        console.log("✅ Connected to SmartParkingDB");
        return pool;
    })
    .catch((error) => {
        console.error("❌ Database connection failed:");
        console.error(error);
        throw error;
    });

module.exports = { sql, poolPromise };