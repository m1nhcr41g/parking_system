 // Polyfill cho Promise.withResolvers (Node.js < 22)
if (typeof Promise.withResolvers !== "function") {
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
const multer = require("multer");

const app = express();

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== ROUTES ====================
const vehicleRoutes = require("./routes/vehicle.routes");
const smartpassRoutes = require("./routes/smartpass.routes");
const customerAccessLogRoutes = require("./routes/customer-access-log.routes");
const staffRoutes = require("./routes/staff.routes");
const accessLogRoutes = require("./routes/access-log.routes");
const credentialRoutes = require("./routes/credential.routes");
const adminAccessLogRoutes = require("./routes/admin-access-log.routes");
const adminVehicleRoutes = require("./routes/admin-vehicle.routes");
const automaticAccessRoutes = require("./routes/automatic-access.routes");

// ==================== ROUTES CỦA NHÓM ====================
const bookingRoutes = require("./routes/booking.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const parkingRoutes = require("./routes/parking.routes");
const pricingRoutes = require("./routes/pricing.routes");
const reportRoutes = require("./routes/report.routes");

// ==================== CUSTOMER ====================
app.use("/api/v1/customer", vehicleRoutes);
app.use("/api/v1/customer/smartpass", smartpassRoutes);
app.use("/api/v1/customer/history/access-logs", customerAccessLogRoutes);
app.use("/api/v1/customer/bookings", bookingRoutes);
app.use("/api/v1/customer/subscriptions", subscriptionRoutes);

// ==================== STAFF ====================
app.use("/api/v1/staff", staffRoutes);
app.use("/api/v1/staff/access-logs", accessLogRoutes);

// ==================== ADMIN ====================
app.use("/api/v1/admin/credentials", credentialRoutes);
app.use("/api/v1/admin/access-logs", adminAccessLogRoutes);
app.use("/api/v1/admin/vehicles", adminVehicleRoutes);
app.use("/api/v1/admin", parkingRoutes);
app.use("/api/v1/admin", pricingRoutes);
app.use("/api/v1/admin/reports", reportRoutes);

// ==================== AUTOMATIC ACCESS ====================
app.use("/api/v1/access", automaticAccessRoutes);

// ==================== UPLOAD ERROR HANDLER ====================
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

// ==================== 404 HANDLER ====================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: "ENDPOINT_NOT_FOUND",
            message: "Endpoint API không tồn tại"
        }
    });
});

// ==================== GENERAL ERROR HANDLER ====================
app.use((err, req, res, next) => {
    console.error("Lỗi server:", err.stack);

    res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Lỗi bên phía server"
        }
    });
});

// ==================== START SERVER ====================
if (require.main === module) {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
}

module.exports = app;
