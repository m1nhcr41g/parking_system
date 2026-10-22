const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const customerIncidentRoutes = require('./routes/customer.incident.routes');
const adminRoutes = require('./routes/admin.user.routes');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Bắt lỗi cú pháp JSON gửi lên từ client
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON_BODY',
        message: 'Dữ liệu JSON gửi lên không đúng định dạng cú pháp'
      }
    });
  }
  next();
});
// Route kiểm tra máy chủ
app.get('/', (req, res) => {
  res.json({ message: 'Smart Parking API backend đang hoạt động!' });
});

// Route Auth
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', profileRoutes);
app.use('/api/v1/customer/incidents', customerIncidentRoutes);
app.use('/api/v1/admin', adminRoutes);

// Khởi động server và kết nối DB
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(` Server đang chạy tại http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Không thể khởi động server:", error);
  }
};

startServer();

const { use } = require('react');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

const bookingRoutes = require('../src/routes/booking.routes');
const subscriptionRoutes = require('../src/routes/subscription.routes');
const parkingRoutes = require('../src/routes/parking.routes');
const pricingRoutes = require('../src/routes/pricing.routes'); 
const reportRoutes  = require('../src/routes/report.routes');

app.use('/api/v1/customer/bookings', bookingRoutes);
app.use('/api/v1/customer/subscriptions', subscriptionRoutes);
app.use('/api/v1/admin', parkingRoutes); 
app.use('/api/v1/admin', pricingRoutes);
app.use('/api/v1/admin/reports', reportRoutes);

app.use((req,res,next)=>{
    res.status(404).json({
        success:false,
        message:'Endpoint Api ko ton tai'
    });
});

app.use((err, req, res, next)=>{
    console.error('loi server ',err.stack);
    res.status(500).json({
        success:false,
        message:'loi ben phia server',
        error: err.message
    });
});

module.exports = app;

