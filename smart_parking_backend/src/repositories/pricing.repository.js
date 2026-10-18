const{poolPromise, sql} = require('../config/db');
class PricingRepository{
    async upsertPricingRule({ parkingLotId, vehicleType, firstHourFee, nextHourFee, maxDailyFee }){
        const pool = await poolPromise;
        const query=`IF EXISTS (SELECT 1 FROM pricing_rules WHERE parking_lot_id = @parkingLotId AND vehicle_type = @vehicleType)
      BEGIN
        UPDATE pricing_rules
        SET first_hour_fee = @firstHourFee,
            next_hour_fee = @nextHourFee,
            max_daily_fee = @maxDailyFee
        OUTPUT INSERTED.*
        WHERE parking_lot_id = @parkingLotId AND vehicle_type = @vehicleType;
      END
      ELSE
      BEGIN
        INSERT INTO pricing_rules (parking_lot_id, vehicle_type, first_hour_fee, next_hour_fee, max_daily_fee)
        OUTPUT INSERTED.*
        VALUES (@parkingLotId, @vehicleType, @firstHourFee, @nextHourFee, @maxDailyFee);
      END`;
      const result = await pool.request().input('parkingLotId', sql.VarChar(36), parkingLotId).input('vehicleType', sql.VarChar(20), vehicleType)
      .input('firstHourFee', sql.Decimal(10, 2), firstHourFee)
      .input('nextHourFee', sql.Decimal(10, 2), nextHourFee).query(query);
      return result.recordset[0];
    }

    async createSubscriptionPlan({ name, duration, price, vehicleType }){
        const pool = await poolPromise;
        const query =  `INSERT INTO subscription_plans (name, duration, price, vehicle_type, status)
                        OUTPUT INSERTED.*
                        VALUES (@name, @duration, @price, @vehicleType, 'ACTIVE');`
        const result = await pool.request().input('name',sql.NVarChar(100),name).input('duration',sql.VarChar(20),duration)
        .input('price', sql.Decimal(10,2),price).input('vehicleType',sql.VarChar(20),vehicleType).query(query);
        return result.recordset[0];
    }

    async updateSubscriptionPlan(id, { name, price, status }){
        const pool = await poolPromise;
        const query = `UPDATE subscription_plans
                    SET name = ISNULL(@name, name),
                    price = ISNULL(@price, price),
                    status = ISNULL(@status, status)
                    OUTPUT INSERTED.*
                    WHERE id = @id;`;
        const result = await pool.request().input('id',sql.VarChar(36),id).input('name', sql.NVarChar(100),name).input('price',sql.Decimal(10,2),price)
        .input('status',sql.VarChar(20),status).query(query);
        return result.recordset[0];
    }
}

module.exports = new PricingRepository();