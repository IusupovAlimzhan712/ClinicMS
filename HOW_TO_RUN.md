# HOW TO RUN — Clinic Management System
## CCS6344 Assignment 1 — Database & Cloud Security

---

## What You Need (Prerequisites)

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.10+ | https://python.org/downloads |
| pip | any | comes with Python |
| A web browser | any | Chrome/Firefox/Edge |

No MySQL needed — the app uses SQLite out of the box.

---

## 1. Open Terminal

**Mac:** Press `Cmd + Space`, type `Terminal`, hit Enter.  
**Windows:** Press `Win + R`, type `cmd`, hit Enter.

---

## 2. Navigate to the Project Folder

```bash
cd "/Users/iusupovalimzhan/Downloads/Database and Claude Security/clinic-management"
```

---

## 3. Install Dependencies

```bash
pip3 install -r requirements.txt
```

This installs Flask, Werkzeug (password hashing), and other required packages. Only needs to be done once.

---

## 4. Run the App

```bash
python3 app.py
```

You will see output like:

```
Database seeded successfully.
 * Serving Flask app 'app'
 * Running on http://127.0.0.1:5000
```

---

## 5. Open in Browser

Go to: **http://127.0.0.1:5000**

You will see the login page.

---

## 6. Login Credentials

| Username | Password | Role | Can Do |
|----------|----------|------|--------|
| `admin` | `Admin@123` | Admin | Everything — delete patients, view audit log |
| `dr_sarah` | `Doctor@123` | Doctor | View patients and appointments only |
| `receptionist1` | `Recept@123` | Receptionist | Add patients, schedule appointments |

---

## 7. Demo Walkthrough (for Screenshots)

### Add a Patient
1. Login as `admin` or `receptionist1`
2. Click **Patients** → **+ Add Patient**
3. Fill in:
   - Full Name: `Test Patient`
   - IC Number: `010101-10-1234`
   - Date of Birth: any date
   - Gender: Male
   - Phone: `+60123456789`
   - Address: `No 1, Jalan Test, KL`
   - Tick the **PDPA consent** checkbox
4. Click **Save Patient**

### Delete a Patient
1. Login as `admin`
2. Click **Patients**
3. Click **Delete** next to any patient
4. Confirm in the popup

### Schedule an Appointment
1. Login as `receptionist1`
2. Click **Appointments** → **+ Schedule Appointment**
3. Select a patient and doctor, pick a date/time and reason
4. Click **Schedule**

### View Audit Log (Admin only)
1. Login as `admin`
2. Click **Audit Log** in the navbar
3. See every login, insert, delete, and view event

### Test Account Lockout
1. Go to the login page
2. Enter username `admin` with wrong password **5 times**
3. Account locks for 15 minutes — you'll see the lockout message

### Test SQL Injection Prevention
1. In the login username field, type: `' OR 1=1 --`
2. Any password — click Sign In
3. You get "Invalid credentials" — the parameterised query blocks the attack

### Test Role-Based Access Control
1. Login as `receptionist1`
2. Manually go to: http://127.0.0.1:5000/audit
3. You get a **403 Forbidden** page — access denied

---

## 8. Stop the Server

Press `Ctrl + C` in the terminal.

---

## 9. Reset the Database (Fresh Start)

```bash
rm clinic.db
python3 app.py
```

This deletes the database file and recreates it with fresh seed data.

---

## 10. MySQL Setup (Production — Optional)

If you want to use MySQL instead of SQLite:

### Step 1: Create the database and user
```sql
-- Run as MySQL root
SOURCE database/schema.sql;
SOURCE database/security_setup.sql;
```

### Step 2: Update `.env`
```
USE_SQLITE=false
MYSQL_HOST=localhost
MYSQL_USER=clinic_app
MYSQL_PASSWORD=Cl1n1c@pp_Str0ng!
MYSQL_DB=clinic_db
```

### Step 3: Install PyMySQL
```bash
pip3 install pymysql
```

---

## Project File Structure

```
clinic-management/
├── app.py                  ← Main Flask application (all routes + security)
├── requirements.txt        ← Python dependencies
├── clinic.db               ← SQLite database (auto-created on first run)
├── .env.example            ← Environment variable template
├── database/
│   ├── schema.sql          ← MySQL schema (reference)
│   ├── security_setup.sql  ← MySQL least-privilege users
│   └── seed.sql            ← Sample data reference
├── templates/
│   ├── base.html           ← Navbar, flash messages, security headers
│   ├── dashboard.html      ← Stats + audit summary
│   ├── audit.html          ← Full audit log (admin only)
│   ├── error.html          ← 403 / 404 error pages
│   ├── auth/
│   │   └── login.html      ← Login form
│   ├── patients/
│   │   ├── list.html       ← Patient table with search
│   │   ├── add.html        ← Add patient form with PDPA consent
│   │   └── detail.html     ← Patient info + appointment history
│   └── appointments/
│       ├── list.html       ← All appointments
│       └── add.html        ← Schedule appointment form
└── static/
    └── style.css           ← All styling
```

---

## Security Features Summary (for the report)

| Feature | Where to See It |
|---------|----------------|
| Parameterised queries | `app.py` — every `db.execute()` call |
| Password hashing | Login with wrong password — never plaintext |
| Account lockout | 5 wrong logins on same account |
| RBAC / 403 Forbidden | Login as receptionist, visit /audit |
| Audit logging | Admin → Audit Log page |
| Input validation | Add Patient with bad IC format |
| SQL injection blocked | Login with `' OR 1=1 --` as username |
| Session timeout | Leave browser idle 30 min |
| Security headers | Browser DevTools → Network → Response Headers |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError: flask` | Run `pip3 install -r requirements.txt` |
| Port 5000 already in use | Kill old process: `lsof -ti:5000 \| xargs kill` |
| `clinic.db` permission error | `chmod 664 clinic.db` |
| Login not working | Delete `clinic.db` and re-run `python3 app.py` to reseed |
