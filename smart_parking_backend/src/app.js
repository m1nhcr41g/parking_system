// Polyfill cho Promise.withResolvers (cho Node.js < 22)
if (typeof Promise.withResolvers !== 'function') {
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const vehicleRoutes = require("./routes/vehicle.routes");
const smartpassRoutes = require("./routes/smartpass.routes");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use("/api/v1/customer", vehicleRoutes);
app.use("/api/v1/customer/smartpass", smartpassRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});