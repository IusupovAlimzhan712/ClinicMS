"""
Clinic Management System
CCS6344 Database & Cloud Security - Assignment 1
"""

import os
import sys
import sqlite3
import json
from datetime import datetime, timedelta
from functools import wraps

from flask import (Flask, render_template, request, redirect, url_for,
                   flash, session, g, abort)
from werkzeug.security import generate_password_hash, check_password_hash

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-CHANGE-IN-PRODUCTION')
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)

DB_PATH = os.path.join(os.path.dirname(__file__), 'clinic.db')

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
        g.db.execute("PRAGMA journal_mode = WAL")
    return g.db


@app.teardown_appcontext
def close_db(exc=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()


def init_db():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")

    db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'receptionist'
                CHECK(role IN ('admin','doctor','receptionist')),
            full_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            is_active INTEGER NOT NULL DEFAULT 1,
            failed_attempts INTEGER NOT NULL DEFAULT 0,
            locked_until TEXT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            last_login TEXT NULL
        );

        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            ic_number TEXT NOT NULL UNIQUE,
            date_of_birth TEXT NOT NULL,
            gender TEXT NOT NULL CHECK(gender IN ('male','female','other')),
            phone TEXT NOT NULL,
            email TEXT,
            address TEXT NOT NULL,
            blood_type TEXT CHECK(blood_type IN
                ('A+','A-','B+','B-','AB+','AB-','O+','O-','')),
            emergency_contact_name TEXT,
            emergency_contact_phone TEXT,
            consent_given INTEGER NOT NULL DEFAULT 0,
            consent_date TEXT NULL,
            created_by INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (created_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS doctors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            specialization TEXT NOT NULL,
            license_number TEXT NOT NULL UNIQUE,
            available_days TEXT NOT NULL DEFAULT 'Mon,Tue,Wed,Thu,Fri',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            appointment_date TEXT NOT NULL,
            appointment_time TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'scheduled'
                CHECK(status IN ('scheduled','completed','cancelled','no_show')),
            reason TEXT NOT NULL,
            notes TEXT,
            created_by INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (doctor_id) REFERENCES doctors(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NULL,
            username TEXT,
            action TEXT NOT NULL,
            table_name TEXT NOT NULL,
            record_id INTEGER NULL,
            old_values TEXT NULL,
            new_values TEXT NULL,
            ip_address TEXT,
            user_agent TEXT,
            timestamp TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_patients_ic ON patients(ic_number);
        CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
        CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
        CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
    """)
    db.commit()
    db.close()


def seed_db():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    existing = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    if existing > 0:
        print("Database already seeded.")
        db.close()
        return

    users = [
        ('admin',        generate_password_hash('Admin@123'),    'admin',         'System Administrator', 'admin@clinic.com'),
        ('dr_sarah',     generate_password_hash('Doctor@123'),   'doctor',        'Dr. Sarah Ahmad',      'sarah@clinic.com'),
        ('receptionist1',generate_password_hash('Recept@123'),  'receptionist',  'Aishah Binti Razak',   'aishah@clinic.com'),
    ]
    db.executemany(
        "INSERT INTO users (username,password_hash,role,full_name,email) VALUES (?,?,?,?,?)",
        users
    )

    # Doctor profile for dr_sarah (id=2)
    db.execute(
        "INSERT INTO doctors (user_id,specialization,license_number) VALUES (?,?,?)",
        (2, 'General Practitioner', 'MMC/GP/2020/12345')
    )

    # Sample patients
    patients = [
        ('Ahmad Bin Ali', '900101-14-5678', '1990-01-01', 'male',   '+60123456789',
         'ahmad@email.com', 'No 1, Jalan Merdeka, KL', 'O+', 'Siti', '+60129876543', 1,
         datetime.now().isoformat(), 1),
        ('Siti Binti Rahman', '950505-10-1234', '1995-05-05', 'female', '+60187654321',
         'siti@email.com', 'No 2, Jalan Putra, KL', 'A+', 'Rahman', '+60111234567', 1,
         datetime.now().isoformat(), 1),
    ]
    db.executemany(
        """INSERT INTO patients
           (full_name,ic_number,date_of_birth,gender,phone,email,address,
            blood_type,emergency_contact_name,emergency_contact_phone,
            consent_given,consent_date,created_by)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        patients
    )

    # Sample appointments
    db.execute(
        """INSERT INTO appointments
           (patient_id,doctor_id,appointment_date,appointment_time,reason,created_by)
           VALUES (?,?,?,?,?,?)""",
        (1, 1, '2026-05-20', '09:00', 'General check-up', 1)
    )

    db.commit()
    db.close()
    print("Database seeded successfully.")


# ---------------------------------------------------------------------------
# Audit logging
# ---------------------------------------------------------------------------

def audit(action, table_name, record_id=None, old_values=None, new_values=None):
    try:
        db = get_db()
        db.execute(
            """INSERT INTO audit_log
               (user_id, username, action, table_name, record_id,
                old_values, new_values, ip_address, user_agent)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (
                session.get('user_id'),
                session.get('username'),
                action,
                table_name,
                record_id,
                json.dumps(old_values) if old_values else None,
                json.dumps(new_values) if new_values else None,
                request.remote_addr,
                request.user_agent.string[:255] if request.user_agent else None,
            )
        )
        db.commit()
    except Exception:
        pass  # Never let audit failure break the main flow


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated


def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if 'user_id' not in session:
                return redirect(url_for('login'))
            if session.get('role') not in roles:
                abort(403)
            return f(*args, **kwargs)
        return decorated
    return decorator


# ---------------------------------------------------------------------------
# Input validation
# ---------------------------------------------------------------------------

def validate_ic(ic):
    """Malaysian IC format: YYMMDD-SS-XXXX"""
    import re
    return bool(re.match(r'^\d{6}-\d{2}-\d{4}$', ic))


def validate_phone(phone):
    import re
    return bool(re.match(r'^\+?\d{10,15}$', phone))


def sanitize_str(s, max_len=255):
    if s is None:
        return ''
    return str(s).strip()[:max_len]


# ---------------------------------------------------------------------------
# Routes - Auth
# ---------------------------------------------------------------------------

MAX_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        username = sanitize_str(request.form.get('username', ''), 50)
        password = request.form.get('password', '')

        db = get_db()
        # Parameterized query — prevents SQL injection
        user = db.execute(
            "SELECT * FROM users WHERE username = ? AND is_active = 1",
            (username,)
        ).fetchone()

        if user:
            # Check account lockout
            if user['locked_until']:
                locked_until = datetime.fromisoformat(user['locked_until'])
                if datetime.now() < locked_until:
                    remaining = int((locked_until - datetime.now()).total_seconds() / 60) + 1
                    flash(f'Account locked. Try again in {remaining} minute(s).', 'danger')
                    audit('LOGIN_LOCKED', 'users', user['id'])
                    return render_template('auth/login.html')
                else:
                    # Reset lockout
                    db.execute(
                        "UPDATE users SET failed_attempts=0, locked_until=NULL WHERE id=?",
                        (user['id'],)
                    )
                    db.commit()

            if check_password_hash(user['password_hash'], password):
                # Successful login
                db.execute(
                    "UPDATE users SET last_login=?, failed_attempts=0, locked_until=NULL WHERE id=?",
                    (datetime.now().isoformat(), user['id'])
                )
                db.commit()
                session.permanent = True
                session['user_id'] = user['id']
                session['username'] = user['username']
                session['role'] = user['role']
                session['full_name'] = user['full_name']
                audit('LOGIN_SUCCESS', 'users', user['id'])
                flash(f'Welcome, {user["full_name"]}!', 'success')
                return redirect(url_for('dashboard'))
            else:
                # Failed attempt
                new_attempts = user['failed_attempts'] + 1
                locked_until = None
                if new_attempts >= MAX_ATTEMPTS:
                    locked_until = (datetime.now() + timedelta(minutes=LOCKOUT_MINUTES)).isoformat()
                    flash(f'Too many failed attempts. Account locked for {LOCKOUT_MINUTES} minutes.', 'danger')
                else:
                    flash(f'Invalid credentials. {MAX_ATTEMPTS - new_attempts} attempt(s) remaining.', 'danger')
                db.execute(
                    "UPDATE users SET failed_attempts=?, locked_until=? WHERE id=?",
                    (new_attempts, locked_until, user['id'])
                )
                db.commit()
                audit('LOGIN_FAILED', 'users', user['id'])
        else:
            flash('Invalid credentials.', 'danger')
            audit('LOGIN_FAILED_UNKNOWN', 'users', record_id=None, new_values={'username': username})

    return render_template('auth/login.html')


@app.route('/logout')
@login_required
def logout():
    audit('LOGOUT', 'users', session.get('user_id'))
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@app.route('/dashboard')
@login_required
def dashboard():
    db = get_db()
    stats = {
        'total_patients': db.execute("SELECT COUNT(*) FROM patients").fetchone()[0],
        'total_appointments': db.execute("SELECT COUNT(*) FROM appointments").fetchone()[0],
        'today_appointments': db.execute(
            "SELECT COUNT(*) FROM appointments WHERE appointment_date = ?",
            (datetime.now().strftime('%Y-%m-%d'),)
        ).fetchone()[0],
        'total_doctors': db.execute("SELECT COUNT(*) FROM doctors").fetchone()[0],
    }
    recent_audits = db.execute(
        "SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 10"
    ).fetchall()
    return render_template('dashboard.html', stats=stats, recent_audits=recent_audits)


# ---------------------------------------------------------------------------
# Patients
# ---------------------------------------------------------------------------

@app.route('/patients')
@login_required
def patients_list():
    db = get_db()
    search = sanitize_str(request.args.get('q', ''), 100)
    if search:
        # Parameterized query with LIKE — prevents SQL injection
        patients = db.execute(
            """SELECT * FROM patients
               WHERE full_name LIKE ? OR ic_number LIKE ?
               ORDER BY created_at DESC""",
            (f'%{search}%', f'%{search}%')
        ).fetchall()
    else:
        patients = db.execute(
            "SELECT * FROM patients ORDER BY created_at DESC"
        ).fetchall()
    return render_template('patients/list.html', patients=patients, search=search)


@app.route('/patients/add', methods=['GET', 'POST'])
@login_required
@role_required('admin', 'receptionist')
def patients_add():
    if request.method == 'POST':
        full_name = sanitize_str(request.form.get('full_name', ''), 100)
        ic_number = sanitize_str(request.form.get('ic_number', ''), 14)
        date_of_birth = sanitize_str(request.form.get('date_of_birth', ''), 10)
        gender = request.form.get('gender', 'other')
        phone = sanitize_str(request.form.get('phone', ''), 15)
        email = sanitize_str(request.form.get('email', ''), 100)
        address = sanitize_str(request.form.get('address', ''), 500)
        blood_type = request.form.get('blood_type', '')
        ec_name = sanitize_str(request.form.get('emergency_contact_name', ''), 100)
        ec_phone = sanitize_str(request.form.get('emergency_contact_phone', ''), 15)
        consent = 1 if request.form.get('consent_given') else 0

        # Validation
        errors = []
        if not full_name:
            errors.append('Full name is required.')
        if not validate_ic(ic_number):
            errors.append('IC number must be in format: YYMMDD-SS-XXXX')
        if not validate_phone(phone):
            errors.append('Invalid phone number.')
        if gender not in ('male', 'female', 'other'):
            errors.append('Invalid gender value.')
        if blood_type not in ('A+','A-','B+','B-','AB+','AB-','O+','O-',''):
            errors.append('Invalid blood type.')
        if not consent:
            errors.append('Patient consent is required under PDPA 2010.')

        if errors:
            for e in errors:
                flash(e, 'danger')
            return render_template('patients/add.html', form=request.form)

        # Check duplicate IC
        db = get_db()
        existing = db.execute(
            "SELECT id FROM patients WHERE ic_number = ?", (ic_number,)
        ).fetchone()
        if existing:
            flash('A patient with this IC number already exists.', 'danger')
            return render_template('patients/add.html', form=request.form)

        db.execute(
            """INSERT INTO patients
               (full_name,ic_number,date_of_birth,gender,phone,email,address,
                blood_type,emergency_contact_name,emergency_contact_phone,
                consent_given,consent_date,created_by)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (full_name, ic_number, date_of_birth, gender, phone, email, address,
             blood_type, ec_name, ec_phone, consent,
             datetime.now().isoformat() if consent else None,
             session['user_id'])
        )
        db.commit()
        new_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
        audit('INSERT', 'patients', new_id,
              new_values={'full_name': full_name, 'ic_number': ic_number})
        flash('Patient added successfully.', 'success')
        return redirect(url_for('patients_list'))

    return render_template('patients/add.html', form={})


@app.route('/patients/<int:patient_id>')
@login_required
def patients_detail(patient_id):
    db = get_db()
    patient = db.execute(
        "SELECT * FROM patients WHERE id = ?", (patient_id,)
    ).fetchone()
    if not patient:
        abort(404)
    appointments = db.execute(
        """SELECT a.*, u.full_name as doctor_name
           FROM appointments a
           JOIN doctors d ON a.doctor_id = d.id
           JOIN users u ON d.user_id = u.id
           WHERE a.patient_id = ?
           ORDER BY a.appointment_date DESC""",
        (patient_id,)
    ).fetchall()
    audit('VIEW', 'patients', patient_id)
    return render_template('patients/detail.html', patient=patient, appointments=appointments)


@app.route('/patients/<int:patient_id>/delete', methods=['POST'])
@login_required
@role_required('admin')
def patients_delete(patient_id):
    db = get_db()
    patient = db.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    if not patient:
        abort(404)
    old = dict(patient)
    db.execute("DELETE FROM patients WHERE id = ?", (patient_id,))
    db.commit()
    audit('DELETE', 'patients', patient_id, old_values=old)
    flash('Patient record deleted.', 'info')
    return redirect(url_for('patients_list'))


# ---------------------------------------------------------------------------
# Appointments
# ---------------------------------------------------------------------------

@app.route('/appointments')
@login_required
def appointments_list():
    db = get_db()
    appointments = db.execute(
        """SELECT a.*, p.full_name as patient_name, u.full_name as doctor_name
           FROM appointments a
           JOIN patients p ON a.patient_id = p.id
           JOIN doctors d ON a.doctor_id = d.id
           JOIN users u ON d.user_id = u.id
           ORDER BY a.appointment_date DESC, a.appointment_time DESC"""
    ).fetchall()
    return render_template('appointments/list.html', appointments=appointments)


@app.route('/appointments/add', methods=['GET', 'POST'])
@login_required
@role_required('admin', 'receptionist')
def appointments_add():
    db = get_db()
    patients = db.execute("SELECT id, full_name FROM patients ORDER BY full_name").fetchall()
    doctors = db.execute(
        "SELECT d.id, u.full_name, d.specialization FROM doctors d JOIN users u ON d.user_id=u.id"
    ).fetchall()

    if request.method == 'POST':
        patient_id = request.form.get('patient_id', type=int)
        doctor_id = request.form.get('doctor_id', type=int)
        appt_date = sanitize_str(request.form.get('appointment_date', ''), 10)
        appt_time = sanitize_str(request.form.get('appointment_time', ''), 5)
        reason = sanitize_str(request.form.get('reason', ''), 255)
        notes = sanitize_str(request.form.get('notes', ''), 500)

        if not all([patient_id, doctor_id, appt_date, appt_time, reason]):
            flash('All required fields must be filled.', 'danger')
            return render_template('appointments/add.html',
                                   patients=patients, doctors=doctors, form=request.form)

        db.execute(
            """INSERT INTO appointments
               (patient_id,doctor_id,appointment_date,appointment_time,reason,notes,created_by)
               VALUES (?,?,?,?,?,?,?)""",
            (patient_id, doctor_id, appt_date, appt_time, reason, notes, session['user_id'])
        )
        db.commit()
        new_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
        audit('INSERT', 'appointments', new_id,
              new_values={'patient_id': patient_id, 'doctor_id': doctor_id, 'date': appt_date})
        flash('Appointment scheduled successfully.', 'success')
        return redirect(url_for('appointments_list'))

    return render_template('appointments/add.html',
                           patients=patients, doctors=doctors, form={})


@app.route('/appointments/<int:appt_id>/cancel', methods=['POST'])
@login_required
@role_required('admin', 'receptionist')
def appointments_cancel(appt_id):
    db = get_db()
    appt = db.execute("SELECT * FROM appointments WHERE id = ?", (appt_id,)).fetchone()
    if not appt:
        abort(404)
    db.execute(
        "UPDATE appointments SET status='cancelled', updated_at=? WHERE id=?",
        (datetime.now().isoformat(), appt_id)
    )
    db.commit()
    audit('UPDATE', 'appointments', appt_id,
          old_values={'status': appt['status']}, new_values={'status': 'cancelled'})
    flash('Appointment cancelled.', 'info')
    return redirect(url_for('appointments_list'))


# ---------------------------------------------------------------------------
# Audit log (admin only)
# ---------------------------------------------------------------------------

@app.route('/audit')
@login_required
@role_required('admin')
def audit_view():
    db = get_db()
    logs = db.execute(
        "SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 200"
    ).fetchall()
    return render_template('audit.html', logs=logs)


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------

@app.errorhandler(403)
def forbidden(e):
    return render_template('error.html', code=403, message='Access Forbidden'), 403


@app.errorhandler(404)
def not_found(e):
    return render_template('error.html', code=404, message='Page Not Found'), 404


# ---------------------------------------------------------------------------
# CLI commands
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    if '--init' in sys.argv or not os.path.exists(DB_PATH):
        print("Initializing database...")
        init_db()
        print("Database initialized.")

    if '--seed' in sys.argv:
        seed_db()

    if '--init' in sys.argv or '--seed' in sys.argv:
        print("Setup complete. Run: python app.py")
        if '--seed' not in sys.argv and '--init' not in sys.argv:
            pass
        else:
            sys.exit(0)

    init_db()
    seed_db()
    app.run(debug=True, host='127.0.0.1', port=5001)
