-- ============================================================
-- Seed Data for Demo/Testing
-- Passwords are hashed versions of: Admin@123, Doctor@123, Recept@123
-- ============================================================
USE clinic_db;

-- Insert admin user (password: Admin@123)
INSERT INTO users (username, password_hash, role, full_name, email) VALUES
('admin', 'pbkdf2:sha256:600000$placeholder$hash_will_be_set_by_app', 'admin', 'System Administrator', 'admin@clinic.com'),
('dr_sarah', 'pbkdf2:sha256:600000$placeholder$hash_will_be_set_by_app', 'doctor', 'Dr. Sarah Ahmad', 'sarah.ahmad@clinic.com'),
('receptionist1', 'pbkdf2:sha256:600000$placeholder$hash_will_be_set_by_app', 'receptionist', 'Aishah Binti Razak', 'aishah@clinic.com');

-- Note: Run `python app.py --seed` to create users with proper hashed passwords
