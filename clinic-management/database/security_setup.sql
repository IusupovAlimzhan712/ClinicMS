-- ============================================================
-- Security Setup Script
-- Creates restricted database users with least-privilege
-- Run as MySQL root user
-- ============================================================

-- Drop existing users if they exist
DROP USER IF EXISTS 'clinic_app'@'localhost';
DROP USER IF EXISTS 'clinic_readonly'@'localhost';
DROP USER IF EXISTS 'clinic_audit'@'localhost';

-- Application user: limited to necessary operations only
CREATE USER 'clinic_app'@'localhost' IDENTIFIED BY 'Cl1n1c@pp_Str0ng!';
GRANT SELECT, INSERT, UPDATE ON clinic_db.users TO 'clinic_app'@'localhost';
GRANT SELECT, INSERT, UPDATE ON clinic_db.patients TO 'clinic_app'@'localhost';
GRANT SELECT, INSERT, UPDATE ON clinic_db.doctors TO 'clinic_app'@'localhost';
GRANT SELECT, INSERT, UPDATE ON clinic_db.appointments TO 'clinic_app'@'localhost';
GRANT SELECT, INSERT ON clinic_db.audit_log TO 'clinic_app'@'localhost';
-- No DELETE or DROP granted to application user

-- Read-only user for reporting
CREATE USER 'clinic_readonly'@'localhost' IDENTIFIED BY 'R3ad0nly_Str0ng!';
GRANT SELECT ON clinic_db.* TO 'clinic_readonly'@'localhost';

-- Audit user: can only insert into audit_log (for external SIEM)
CREATE USER 'clinic_audit'@'localhost' IDENTIFIED BY 'Aud1t_Str0ng_P@ss!';
GRANT SELECT, INSERT ON clinic_db.audit_log TO 'clinic_audit'@'localhost';

FLUSH PRIVILEGES;

-- Enable general query log for auditing (run as root)
-- SET GLOBAL general_log = 'ON';
-- SET GLOBAL general_log_file = '/var/log/mysql/general.log';

-- Enable slow query log
-- SET GLOBAL slow_query_log = 'ON';
-- SET GLOBAL long_query_time = 2;

SELECT 'Security setup complete. Users created with least-privilege access.' AS status;
