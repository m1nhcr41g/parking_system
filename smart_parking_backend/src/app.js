const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
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
      message: 'Dữ liệu JSON gửi lên không đúng định dạng cú pháp'
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
app.use('/api/v1/profile', profileRoutes);

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