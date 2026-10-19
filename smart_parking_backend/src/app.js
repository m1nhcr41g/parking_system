const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const bookingRoutes = require('./routes/booking.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const parkingRoutes = require('./routes/parking.routes');
const pricingRoutes = require('./routes/pricing.routes'); 
const reportRoutes = require('./routes/report.routes');

app.use('/api/v1/customer/bookings', bookingRoutes);
app.use('/api/v1/customer/subscriptions', subscriptionRoutes);
app.use('/api/v1/admin', parkingRoutes); 
app.use('/api/v1/admin', pricingRoutes);
app.use('/api/v1/admin/reports', reportRoutes);

app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint API không tồn tại'
    });
});

app.use((err, req, res, next) => {
    console.error('Lỗi server:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Lỗi bên phía server',
        error: err.message
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
});

module.exports = app;

