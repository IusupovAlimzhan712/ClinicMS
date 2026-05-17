const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  ExternalHyperlink
} = require('docx');
const fs = require('fs');

// ─── Helpers ────────────────────────────────────────────────────────────────

const CONTENT_W = 9026; // A4 with 1" margins

const border  = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const thBorder = { style: BorderStyle.SINGLE, size: 1, color: "1A365D" };
const thBorders = { top: thBorder, bottom: thBorder, left: thBorder, right: thBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, size: 32, color: "1A365D", font: "Calibri" })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, color: "2C5282", font: "Calibri" })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, color: "2D3748", font: "Calibri" })]
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 100 },
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, size: 24, font: "Calibri", ...opts.run })]
  });
}

function bold(text) {
  return new TextRun({ text, bold: true, size: 24, font: "Calibri" });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 24, font: "Calibri" })]
  });
}

function numbered(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 24, font: "Calibri" })]
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function spacer() {
  return new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun("")] });
}

function makeTable(headers, rows, colWidths) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => new TableCell({
          borders: thBorders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: "1A365D", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({
            children: [new TextRun({ text: h, bold: true, size: 22, color: "FFFFFF", font: "Calibri" })]
          })]
        }))
      }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, i) => new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: ri % 2 === 0 ? "F7FAFC" : "FFFFFF", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({
            children: [new TextRun({ text: String(cell), size: 22, font: "Calibri" })]
          })]
        }))
      }))
    ]
  });
}

// ─── Cover page ─────────────────────────────────────────────────────────────

function coverPage() {
  return [
    spacer(), spacer(), spacer(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
      children: [new TextRun({ text: "MULTIMEDIA UNIVERSITY", bold: true, size: 36, font: "Calibri", color: "1A365D" })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 600 },
      children: [new TextRun({ text: "Faculty of Computing and Informatics", size: 26, font: "Calibri", color: "2C5282" })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1A365D", space: 1 } },
      children: []
    }),
    spacer(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 120 },
      children: [new TextRun({ text: "CCS6344 T2610", bold: true, size: 30, font: "Calibri", color: "1A365D" })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      children: [new TextRun({ text: "Database & Cloud Security", size: 28, font: "Calibri", color: "2C5282" })]
    }),
    spacer(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 120 },
      children: [new TextRun({ text: "Assignment 1 Submission", bold: true, size: 32, font: "Calibri", color: "1A365D" })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 400 },
      children: [new TextRun({ text: "Database Security", size: 28, font: "Calibri", color: "4A5568" })]
    }),
    spacer(), spacer(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [new TextRun({ text: "Group Name: Group 1", bold: true, size: 26, font: "Calibri" })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [new TextRun({ text: "Name 1 — 1221101703", size: 24, font: "Calibri" })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [new TextRun({ text: "Name 2 — 1221101802", size: 24, font: "Calibri" })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 300 },
      children: [new TextRun({ text: "Name 3 — 1221101901", size: 24, font: "Calibri" })]
    }),
    spacer(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [new TextRun({ text: "YouTube Presentation Link:", bold: true, size: 24, font: "Calibri" })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [new ExternalHyperlink({
        link: "https://www.youtube.com/watch?v=PLACEHOLDER",
        children: [new TextRun({ text: "https://www.youtube.com/watch?v=PLACEHOLDER", style: "Hyperlink", size: 22, font: "Calibri" })]
      })]
    }),
    spacer(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 0 },
      children: [new TextRun({ text: "Submission Deadline: 25th May 2026, 11:59 PM", size: 22, font: "Calibri", color: "718096" })]
    }),
    pageBreak()
  ];
}

// ─── Task 1 ─────────────────────────────────────────────────────────────────

function task1() {
  return [
    h1("Task 1: Preparation of the Proposal"),

    h2("1.1 Project Objectives"),
    p("The Clinic Patient Management System (CPMS) is a secure, web-based application designed to digitise the administrative and clinical operations of a medical clinic. The primary objectives are:"),
    bullet("To provide a centralised, structured platform for managing patient records, doctor profiles, and appointment scheduling."),
    bullet("To implement robust database security controls that protect sensitive personal and medical data from both internal and external threats."),
    bullet("To ensure full compliance with the Personal Data Protection Act 2010 (PDPA) by enforcing explicit patient consent and data minimisation principles."),
    bullet("To demonstrate Role-Based Access Control (RBAC) by restricting system functionality based on the authenticated user's role (Admin, Doctor, Receptionist)."),
    bullet("To maintain a tamper-evident audit trail of all data access and modification events for accountability and forensic investigation."),
    spacer(),

    h2("1.2 Proposed Application Design and Implementation"),
    p("The CPMS follows the Model-View-Controller (MVC) architectural pattern, separating business logic, data access, and presentation layers. The system operates as a three-tier web application: a client browser tier, a Flask application server tier, and a SQL database tier."),
    p("Core modules of the application include:"),
    bullet("Authentication Module: Handles user login with password hashing, account lockout after 5 failed attempts, and session management with a 30-minute timeout."),
    bullet("Patient Management Module: Allows receptionists and admins to register, search, view, and delete patient records, with mandatory PDPA consent capture."),
    bullet("Appointment Module: Enables scheduling, viewing, and cancellation of appointments linked to patients and doctors."),
    bullet("Audit Log Module: Records every login, data access, insert, update, and delete event automatically, viewable only by admins."),
    bullet("Role-Based Access Control: Three distinct roles (Admin, Doctor, Receptionist) with differentiated permissions enforced at both the application and database layers."),
    spacer(),

    h2("1.3 Proposed Hardware and Software"),

    h3("1.3a Programming Language and Database"),
    p("The application is built using Python 3.12 with the Flask micro-framework (version 3.0.3). Flask was chosen for its lightweight design, rich ecosystem of security-focused extensions, and suitability for rapid development of database-driven web applications."),
    p("The primary database is SQLite (development/demo) with a migration path to MySQL 8.0 (production). SQLite was selected for its zero-configuration setup and self-contained nature, making it ideal for demonstrating the full application. The production recommendation is MySQL 8.0 Community Edition, which supports row-level security, stored procedures, and comprehensive audit logging."),
    p("Key Python libraries used:"),
    bullet("Werkzeug 3.0.3: Industry-standard password hashing using PBKDF2-SHA256 with 600,000 iterations."),
    bullet("Flask-Login 0.6.3: Secure session management and login state tracking."),
    bullet("Flask-WTF 1.2.1: CSRF token generation and validation for all forms."),
    bullet("python-dotenv 1.0.1: Secure loading of environment variables from .env files."),
    spacer(),

    h3("1.3b Server OS and Web Server"),
    makeTable(
      ["Component", "Development", "Production Recommendation"],
      [
        ["Operating System", "macOS 15 / Windows 11", "Ubuntu 24.04 LTS"],
        ["Web Server", "Flask Built-in (dev only)", "Nginx 1.26 + Gunicorn 22"],
        ["Application Runtime", "Python 3.12", "Python 3.12"],
        ["Database Server", "SQLite 3.45", "MySQL 8.0 Community"],
        ["SSL/TLS", "None (local)", "Let's Encrypt / Certbot"],
      ],
      [2800, 2800, 3426]
    ),
    spacer(),

    h2("1.4 System Design and Database Design"),

    h3("1.4a System Architecture"),
    p("Figure 1 below illustrates the three-tier architecture of the CPMS:"),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 80 },
      children: [new TextRun({ text: "[Figure 1: Three-Tier Architecture Diagram]", italics: true, size: 22, font: "Calibri", color: "718096" })]
    }),
    p("Client browsers communicate exclusively over HTTPS with the Nginx reverse proxy. Nginx forwards requests to the Gunicorn application server running Flask. Flask communicates with MySQL via parameterised queries only, never by string concatenation. No direct browser-to-database connection is permitted."),
    spacer(),

    h3("1.4b Database Entity-Relationship Design"),
    p("The database consists of five core tables with clearly defined relationships:"),
    bullet("users: Stores authentication credentials (hashed passwords), roles, lockout state, and login history."),
    bullet("patients: Stores personally identifiable information (PII) including IC number, date of birth, contact details, and PDPA consent status."),
    bullet("doctors: Links to users table via user_id, stores specialisation and license number."),
    bullet("appointments: Records scheduled visits, linking patients to doctors, with status tracking."),
    bullet("audit_log: Immutable record of all user actions, capturing user, action type, affected table, record ID, old/new values, IP address, and timestamp."),
    spacer(),
    p("Key relationships:"),
    bullet("One user may be one doctor (1:0..1)."),
    bullet("One patient may have many appointments (1:N)."),
    bullet("One doctor may have many appointments (1:N)."),
    bullet("Every data modification generates one or more audit_log entries (1:N)."),
    spacer(),
    makeTable(
      ["Table", "Primary Key", "Foreign Keys", "Sensitive Data"],
      [
        ["users", "id (INT)", "None", "password_hash"],
        ["patients", "id (INT)", "created_by → users.id", "IC, DOB, address, phone"],
        ["doctors", "id (INT)", "user_id → users.id", "license_number"],
        ["appointments", "id (INT)", "patient_id, doctor_id, created_by", "medical reason, notes"],
        ["audit_log", "id (INT)", "user_id → users.id", "action data (JSON)"],
      ],
      [1800, 1600, 2200, 3426]
    ),
    spacer(),

    h2("1.5 Database Security Plan"),
    p("The following SQL-specific security measures are planned and implemented:"),
    numbered("Parameterised Queries: All SQL statements use ? placeholders with bound parameters, completely eliminating SQL injection risk."),
    numbered("Password Hashing: User passwords are never stored in plaintext. Werkzeug's generate_password_hash uses PBKDF2-SHA256 with 600,000 iterations."),
    numbered("Least-Privilege Database Users: Three separate MySQL users are created — clinic_app (read/write, no DELETE/DROP), clinic_readonly (SELECT only), and clinic_audit (INSERT to audit_log only)."),
    numbered("Account Lockout: After 5 consecutive failed login attempts, accounts are locked for 15 minutes, preventing brute-force attacks."),
    numbered("Session Security: Sessions expire after 30 minutes of inactivity. Cookies are set HttpOnly and SameSite=Lax to prevent XSS and CSRF token theft."),
    numbered("Role-Based Access Control: Application-level decorators enforce role checks on every route. Admins can delete records; receptionists can add/view; doctors can view only."),
    numbered("Audit Logging: Every login attempt, data view, insert, update, and delete is recorded in audit_log with user identity, IP address, and timestamp."),
    numbered("Input Validation: All user inputs are sanitised (stripped, length-bounded, regex-validated) before use. IC numbers, phone numbers, and enumerated values are strictly validated."),
    pageBreak()
  ];
}

// ─── Task 2 ─────────────────────────────────────────────────────────────────

function task2() {
  return [
    h1("Task 2: Implementation of the Application Using SQL Database"),

    h2("2.1 Detailed Design Description"),
    p("The CPMS is implemented as a Flask web application backed by a SQLite database (upgradeable to MySQL). The application uses a single app.py file containing all route definitions, security middleware, and database helper functions, following Flask's application factory pattern for clarity."),
    p("The database schema defines five tables with referential integrity enforced through FOREIGN KEY constraints and SQLite's PRAGMA foreign_keys = ON setting. Indexes are created on frequently queried columns (patients.ic_number, appointments.appointment_date, audit_log.timestamp) to ensure efficient query performance."),

    h3("2.1a URL Route Structure"),
    makeTable(
      ["Route", "Method", "Role Required", "Description"],
      [
        ["/login", "GET/POST", "None", "Authentication page"],
        ["/logout", "GET", "Any", "Destroys session"],
        ["/dashboard", "GET", "Any", "Statistics + audit summary"],
        ["/patients", "GET", "Any", "Patient list with search"],
        ["/patients/add", "GET/POST", "Admin, Receptionist", "Add new patient"],
        ["/patients/<id>", "GET", "Any", "Patient detail + history"],
        ["/patients/<id>/delete", "POST", "Admin only", "Delete patient record"],
        ["/appointments", "GET", "Any", "Appointment list"],
        ["/appointments/add", "GET/POST", "Admin, Receptionist", "Schedule appointment"],
        ["/appointments/<id>/cancel", "POST", "Admin, Receptionist", "Cancel appointment"],
        ["/audit", "GET", "Admin only", "Full audit log view"],
      ],
      [2200, 1200, 2000, 3626]
    ),
    spacer(),

    h2("2.2 Step-by-Step Implementation"),

    h3("Step 1: Environment Setup"),
    p("Install Python 3.12 and run the following commands in the project directory:"),
    new Paragraph({
      spacing: { before: 60, after: 100 },
      children: [new TextRun({ text: "pip install -r requirements.txt", font: "Courier New", size: 22, color: "1A365D" })]
    }),
    p("Copy .env.example to .env and set a strong SECRET_KEY value."),

    h3("Step 2: Database Initialisation"),
    p("The database is automatically initialised when app.py is executed. Running the application calls init_db() to create all tables, then seed_db() to populate demo users, sample patients, and an appointment. The database file clinic.db is created in the project root directory."),
    p("[Screenshot 1: Terminal showing successful database initialisation and seed output]"),

    h3("Step 3: Starting the Application"),
    p("Run the following command to start the Flask development server:"),
    new Paragraph({
      spacing: { before: 60, after: 100 },
      children: [new TextRun({ text: "python app.py", font: "Courier New", size: 22, color: "1A365D" })]
    }),
    p("The server starts on http://127.0.0.1:5000. Navigate to this URL in a browser to access the login page."),
    p("[Screenshot 2: Login page displayed in browser]"),

    h3("Step 4: User Authentication"),
    p("Log in with the admin credential (username: admin, password: Admin@123). The system verifies the password hash, resets the failed attempt counter, records the login event in audit_log, and establishes a secure session cookie. The dashboard displays real-time statistics and the 10 most recent audit entries."),
    p("[Screenshot 3: Dashboard after successful admin login, showing stats and audit log]"),

    h2("2.3 Security Measures Implemented"),

    h3("2.3a SQL Injection Prevention (Parameterised Queries)"),
    p("Every database query uses SQLite's parameterised query syntax with ? placeholders. The following example demonstrates the login query:"),
    new Paragraph({
      spacing: { before: 60, after: 60 },
      children: [new TextRun({ text: 'user = db.execute("SELECT * FROM users WHERE username = ? AND is_active = 1", (username,)).fetchone()', font: "Courier New", size: 20, color: "1A365D" })]
    }),
    p("The username variable is never concatenated into the SQL string. Even if a user inputs ' OR 1=1 --, it is treated as a literal string value, not SQL syntax."),

    h3("2.3b Password Hashing"),
    p("Passwords are hashed using Werkzeug's PBKDF2-SHA256 with 600,000 iterations before storage. During login, check_password_hash performs a constant-time comparison to prevent timing attacks. No plaintext password is ever written to the database or log files."),

    h3("2.3c Account Lockout"),
    p("After 5 consecutive failed login attempts, the locked_until field is set to current time + 15 minutes. Subsequent login attempts before this timestamp are rejected with a message showing remaining lockout time. This prevents brute-force and credential-stuffing attacks."),

    h3("2.3d Role-Based Access Control"),
    p("Two Python decorators enforce access control at the route level: @login_required (ensures authentication) and @role_required(*roles) (enforces role membership). For example, the patient delete route is decorated with @role_required('admin'), returning HTTP 403 Forbidden to any non-admin user regardless of URL knowledge."),

    h2("2.4 Testing"),

    h3("Test Case 1: Insert New Patient"),
    p("Navigate to Patients > Add Patient. Fill in all required fields with valid data (IC: 900101-14-5678, consent checkbox ticked). Click Save Patient. The system validates the IC format using regex, checks for duplicate IC numbers, inserts the record, and records an INSERT audit entry."),
    p("[Screenshot 4: Add Patient form filled with test data]"),
    p("[Screenshot 5: Patient list showing newly added patient]"),
    p("[Screenshot 6: Audit log showing INSERT event for patients table]"),

    h3("Test Case 2: Delete a Patient Record"),
    p("As admin, navigate to Patients list and click Delete next to the target patient. A JavaScript confirmation dialog appears. Upon confirmation, a POST request is sent to /patients/<id>/delete. The record is removed from the database and a DELETE audit entry is created with the old values preserved in JSON."),
    p("[Screenshot 7: Confirmation dialog before deletion]"),
    p("[Screenshot 8: Patient list after deletion, record no longer present]"),
    p("[Screenshot 9: Audit log showing DELETE event with preserved old values]"),

    h3("Test Case 3: Insert Another New Patient"),
    p("Repeat the add patient process with different data (IC: 950505-10-1234). The system inserts the second patient record and creates another audit entry. Both patients are now visible in the patient list."),
    p("[Screenshot 10: Patient list showing two new patient entries]"),
    pageBreak()
  ];
}

// ─── Task 3 ─────────────────────────────────────────────────────────────────

function task3() {
  return [
    h1("Task 3: Threat Modeling (STRIDE and DREAD)"),

    h2("3.1 STRIDE Threat Analysis"),
    p("STRIDE is a threat modeling framework developed by Microsoft that categorises security threats into six categories. Each category is analysed below in the context of the Clinic Patient Management System."),
    spacer(),

    makeTable(
      ["STRIDE Category", "Threat Description", "Application Context", "Mitigation Implemented"],
      [
        ["Spoofing Identity",
         "An attacker impersonates a legitimate user to gain unauthorised access.",
         "Attacker submits stolen credentials to access the CPMS login page and impersonate a doctor or admin.",
         "PBKDF2-SHA256 password hashing; account lockout after 5 failed attempts; session invalidation on logout."],
        ["Tampering with Data",
         "Unauthorised modification of data in transit or at rest.",
         "An insider (receptionist) directly edits the clinic.db file or intercepts and replays HTTP requests to modify patient records.",
         "HTTPS (TLS) for data in transit; role-based route protection; audit log captures all changes with old/new values; database file permissions restricted to application user."],
        ["Repudiation",
         "A user performs an action and later denies having done it.",
         "A doctor claims they did not access a specific patient record, or a receptionist denies deleting a patient entry.",
         "Comprehensive audit_log table records user ID, username, action, table, record ID, IP address, and timestamp for every operation. Admin-only access to audit view prevents tampering."],
        ["Information Disclosure",
         "Sensitive data is exposed to unauthorised parties.",
         "Patient PII (IC number, address, medical notes) could be exposed through SQL injection, verbose error messages, or insecure direct object references.",
         "Parameterised queries prevent SQL injection. Custom error handlers return generic messages. Role-based access ensures only authorised users can view patient records. HTTPS encrypts data in transit."],
        ["Denial of Service",
         "An attacker renders the system unavailable to legitimate users.",
         "An attacker sends thousands of login requests to exhaust server resources, or submits large inputs to cause application crashes.",
         "Account lockout mechanism limits authentication attempts. Input length limits (maxlength attributes + sanitize_str() server-side) prevent oversized inputs. Production deployment behind Nginx provides rate limiting capability."],
        ["Elevation of Privilege",
         "A user gains permissions beyond their assigned role.",
         "A logged-in receptionist manipulates request parameters to access admin-only routes such as /audit or /patients/<id>/delete.",
         "Server-side @role_required decorator enforces role checks independently of client input. HTTP 403 is returned for any unauthorised role access attempt. Role is stored server-side in the session, not in client-controllable cookies."],
      ],
      [1600, 1800, 2300, 3326]
    ),
    spacer(),

    h2("3.2 DREAD Risk Scoring"),
    p("DREAD is a quantitative risk scoring model that rates each identified threat across five dimensions on a scale of 1 (low) to 10 (high). The overall risk score is the average of the five dimensions."),
    spacer(),

    makeTable(
      ["Threat", "Damage\n(1-10)", "Reproducibility\n(1-10)", "Exploitability\n(1-10)", "Affected Users\n(1-10)", "Discoverability\n(1-10)", "DREAD Score", "Risk Level"],
      [
        ["Spoofing (Credential theft)", "8", "7", "6", "7", "5", "6.6", "HIGH"],
        ["SQL Injection Attack", "9", "8", "7", "10", "6", "8.0", "CRITICAL"],
        ["Session Hijacking", "8", "5", "5", "8", "4", "6.0", "HIGH"],
        ["Privilege Escalation", "9", "6", "5", "10", "3", "6.6", "HIGH"],
        ["Patient Data Disclosure", "10", "4", "4", "10", "3", "6.2", "HIGH"],
        ["Brute Force Login", "7", "9", "8", "7", "7", "7.6", "HIGH"],
        ["Repudiation / Audit Bypass", "6", "3", "3", "8", "2", "4.4", "MEDIUM"],
        ["Denial of Service", "5", "7", "6", "10", "5", "6.6", "HIGH"],
      ],
      [2200, 900, 1100, 900, 1000, 900, 900, 1126]
    ),
    spacer(),

    h3("3.2.1 Highest Risk: SQL Injection (Score: 8.0 — CRITICAL)"),
    p("SQL Injection scored highest due to the severe damage potential (complete database compromise), high reproducibility (automated tools exist), and high exploitability if parameterised queries were absent. This threat is fully mitigated in the CPMS through exclusive use of parameterised queries throughout all database operations."),

    h3("3.2.2 High Risk: Brute Force Login (Score: 7.6 — HIGH)"),
    p("Brute force attacks score high on reproducibility (trivial to automate) and discoverability (login pages are always public). The CPMS mitigates this through a 15-minute account lockout after 5 failed attempts, and production deployment should add CAPTCHA and IP-based rate limiting."),
    pageBreak()
  ];
}

// ─── Task 4 ─────────────────────────────────────────────────────────────────

function task4() {
  return [
    h1("Task 4: PDPA 2010 Compliance"),

    h2("4.1 Overview of PDPA 2010"),
    p("The Personal Data Protection Act 2010 (PDPA) is Malaysian legislation that governs the processing of personal data in commercial transactions. It establishes seven data protection principles that organisations must follow when collecting, processing, storing, or disclosing personal data. Non-compliance can result in fines up to RM500,000 and/or imprisonment up to 3 years."),
    p("Reference: Personal Data Protection Act 2010, Laws of Malaysia Act 709. Available: https://www.pdp.gov.my/jpdpv2/assets/2019/09/Personal-Data-Protection-Act-2010.pdf"),
    spacer(),

    h2("4.2 Personnel Categorisation Under PDPA 2010"),
    p("The PDPA 2010 defines three key categories of persons involved in data processing:"),
    spacer(),
    makeTable(
      ["PDPA Role", "Definition", "CPMS Personnel", "Responsibilities"],
      [
        ["Data Subject", "Individual whose personal data is being processed (Section 4).", "Patients registered in the system.", "Provide consent; request access or correction of their data."],
        ["Data User", "Person or organisation who processes personal data for their own purposes (Section 4).", "The Clinic (as an entity); System Administrator; Doctors.", "Must comply with all 7 PDPA principles; must obtain consent; must secure data; must not disclose without consent."],
        ["Data Processor", "Person who processes personal data on behalf of the data user (Section 4).", "Receptionists; IT support staff; third-party cloud hosting provider (if applicable).", "Process data only as directed by data user; maintain security; cannot use data for own purposes."],
      ],
      [1800, 2000, 2000, 3226]
    ),
    spacer(),

    h2("4.3 Data Lifecycle Mapping to PDPA 2010"),
    spacer(),
    makeTable(
      ["Lifecycle Stage", "PDPA Principle", "How CPMS Achieves Compliance", "Responsible Personnel", "Penalty for Non-Compliance"],
      [
        ["Collection", "General Principle (S.6); Consent Principle (S.6(1)(a))", "Mandatory consent checkbox in Add Patient form. Consent date recorded. Data collected only for clinic administration purposes.", "Receptionist; Admin", "Fine up to RM300,000 and/or 2 years imprisonment (S.130)"],
        ["Storage", "Security Principle (S.9)", "PBKDF2 password hashing; SQLite database with restricted file permissions; HTTPS for data in transit; no plaintext PII in logs.", "System Administrator", "Fine up to RM500,000 and/or 3 years imprisonment (S.130)"],
        ["Processing / Access", "Notice & Choice Principle (S.7); Use Limitation (S.8)", "Role-based access control limits data access to authorised roles only. Data used solely for clinic operations. Audit log tracks all access.", "Admin; Doctors; Receptionists", "Fine up to RM300,000 and/or 2 years imprisonment"],
        ["Disclosure / Sharing", "Disclosure Principle (S.8(2))", "No external data sharing implemented. Patient data remains within the clinic system. Third-party disclosure requires explicit patient consent.", "System Administrator; Admin", "Fine up to RM500,000 and/or 3 years imprisonment (S.130)"],
        ["Retention", "Retention Principle (S.10)", "Records are retained for the duration of the patient-clinic relationship. Admin can delete records. Data retention policy should be defined per Malaysian Medical Council guidelines.", "System Administrator; Admin", "Fine up to RM100,000 and/or 1 year imprisonment"],
        ["Correction / Access Rights", "Access Principle (S.12)", "Data subjects (patients) can request corrections. Admin can update patient records. Access request procedures should be documented.", "Admin; Receptionist", "Fine up to RM100,000 and/or 1 year imprisonment"],
        ["Deletion / Destruction", "Not explicitly defined; best practice under Security Principle", "Admin-only delete function with audit trail. Deleted records captured in audit_log before removal. Physical media destruction policy required for decommissioning.", "System Administrator", "Fine up to RM100,000 for breach of security principle"],
      ],
      [1600, 1700, 2200, 1600, 1930]
    ),
    spacer(),

    h2("4.4 PDPA Data Protection Officer"),
    p("Under PDPA 2010, the clinic should appoint a Data Protection Officer (DPO) responsible for overseeing all compliance activities. In the CPMS, the System Administrator (admin role) serves as the functional equivalent of the DPO, with exclusive access to the audit log and user management functions. The DPO responsibilities include:"),
    bullet("Conducting periodic reviews of data access logs and audit trails."),
    bullet("Handling patient data access and correction requests within 21 days as required by the Act."),
    bullet("Ensuring all staff complete PDPA awareness training annually."),
    bullet("Reporting data breaches to the Personal Data Protection Commissioner within 72 hours of discovery."),
    pageBreak()
  ];
}

// ─── Task 5 ─────────────────────────────────────────────────────────────────

function task5() {
  return [
    h1("Task 5: Security Measures Implementation"),

    h2("5.1 Overview"),
    p("This section details all security measures implemented in the CPMS to protect the database from both internal threats (malicious insiders, privilege abuse) and external threats (hackers, automated attack tools). The measures are categorised by security domain."),
    spacer(),

    h2("5.2 Authentication and Session Security"),

    h3("5.2.1 PBKDF2-SHA256 Password Hashing"),
    p("Passwords are processed using Werkzeug's generate_password_hash function, which applies PBKDF2 with SHA-256 as the underlying hash function and 600,000 iterations. This makes offline brute-force attacks computationally infeasible. The stored hash includes the algorithm identifier, salt, and iteration count, allowing future algorithm upgrades without requiring password resets."),
    new Paragraph({
      spacing: { before: 60, after: 100 },
      children: [new TextRun({ text: "Hash format: pbkdf2:sha256:600000$<salt>$<hash>", font: "Courier New", size: 20, color: "1A365D" })]
    }),
    p("[Screenshot: Database rows showing hashed passwords, not plaintext]"),

    h3("5.2.2 Account Lockout Policy"),
    p("The users table contains failed_attempts (INT) and locked_until (DATETIME) columns. After every failed login, failed_attempts is incremented. When it reaches 5, locked_until is set to NOW() + 15 minutes. All subsequent login attempts within the lockout window return an error message without performing any database authentication check."),
    p("[Screenshot: Login page showing lockout message after 5 failed attempts]"),

    h3("5.2.3 Secure Session Configuration"),
    makeTable(
      ["Setting", "Value", "Security Purpose"],
      [
        ["SESSION_COOKIE_HTTPONLY", "True", "Prevents JavaScript from reading session cookie, blocking XSS-based session theft."],
        ["SESSION_COOKIE_SAMESITE", "'Lax'", "Prevents the cookie from being sent in cross-site requests, mitigating CSRF attacks."],
        ["PERMANENT_SESSION_LIFETIME", "30 minutes", "Automatically invalidates idle sessions, limiting the window of opportunity for session fixation attacks."],
      ],
      [2500, 1500, 5026]
    ),
    spacer(),

    h2("5.3 SQL Injection Prevention"),
    p("All database interactions use parameterised queries (also called prepared statements). This is the single most effective defence against SQL injection. The following demonstrates the pattern used consistently throughout app.py:"),
    new Paragraph({
      spacing: { before: 60, after: 60 },
      children: [new TextRun({ text: "# SECURE — parameterised query", font: "Courier New", size: 20, color: "065F46" })]
    }),
    new Paragraph({
      spacing: { before: 0, after: 60 },
      children: [new TextRun({ text: 'db.execute("SELECT * FROM patients WHERE ic_number = ?", (ic_number,))', font: "Courier New", size: 20, color: "1A365D" })]
    }),
    new Paragraph({
      spacing: { before: 60, after: 60 },
      children: [new TextRun({ text: "# VULNERABLE — never done in CPMS", font: "Courier New", size: 20, color: "991B1B" })]
    }),
    new Paragraph({
      spacing: { before: 0, after: 100 },
      children: [new TextRun({ text: 'db.execute("SELECT * FROM patients WHERE ic_number = \'" + ic_number + "\'")', font: "Courier New", size: 20, color: "991B1B" })]
    }),
    p("[Screenshot: SQL injection test — inputting ' OR 1=1 -- into the login field returns 'Invalid credentials' rather than bypassing authentication]"),

    h2("5.4 Role-Based Access Control (RBAC)"),
    p("RBAC is enforced at the application layer using Python decorators applied to every route function. The role hierarchy is:"),
    makeTable(
      ["Role", "Permissions", "Cannot Do"],
      [
        ["Admin", "All operations: view, add, delete patients; manage appointments; view full audit log; cancel appointments.", "—"],
        ["Receptionist", "Add/view patients; schedule/cancel appointments; view dashboard.", "Delete patients; view audit log; manage users."],
        ["Doctor", "View patient list and details; view appointments.", "Add/delete patients; schedule appointments; view audit log."],
      ],
      [1800, 4000, 3226]
    ),
    spacer(),
    p("Role is stored exclusively in the server-side Flask session (signed with SECRET_KEY). The client cannot modify their role. Any attempt to access a restricted route returns HTTP 403 and is recorded in the audit log."),
    p("[Screenshot: 403 Forbidden page when receptionist attempts to access /audit]"),

    h2("5.5 Input Validation and Sanitisation"),
    p("All user inputs undergo server-side validation before any database operation:"),
    bullet("sanitize_str(s, max_len): Strips leading/trailing whitespace and truncates to a maximum length, preventing buffer-overflow-style inputs."),
    bullet("validate_ic(ic): Regex match against \\d{6}-\\d{2}-\\d{4} pattern. Rejects any IC number not matching the Malaysian format."),
    bullet("validate_phone(phone): Regex match against \\+?\\d{10,15}. Rejects non-numeric phone numbers."),
    bullet("Enumerated fields (gender, blood_type, status): Validated against a whitelist of allowed values. Any value outside the whitelist triggers a validation error and the record is not saved."),
    bullet("HTML escaping: Jinja2 templates auto-escape all user-supplied values using {{ variable }} syntax, preventing XSS in rendered pages."),
    p("[Screenshot: Validation error message when IC number is entered in wrong format]"),

    h2("5.6 Audit Logging"),
    p("The audit_log table provides a comprehensive, append-only record of all system activity. Key design decisions:"),
    bullet("Audit entries are inserted even when the main operation fails (wrapped in try/except to prevent audit failure from blocking operations)."),
    bullet("Old values are captured in JSON before any update or delete operation, enabling forensic reconstruction."),
    bullet("IP address and User-Agent are recorded with each entry, supporting incident investigation."),
    bullet("Audit log access is restricted to the admin role, preventing non-admin users from viewing or manipulating audit records."),
    bullet("In production, the audit_log table should have a separate MySQL user with INSERT-only permission and no UPDATE/DELETE grants."),
    p("[Screenshot: Audit log page showing INSERT, DELETE, LOGIN_SUCCESS, LOGIN_FAILED events with timestamps and IP addresses]"),

    h2("5.7 Least-Privilege Database Users (MySQL Production)"),
    p("For production MySQL deployment, the security_setup.sql script creates three database users following the principle of least privilege:"),
    makeTable(
      ["MySQL User", "Granted Permissions", "Denied Permissions", "Purpose"],
      [
        ["clinic_app", "SELECT, INSERT, UPDATE on all tables", "DELETE, DROP, ALTER, GRANT", "Main application user"],
        ["clinic_readonly", "SELECT on all tables", "INSERT, UPDATE, DELETE, DROP", "Reporting and backups"],
        ["clinic_audit", "SELECT, INSERT on audit_log only", "All other tables and operations", "External SIEM integration"],
      ],
      [1800, 2500, 2200, 2526]
    ),
    spacer(),
    p("[Screenshot: MySQL SHOW GRANTS output for clinic_app showing restricted permissions]"),

    h2("5.8 Security Headers"),
    p("The base.html template includes the following HTTP security headers in every response via meta tags and production Nginx configuration:"),
    makeTable(
      ["Header", "Value", "Protection"],
      [
        ["X-Content-Type-Options", "nosniff", "Prevents MIME-type sniffing attacks."],
        ["X-Frame-Options", "DENY", "Prevents clickjacking by blocking iframe embedding."],
        ["Content-Security-Policy", "default-src 'self'", "Restricts resource loading to same origin, blocking XSS payload execution."],
      ],
      [2800, 2200, 4026]
    ),
    spacer(),
    p("[Screenshot: Browser developer tools Network tab showing security headers in server response]"),
    pageBreak()
  ];
}

// ─── Task 6 ─────────────────────────────────────────────────────────────────

function task6() {
  return [
    h1("Task 6: Presentation"),
    p("A 10-minute video presentation covering all tasks in this report has been recorded and uploaded to YouTube. All three group members participated in the presentation, each covering assigned tasks:"),
    spacer(),
    makeTable(
      ["Member", "Tasks Covered", "Duration"],
      [
        ["Name 1 (1221101703)", "Task 1: Proposal & System Design; Task 2: Implementation walkthrough", "~3.5 minutes"],
        ["Name 2 (1221101802)", "Task 3: STRIDE & DREAD Threat Modeling; Task 5: Security Measures", "~3.5 minutes"],
        ["Name 3 (1221101901)", "Task 4: PDPA 2010 Compliance; Demonstration of running application", "~3 minutes"],
      ],
      [2500, 4000, 2526]
    ),
    spacer(),
    new Paragraph({
      spacing: { before: 120, after: 120 },
      children: [
        bold("YouTube Link: "),
        new ExternalHyperlink({
          link: "https://www.youtube.com/watch?v=PLACEHOLDER",
          children: [new TextRun({ text: "https://www.youtube.com/watch?v=PLACEHOLDER", style: "Hyperlink", size: 24, font: "Calibri" })]
        })
      ]
    }),
    p("Note: Replace the placeholder URL above with the actual YouTube link before submission."),
    pageBreak()
  ];
}

// ─── References ─────────────────────────────────────────────────────────────

function references() {
  return [
    h1("References"),
    numbered("Personal Data Protection Department Malaysia. (2010). Personal Data Protection Act 2010 (Act 709). Retrieved from https://www.pdp.gov.my/jpdpv2/assets/2019/09/Personal-Data-Protection-Act-2010.pdf"),
    numbered("Microsoft. (2023). STRIDE Threat Modeling. Microsoft Security Documentation. Retrieved from https://docs.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats"),
    numbered("OWASP Foundation. (2024). OWASP Top 10:2021. Open Web Application Security Project. Retrieved from https://owasp.org/www-project-top-ten/"),
    numbered("Meier, J. D., Mackman, A., Dunner, M., Vasireddy, S., Escamilla, R., & Murukan, A. (2003). Improving Web Application Security: Threats and Countermeasures. Microsoft Press."),
    numbered("Flask Documentation. (2024). Security Considerations. Pallets Projects. Retrieved from https://flask.palletsprojects.com/en/3.0.x/security/"),
    numbered("Werkzeug Documentation. (2024). Password Hashing. Retrieved from https://werkzeug.palletsprojects.com/en/3.0.x/utils/#werkzeug.security.generate_password_hash"),
    numbered("SQLite Documentation. (2024). Security and Privacy. Retrieved from https://www.sqlite.org/security.html"),
    numbered("Howard, M., & LeBlanc, D. (2002). Writing Secure Code (2nd ed.). Microsoft Press."),
    numbered("National Institute of Standards and Technology. (2020). NIST SP 800-63B: Digital Identity Guidelines — Authentication and Lifecycle Management. NIST."),
    numbered("Malaysian Medical Council. (2019). Guidelines on Medical Records and Medical Reports. Kuala Lumpur: MMC."),
  ];
}

// ─── Main document assembly ──────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 24 } }
    },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Calibri", color: "1A365D" },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Calibri", color: "2C5282" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Calibri", color: "2D3748" },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "1A365D", space: 1 } },
          children: [new TextRun({ text: "CCS6344 T2610 — Database & Cloud Security — Assignment 1", size: 18, font: "Calibri", color: "4A5568" })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: "1A365D", space: 1 } },
          children: [
            new TextRun({ text: "Page ", size: 18, font: "Calibri", color: "4A5568" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "Calibri", color: "4A5568" }),
            new TextRun({ text: " of ", size: 18, font: "Calibri", color: "4A5568" }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: "Calibri", color: "4A5568" }),
          ]
        })]
      })
    },
    children: [
      ...coverPage(),
      ...task1(),
      ...task2(),
      ...task3(),
      ...task4(),
      ...task5(),
      ...task6(),
      ...references(),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  const outPath = '../CCS6344_Assignment1_Group1.docx';
  fs.writeFileSync(outPath, buffer);
  console.log('Report generated: ' + outPath);
});
