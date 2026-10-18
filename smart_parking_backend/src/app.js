const express = require('express');
const cors = require('cors');
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