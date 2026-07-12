-- =========================================
-- TransitOps Full Database Schema
-- Run this in Supabase SQL Editor
-- =========================================

-- Drop tables if re-running during dev (comment out in production)
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS fuel_logs CASCADE;
DROP TABLE IF EXISTS maintenance_logs CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =========================================
-- 1. USERS (with role for RBAC)
-- =========================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- 2. VEHICLES
-- =========================================
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    registration_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    max_load_capacity_kg NUMERIC(10, 2) NOT NULL,
    odometer NUMERIC(10, 2) DEFAULT 0,
    acquisition_cost NUMERIC(12, 2) NOT NULL,
    region VARCHAR(100), -- used for Dashboard region filter
    status VARCHAR(20) NOT NULL DEFAULT 'Available'
        CHECK (status IN ('Available', 'On Trip', 'In Shop', 'Retired')),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE vehicle_documents (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    doc_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW()
);
-- =========================================
-- 3. DRIVERS
-- =========================================
CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_category VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    license_expiry_date DATE NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    safety_score NUMERIC(5, 2) DEFAULT 100,
    status VARCHAR(20) NOT NULL DEFAULT 'Available'
        CHECK (status IN ('Available', 'On Trip', 'Off Duty', 'Suspended')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- 4. TRIPS
-- =========================================
CREATE TABLE trips (
    id SERIAL PRIMARY KEY,
    source VARCHAR(150) NOT NULL,
    destination VARCHAR(150) NOT NULL,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
    cargo_weight_kg NUMERIC(10, 2) NOT NULL,
    planned_distance_km NUMERIC(10, 2) NOT NULL,
    final_odometer NUMERIC(10, 2),
    fuel_consumed_liters NUMERIC(10, 2),
    revenue NUMERIC(12, 2) DEFAULT 0, -- used for Vehicle ROI calculation in Reports
    status VARCHAR(20) NOT NULL DEFAULT 'Draft'
        CHECK (status IN ('Draft', 'Dispatched', 'Completed', 'Cancelled')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    dispatched_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- 5. MAINTENANCE LOGS
-- =========================================
CREATE TABLE maintenance_logs (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    service_type VARCHAR(100) NOT NULL,
    cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    service_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'In Shop'
        CHECK (status IN ('In Shop', 'Completed')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- 6. FUEL LOGS
-- =========================================
CREATE TABLE fuel_logs (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
    liters NUMERIC(10, 2) NOT NULL,
    cost NUMERIC(12, 2) NOT NULL,
    log_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- 7. EXPENSES (tolls, misc, etc.)
-- =========================================
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
    expense_type VARCHAR(50) NOT NULL, -- e.g. 'Toll', 'Misc'
    amount NUMERIC(12, 2) NOT NULL,
    expense_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- Helpful indexes for common queries
-- =========================================
CREATE INDEX idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX idx_trips_driver_id ON trips(driver_id);
CREATE INDEX idx_maintenance_vehicle_id ON maintenance_logs(vehicle_id);
CREATE INDEX idx_fuel_logs_vehicle_id ON fuel_logs(vehicle_id);
CREATE INDEX idx_expenses_vehicle_id ON expenses(vehicle_id);
CREATE INDEX idx_vehicles_region ON vehicles(region);
CREATE INDEX idx_vehicle_documents_vehicle_id ON vehicle_documents(vehicle_id);