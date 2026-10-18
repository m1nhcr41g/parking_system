const sql = require('mssql');
const env = require('./env.config');

const dbConfig = {
    user: env.db.user,
    password: env.db.password,
    server: env.db.server,
    database: env.db.database,
    port: env.db.port,
    options:{
        encrypt:true,
        trustServerCertificate: true
    },
    pool:{
        max:20,
        min:0,
        idleTimeoutMillis:30000
    }
};

const poolPromise = new sql.ConnectionPool(dbConfig).connect.then(pool=>{
    console.log('ket noi thanh cong');
    return pool;
})
.catch(err=>{
    console.log('loi ket noi den db',err);
    process.exit(1);
});

module.exports={sql,poolPromise};
