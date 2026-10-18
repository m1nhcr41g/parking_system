const {poolPromise,sql} = require('../config/db');

class ParkingRepository{
    async createParkingLot({name, address, openingHours}){
        const pool = await poolPromise;
        const query = `INSERT INTO parking_lots (name, address, opening_hours, status)
      OUTPUT INSERTED.*
      VALUES (@name, @address, @openingHours, 'ACTIVE');`;
        const result = await pool.request().input('name',sql.NVarChar(100),name).input('address',sql.NVarChar(255),address)
      .input('openingHours',sql.VarChar(50),openingHours).query(query);
      return result.recordset[0];
    }

    async getAllParkingLots(){
        const pool = await poolPromise;
        const query = `SELECT * FROM parking_lots ORDER BY name ASC`;
        const result = await pool.request().query(query);
        return result.recordset;
    }

    async updateParkingLot(id, {name,address,openingHours,status}){
        const pool = await poolPromise;
        const query = `UPDATE parking_lots
      SET name = ISNULL(@name, name),
          address = ISNULL(@address, address),
          opening_hours = ISNULL(@openingHours, opening_hours),
          status = ISNULL(@status, status)
      OUTPUT INSERTED.*
      WHERE id = @id;`;
        const result = await pool.request().input('id',sql.VarChar(36),id).input('name', sql.NVarChar(100),name||null)
        .input('address',sql.NVarChar(255),address||null).input('openingHours',sql.VarChar(50),openingHours||null)
        .input('status',sql.VarChar(20),status||null).query(query);
        return result.recordset;
    }

    async createParkingArea({parkingLotId, name, capacity, vehicleType}){
      const pool = await poolPromise;
      const query = `INSERT INTO parking_areas (parking_lot_id, name, capacity, vehicle_type)
      OUTPUT INSERTED.*
      VALUES (@parkingLotId, @name, @capacity, @vehicleType);`;
      const result = await pool.request().input('parkingLotId',sql.VarChar(36),parkingLotId).input('name',sql.NVarChar(100),name).input('capacity',sql.Int,capacity)
      .input('vehicleType',sql.VarChar(20),vehicleType).query(query);
      return result.recordset[0];                   
    }

    async getAreasByLotId(lotId){
      const pool = await poolPromise;
      const query = `SELECT * FROM parking_areas WHERE parking_lot_id = @lotId;`;
      const result = await pool.request().query(query);
      return result.recordset;
    }

    async createParkingSlot({ parkingAreaId, code }){
      const pool = await poolPromise;
      const query = `INSERT INTO parking_slots (parking_area_id, code, status)
      OUTPUT INSERTED.*
      VALUES (@parkingAreaId, @code, 'AVAILABLE');`;
      const result = await pool.request().input('parkingAreaId',sql.VarChar(36),parkingAreaId).input("code",sql.VarChar(20),code).query(query);
      return result.recordset[0];
    }

    async updateSlotStatus(slotId, status) {
    const pool = await poolPromise;
    const query = `
      UPDATE parking_slots
      SET status = @status
      OUTPUT INSERTED.*
      WHERE id = @slotId;
    `;
    const result = await pool.request()
      .input('slotId', sql.VarChar(36), slotId)
      .input('status', sql.VarChar(20), status)
      .query(query);
    return result.recordset[0];
  }
}

module.exports = new ParkingRepository();