const { sql } = require("../config/database");

async function createRegistrationDocument(data, transaction) {
    const request = new sql.Request(transaction);

    request.input("id", sql.VarChar(36), data.id);
    request.input("vehicle_id", sql.VarChar(36), data.vehicle_id);
    request.input("document_type", sql.VarChar(50), data.document_type);
    request.input("document_number", sql.VarChar(100), data.document_number);
    request.input("owner_name", sql.VarChar(255), data.owner_name);
    request.input("registration_date", sql.Date, data.registration_date);
    request.input("issuing_authority", sql.VarChar(255), data.issuing_authority);
    request.input("file_url", sql.VarChar(500), data.file_url);

    const result = await request.query(`
        INSERT INTO registration_documents (
            id,
            vehicle_id,
            document_type,
            document_number,
            owner_name,
            registration_date,
            issuing_authority,
            file_url
        )
        OUTPUT
            INSERTED.id,
            INSERTED.vehicle_id,
            INSERTED.document_type,
            INSERTED.document_number,
            INSERTED.owner_name,
            INSERTED.registration_date,
            INSERTED.issuing_authority,
            INSERTED.file_url
        VALUES (
            @id,
            @vehicle_id,
            @document_type,
            @document_number,
            @owner_name,
            @registration_date,
            @issuing_authority,
            @file_url
        )
    `);

    return result.recordset[0];
}

module.exports = {
    createRegistrationDocument
};