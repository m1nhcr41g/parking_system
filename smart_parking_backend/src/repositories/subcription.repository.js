const {poolPromise,sql} = require('../config/db');
class SubcriptionRepository{
    async getAllPlans(){
        const pool = await poolPromise;
        const query = `SELECT * FROM subscription_plans WHERE status = 'ACTIVE';`
        const result = await pool.request().query(query);
        return result.recordset;
    }

    async findPlanById(planId){
        const pool = await poolPromise;
        const query = `SELECT * FROM subscription_plans WHERE status = 'ACTIVE';`;
        const result = await pool.request().input('planId',sql.VarChar(36),planId).query(query);
        return result.recordset[0];    
    }   

    async createSubcription({ userId, vehicleId, planId, startDate, endDate }){
        const pool = await poolPromise;
        const query = `INSERT INTO service_subscriptions (user_id, vehicle_id, plan_id, start_date, end_date, status)
        OUTPUT INSERT VALUES (@userId, @vehicleId, @planId, @startDate, @endDate, PENDING);`;
        const result = await pool.request().input('userId', sql.VarChar(36), userId)
      .input('vehicleId', sql.VarChar(36), vehicleId)
      .input('planId', sql.VarChar(36), planId)
      .input('startDate', sql.DateTime2, new Date(startDate))
      .input('endDate', sql.DateTime2, new Date(endDate))
      .query(query);

      return result.recordset[0];
    }

    async getUserSubscriptions(userId) {
    const pool = await poolPromise;
    const query = `
      SELECT ss.*, sp.name AS plan_name, sp.duration, sp.price, v.plate_number
      FROM service_subscriptions ss
      JOIN subscription_plans sp ON ss.plan_id = sp.id
      JOIN vehicles v ON ss.vehicle_id = v.id
      WHERE ss.user_id = @userId
      ORDER BY ss.created_at DESC;
    `;

    const result = await pool.request()
      .input('userId', sql.VarChar(36), userId)
      .query(query);

    return result.recordset;
  }
}
module.exports = new SubcriptionRepository();