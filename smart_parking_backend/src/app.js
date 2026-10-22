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
const { connectDB } = require("./config/db");

// ==================== KHỞI TẠO APP ====================
const app = express();

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== ROUTES AUTH & USER & INCIDENT ====================
const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const customerIncidentRoutes = require("./routes/customer.incident.routes");
const adminRoutes = require("./routes/admin.user.routes");

// ==================== ROUTES CUSTOMER ====================
const vehicleRoutes = require("./routes/vehicle.routes");
const smartpassRoutes = require("./routes/smartpass.routes");
const customerAccessLogRoutes = require("./routes/customer-access-log.routes");
const bookingRoutes = require("./routes/booking.routes");
const subscriptionRoutes = require("./routes/subscription.routes");

// ==================== ROUTES STAFF ====================
const staffRoutes = require("./routes/staff.routes");
const accessLogRoutes = require("./routes/access-log.routes");

// ==================== ROUTES ADMIN ====================
const credentialRoutes = require("./routes/credential.routes");
const adminAccessLogRoutes = require("./routes/admin-access-log.routes");
const adminVehicleRoutes = require("./routes/admin-vehicle.routes");
const parkingRoutes = require("./routes/parking.routes");
const pricingRoutes = require("./routes/pricing.routes");
const reportRoutes = require("./routes/report.routes");

// ==================== ROUTES ACCESS ====================
const automaticAccessRoutes = require("./routes/automatic-access.routes");

// ==================== ROOT ====================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart Parking API backend đang hoạt động!"
  });
});

// ==================== AUTH & PROFILE & ADMIN USER ====================
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", profileRoutes);
app.use("/api/v1/customer/incidents", customerIncidentRoutes);
app.use("/api/v1/admin", adminRoutes);

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

// ==================== INVALID JSON HANDLER ====================
app.use((err, req, res, next) => {
  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_JSON_BODY",
        message: "Dữ liệu JSON gửi lên không đúng định dạng cú pháp"
      }
    });
  }

  next(err);
});

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
  // Lấy status code từ error (mặc định 500 nếu là lỗi hệ thống không lường trước)
  const statusCode = err.statusCode || 500;
  
  // Xác định mã lỗi code
  let errorCode = 'INTERNAL_SERVER_ERROR';
  if (statusCode === 400) errorCode = 'BAD_REQUEST';
  else if (statusCode === 401) errorCode = 'UNAUTHORIZED';
  else if (statusCode === 403) errorCode = 'FORBIDDEN';
  else if (statusCode === 404) errorCode = 'NOT_FOUND';

  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || 'Lỗi bên phía server'
    }
  });
});

// ==================== START SERVER ====================
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;