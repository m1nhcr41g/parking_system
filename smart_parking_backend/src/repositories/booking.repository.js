//const { pool, pool } = require('mssql');
const {poolPromise, sql} = require('../config/db');

class BookingRepository{
    async findAvailableSlots(parkingAreaId, startTime, endTime){
        const pool = await poolPromise;
        const query =`SELECT ps.id, ps.code, ps.parking_area_id, ps.status
      FROM parking_slots ps
      WHERE ps.parking_area_id = @parkingAreaId 
        AND ps.status = 'AVAILABLE'
        AND ps.id NOT IN (
          SELECT b.slot_id 
          FROM bookings b
          WHERE b.slot_id = ps.id
            AND b.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
            AND (
              (@startTime >= b.start_time AND @startTime < b.end_time)
              OR (@endTime > b.start_time AND @endTime <= b.end_time)
              OR (b.start_time >= @startTime AND b.start_time < @endTime)
            )
        )
    `;
    const result = await pool.request().input('parkingAreaId',sql.Varchar(36),parkingAreaId).input('startTime', sql.DateTime2, new Date(startTime)).input('endTime', sql.DateTime2, new Date(startTime))
    .querry(query);
    return result.recordset;
    }

    async createBooking({userId, vehicleId, slotId, startTime, endTime}){
        const pool = await poolPromise;
        const query = `INSERT INTO bookings (user_id, vehicle_id, slot_id, start_time, end_time, status)
      OUTPUT INSERTED.*
      VALUES (@userId, @vehicleId, @slotId, @startTime, @endTime, 'PENDING');`;
      const result  = await pool.request().input('userId',sql.Varchar(36),userId).input('vehicleId', sql.VarChar(36), vehicleId)
      .input('slotId',sql.VarChar(36),slotId).input('startTime', sql.DateTime2, new Date(startTime)).input('endTime', sql.DateTime2, new Date(endTime))
      .query(query);

      return result.recordset[0];
    }

    async findBookingById(bookingId){
      const pool = await poolPromise;
      const query = `SELECT * FROM bookings WHERE id = @bookingId`;
      const result =  await pool.request().input('bookingId',sql.VarChar(36),bookingId).query(query);

      return result.recordset[0];

    }

    async cancelBooking(bookingId, userId){
      const pool = await poolPromise;
      const query = `UPDATE bookings 
      SET status = 'CANCELLED'
      OUTPUT INSERTED.*
      WHERE id = @bookingId AND user_id = @userId;`;
      const result = await pool.request().input('bookingId',sql.VarChar(36),bookingId).query(query).input('userId',sql.VarChar(36),userId).query(query);
      return result.recordset[0];
    }

    async getBookingHistory(userId){
      const pool = await poolPromise;
      const query = `SELECT b.*, ps.code AS slot_code, ISNULL(v.plate_number, N'BICYCLE') AS plate_number, v.type AS vehicle_type
      FROM bookings b
      JOIN parking_slots ps ON b.slot_id = ps.id
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.user_id = @userId
      ORDER BY b.created_at DESC;`;
      const result = await pool.request().input('userId',sql.VarChar(36),userId).query(query);
      return result.recordset;
    }
}
 module.exports = new BookingRepository();
