-- ============================================================
-- Clinic Management System - Database Schema
-- CCS6344 Assignment 1 - Database & Cloud Security
-- ============================================================

CREATE DATABASE IF NOT EXISTS clinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clinic_db;

-- Users table (authentication)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'doctor', 'receptionist') NOT NULL DEFAULT 'receptionist',
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME NULL,
    CONSTRAINT chk_email CHECK (email LIKE '%@%')
);

-- Patients table (personal data - PDPA sensitive)
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    ic_number VARCHAR(14) NOT NULL UNIQUE,   -- Malaysian IC: YYMMDD-SS-XXXX
    date_of_birth DATE NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    address TEXT NOT NULL,
    blood_type ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NULL,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(15),
    consent_given BOOLEAN NOT NULL DEFAULT FALSE,  -- PDPA consent
    consent_date DATETIME NULL,
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    specialization VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    available_days VARCHAR(50) NOT NULL DEFAULT 'Mon,Tue,Wed,Thu,Fri',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status ENUM('scheduled','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
    reason VARCHAR(255) NOT NULL,
    notes TEXT,
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Audit log table (security requirement)
CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    username VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance and security
CREATE INDEX idx_patients_ic ON patients(ic_number);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX idx_users_username ON users(username);
