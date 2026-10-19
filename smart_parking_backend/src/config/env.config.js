require("dotenv").config();

module.exports = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  db: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || "localhost",
    database:
      process.env.DB_NAME ||
      process.env.DB_DATABASE ||
      "SmartParkingDB",
    port: process.env.DB_PORT
      ? Number(process.env.DB_PORT)
      : undefined,
    instanceName: process.env.DB_INSTANCE || undefined
  }
};

