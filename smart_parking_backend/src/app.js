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
const staffRoutes = require("./routes/staff.routes");
const accessLogRoutes = require("./routes/access-log.routes");
const credentialRoutes = require("./routes/credential.routes");

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use("/api/v1/customer", vehicleRoutes);
app.use("/api/v1/customer/smartpass", smartpassRoutes);
app.use("/api/v1/staff", staffRoutes);
app.use("/api/v1/staff/access-logs", accessLogRoutes);
app.use("/api/v1/admin/credentials", credentialRoutes);

const multer = require("multer");

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        const tooLarge = err.code === "LIMIT_FILE_SIZE";

        return res.status(tooLarge ? 413 : 400).json({
            success: false,
            error: {
                code: err.code,
                message: tooLarge
                    ? "File không được vượt quá 5 MB"
                    : "Upload file thất bại"
            }
        });
    }

    if (err.message === "INVALID_FILE_TYPE") {
        return res.status(400).json({
            success: false,
            error: {
                code: "INVALID_FILE_TYPE",
                message: "Chỉ chấp nhận JPG, JPEG, PNG hoặc PDF"
            }
        });
    }

    next(err);
});



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});