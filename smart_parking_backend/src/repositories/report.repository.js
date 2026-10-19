const{poolPromise,sql} = require('../config/db');
class ReportRepository{
    async getAllPayments(type,status){
        const pool = await poolPromise;
        const query = `SELECT p.*, u.full_name, u.email FROM payments p LEFT JOIN users u ON p.user_id = u.id WHERE 1=1`
        const request = pool.request();

        if(type){
            query += `AND p.type = @type`;
            request.input('type',sql.VarChar(20),type);
        }

        if(status){
            query += `AND p.status = @status`;
            request.input('status',sql.VarChar(20),status)
        }
        query += `ORDER BY p.created_at DESC;`;
        const result = await request.query(query);
        return result.recordset;
    }

    async refundPayment(paymentId){
        const pool = await poolPromise;
        const query = `UPDATE payments SET status = 'REFUNDED' OUTPUT INSERTED.* WHERE id = @paymentId AND status = 'PAID';`;
        const result = await pool.request().input('paymentId',sql.VarChar(36),paymentId).query(query);
        return result.recordset[0];
    }

    async getDashboardMetrics(){
        const pool  = await poolPromise;
        const query = `SELECT 
        (SELECT ISNULL(SUM(amount), 0) FROM payments WHERE status = 'PAID') AS total_revenue,
        (SELECT COUNT(*) FROM parking_sessions WHERE CAST(entry_time AS DATE) = CAST(GETDATE() AS DATE)) AS total_entries_today,
        (SELECT COUNT(*) FROM parking_slots WHERE status = 'OCCUPIED') AS occupied_slots,
        (SELECT COUNT(*) FROM parking_slots WHERE status = 'AVAILABLE') AS available_slots,
        (SELECT COUNT(*) FROM users WHERE role = 'CUSTOMER') AS total_customers;`;
        const result = await pool.request().query(query);
        return result.recordset[0];
    }
}
module.exports = new ReportRepository();