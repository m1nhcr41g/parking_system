const { parse } = require('dotenv');

require('dotenv').config();
module.exports={
    port:process.env.PORT||3000,
    nodeEnv:process.env.NODE_ENV||'development',

    db:{
        user:process.env.DB_USER||'sa',
        password:process.env.DB_PASSWORD||"craig2005@",
        server:process.env.DB_USER||"localhost",
        database:process.env.DB_NAME||"SmartParkingDB",
        server:parseInt(process.env.DB_PORT||'1433')
    },

//     jwt: {
//     secret: process.env.JWT_SECRET || 'SmartPark_Secret_Key_2026',
//     expiresIn: process.env.JWT_EXPIRES_IN || '1d'
//   }
}