const {poolPromise, sql } = require('../config/db');

const createIncident = async ({ userId, vehicleId = null, credentialId = null, type, note }) => {
  const request = new sql.Request();
  const result = await request
    .input('userId', sql.VarChar(36), userId)
    .input('vehicleId', sql.VarChar(36), vehicleId)
    .input('credentialId', sql.VarChar(36), credentialId)
    .input('type', sql.VarChar(50), type)
    .input('note', sql.NVarChar(sql.MAX), note)
    .query(`
      INSERT INTO incident_requests (user_id, vehicle_id, credential_id, type, note)
      OUTPUT INSERTED.id, INSERTED.user_id, INSERTED.vehicle_id, INSERTED.credential_id,
             INSERTED.type, INSERTED.status, INSERTED.note, INSERTED.created_at
      VALUES (@userId, @vehicleId, @credentialId, @type, @note)
    `);
  return result.recordset[0];
};

// Lấy danh sách sự cố của user (sắp xếp mới nhất lên đầu)
const getIncidentsByUserId = async (userId) => {
  const request = new sql.Request();
  const result = await request
    .input('userId', sql.VarChar(36), userId)
    .query(`
      SELECT 
        i.id,
        i.user_id,
        i.vehicle_id,
        v.plate_number,
        i.credential_id,
        i.type,
        i.status,
        i.note,
        i.resolution_note,
        i.created_at,
        i.updated_at
      FROM incident_requests i
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      WHERE i.user_id = @userId
      ORDER BY i.created_at DESC
    `);
  return result.recordset;
};

const getAllIncidents = async (status = null )=>{
  const pool = await poolPromise;
  const request =  pool.request();
  let query = `SELECT i.id,i.user_id,u.full_name AS customer_name,u.phone AS customer_phone,i.vehicle_id,v.plate_number,i.credential_id,i.type,i.status,i.note,i.resolution_note,i.created_at,i.updated_at
    FROM incident_requests i
    LEFT JOIN users u ON i.user_id = u.id
    LEFT JOIN vehicles v ON i.vehicle_id = v.id
    WHERE 1=1`;
  if (status){
    query += `AND i.status = @status`;
    request.input(`status`,sql.VarChar(20),status);
  }
    query += `ORDER BY i.created_at DESC;`;
    const result = await request.query(query);
    return result.recordset;
}

const verifyIncident = async(incidentId, { status, resolutionNote })=>{
  const pool = await poolPromise;
  const request = pool.request();
  let query = `UPDATE incident_requests
    SET status = @status,resolution_note = @resolutionNote,updated_at = GETDATE()
    OUTPUT INSERTED.id, INSERTED.user_id,INSERTED.status, INSERTED.resolution_note, INSERTED.updated_at
    WHERE id = @incidentId;`;
  const result = await request.input('incidentId',sql.VarChar(36),incidentId).input('status',sql.VarChar(20),status).input('resolutionNote',sql.NVarChar(sql.MAX),resolutionNote||null).query(query);
  return result.recordset[0];

}
module.exports = {
  createIncident,
  getIncidentsByUserId,
  getAllIncidents,
  verifyIncident,
};