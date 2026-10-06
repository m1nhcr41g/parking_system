IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'SmartParkingDB')
BEGIN
    CREATE DATABASE SmartParkingDB;
END
GO

USE SmartParkingDB;
GO
IF OBJECT_ID('dbo.users', 'U') IS NULL
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    full_name NVARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'STAFF', 'ADMIN')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BLOCKED', 'DISABLED')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

IF OBJECT_ID('dbo.staff_profiles', 'U') IS NULL
CREATE TABLE staff_profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    user_id VARCHAR(36) NOT NULL UNIQUE,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    department NVARCHAR(100) NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

IF OBJECT_ID('dbo.vehicles', 'U') IS NULL
CREATE TABLE vehicles (
    id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('CAR', 'MOTORBIKE', 'BICYCLE')),
    brand NVARCHAR(50) NULL,
    model NVARCHAR(50) NULL,
    color NVARCHAR(30) NULL,
    manufacture_year INT NULL,
    chassis_number VARCHAR(50) NULL,
    engine_number VARCHAR(50) NULL,
    verify_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (verify_status IN ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    status_reason NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

IF OBJECT_ID('dbo.vehicle_owners', 'U') IS NULL
CREATE TABLE vehicle_owners (
    id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    user_id VARCHAR(36) NOT NULL,
    vehicle_id VARCHAR(36) NOT NULL,
    driver_role VARCHAR(20) NOT NULL DEFAULT 'OWNER' CHECK (driver_role IN ('OWNER', 'AUTHORIZED_DRIVER', 'FAMILY_MEMBER', 'EMPLOYEE', 'OTHER')),
    CONSTRAINT UQ_User_Vehicle UNIQUE (user_id, vehicle_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

IF OBJECT_ID('dbo.registration_documents', 'U') IS NULL
CREATE TABLE registration_documents (
    id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    vehicle_id VARCHAR(36) NOT NULL,
    document_type NVARCHAR(50) NOT NULL,
    document_number VARCHAR(50) NOT NULL,
    owner_name NVARCHAR(100) NOT NULL,
    registration_date DATE NULL,
    issuing_authority NVARCHAR(100) NULL,
    file_url VARCHAR(500) NOT NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

IF OBJECT_ID('dbo.verification_logs', 'U') IS NULL
CREATE TABLE verification_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    vehicle_id VARCHAR(36) NOT NULL,
    reviewer_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL,
    decision NVARCHAR(50) NOT NULL,
    reason NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

IF OBJECT_ID('dbo.credentials', 'U') IS NULL
CREATE TABLE credentials (
    id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    vehicle_id VARCHAR(36) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'QR_CODE' CHECK (type IN ('QR_CODE', 'BARCODE', 'LICENSE_PLATE')),
    secure_token VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
    issued_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    expired_at DATETIME2 NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

IF OBJECT_ID('dbo.smart_passes', 'U') IS NULL
CREATE TABLE smart_passes (
    id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    vehicle_id VARCHAR(36) NOT NULL,
    credential_id VARCHAR(36) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED')),
    auto_pay BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (credential_id) REFERENCES credentials(id)
);

IF OBJECT_ID('dbo.parking_lots', 'U') IS NULL
CREATE TABLE parking_lots (
    id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(100) NOT NULL,
    address NVARCHAR(255) NOT NULL,
    opening_hours VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE'))
);
IF OBJECT_ID('dbo.parking_areas', 'U') IS NULL
CREATE TABLE parking_areas (
    id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    parking_lot_id VARCHAR(36) NOT NULL,
    name NVARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('CAR', 'MOTORBIKE', 'BICYCLE')),
    FOREIGN KEY (parking_lot_id) REFERENCES parking_lots(id) ON DELETE CASCADE
);

IF OBJECT_ID('dbo.parking_slots', 'U') IS NULL
CREATE TABLE parking_slots (
    id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    parking_area_id VARCHAR(36) NOT NULL,
    code VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'DISABLED')),
    CONSTRAINT UQ_Area_SlotCode UNIQUE (parking_area_id, code),
    FOREIGN KEY (parking_area_id) REFERENCES parking_areas(id) ON DELETE CASCADE
);

IF OBJECT_ID('dbo.pricing_rules', 'U') IS NULL
CREATE TABLE pricing_rules (
    id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    parking_lot_id VARCHAR(36) NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('CAR', 'MOTORBIKE', 'BICYCLE')),
    first_hour_fee DECIMAL(10,2) NOT NULL,
    next_hour_fee DECIMAL(10,2) NOT NULL,
    max_daily_fee DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (parking_lot_id) REFERENCES parking_lots(id) ON DELETE CASCADE
);

IF OBJECT_ID('dbo.bookings', 'U') IS NULL
CREATE TABLE bookings (
    id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    user_id VARCHAR(36) NOT NULL,
    vehicle_id VARCHAR(36) NOT NULL,
    slot_id VARCHAR(36) NOT NULL,
    start_time DATETIME2 NOT NULL,
    end_time DATETIME2 NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'NO_SHOW')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (slot_id) REFERENCES parking_slots(id)
);

IF OBJECT_ID('dbo.subscription_plans', 'U') IS NULL
CREATE TABLE subscription_plans (
    id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(100) NOT NULL,
    duration VARCHAR(20) NOT NULL CHECK (duration IN ('WEEKLY', 'MONTHLY', 'HALF_YEAR', 'YEARLY')),
    price DECIMAL(10,2) NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('CAR', 'MOTORBIKE', 'BICYCLE')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);

IF OBJECT_ID('dbo.service_subscriptions', 'U') IS NULL
CREATE TABLE service_subscriptions (
    id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    user_id VARCHAR(36) NOT NULL,
    vehicle_id VARCHAR(36) NOT NULL,
    plan_id VARCHAR(36) NOT NULL,
    start_date DATETIME2 NOT NULL,
    end_date DATETIME2 NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);
IF OBJECT_ID('dbo.parking_sessions', 'U') IS NULL
CREATE TABLE parking_sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    parking_lot_id VARCHAR(36) NOT NULL,
    slot_id VARCHAR(36) NULL,
    vehicle_id VARCHAR(36) NULL,
    guest_plate VARCHAR(20) NULL,
    entry_time DATETIME2 NOT NULL DEFAULT GETDATE(),
    exit_time DATETIME2 NULL,
    total_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    access_method VARCHAR(20) NOT NULL DEFAULT 'LICENSE_PLATE' CHECK (access_method IN ('LICENSE_PLATE', 'QR_CODE', 'BARCODE', 'MANUAL_ENTRY')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
    FOREIGN KEY (parking_lot_id) REFERENCES parking_lots(id),
    FOREIGN KEY (slot_id) REFERENCES parking_slots(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);
IF OBJECT_ID('dbo.access_logs', 'U') IS NULL
CREATE TABLE access_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    user_id VARCHAR(36) NULL,
    plate_number VARCHAR(20) NOT NULL,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('CHECK_IN', 'CHECK_OUT')),
    method VARCHAR(20) NOT NULL CHECK (method IN ('LICENSE_PLATE', 'QR_CODE', 'BARCODE', 'MANUAL_ENTRY')),
    result VARCHAR(10) NOT NULL CHECK (result IN ('ALLOW', 'DENY')),
    reason NVARCHAR(255) NULL,
    timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
IF OBJECT_ID('dbo.payments', 'U') IS NULL
CREATE TABLE payments (
    id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    user_id VARCHAR(36) NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('GUEST_PARKING', 'SMART_PASS', 'BOOKING', 'SUBSCRIPTION')),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED')),
    method VARCHAR(50) NOT NULL,
    booking_id VARCHAR(36) NULL UNIQUE,
    subscription_id VARCHAR(36) NULL UNIQUE,
    session_id VARCHAR(36) NULL UNIQUE,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (subscription_id) REFERENCES service_subscriptions(id),
    FOREIGN KEY (session_id) REFERENCES parking_sessions(id)
);
IF OBJECT_ID('dbo.invoices', 'U') IS NULL
CREATE TABLE invoices (
    id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    user_id VARCHAR(36) NULL,
    payment_id VARCHAR(36) NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (payment_id) REFERENCES payments(id)
);
IF OBJECT_ID('dbo.incident_requests', 'U') IS NULL
CREATE TABLE incident_requests (
    id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    user_id VARCHAR(36) NOT NULL,                           
    vehicle_id VARCHAR(36) NULL,                             
    credential_id VARCHAR(36) NULL,                          
    type VARCHAR(50) NOT NULL CHECK (type IN ('LOST_QR', 'LOST_BARCODE', 'GATE_ERROR', 'PAYMENT_ERROR', 'OTHER')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')),
    note NVARCHAR(MAX) NOT NULL,                             
    resolved_by VARCHAR(36) NULL,                            
    resolution_note NVARCHAR(MAX) NULL,                      
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (credential_id) REFERENCES credentials(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id)
);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Bookings_Slot_Time')
    CREATE INDEX IX_Bookings_Slot_Time ON bookings(slot_id, start_time, end_time, status);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AccessLogs_Plate_Time')
    CREATE INDEX IX_AccessLogs_Plate_Time ON access_logs(plate_number, timestamp);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ParkingSessions_Active')
    CREATE INDEX IX_ParkingSessions_Active ON parking_sessions(status, vehicle_id, guest_plate);
GO