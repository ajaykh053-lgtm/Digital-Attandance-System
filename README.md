# EduAttend — Digital Attendance System

Digital Attendance Management System for Engineering Colleges featuring dedicated portals for Students, Faculty, and Administrators.

## Project Structure

```text
Digital-Attandance-System/
├── frontend/                     # Frontend client application
│   ├── index.html                # Login / Landing portal
│   ├── admin-dashboard.html      # Administrator dashboard
│   ├── faculty-dashboard.html    # Faculty overview & analytics
│   ├── student-dashboard.html    # Student attendance & metrics
│   ├── faculty.html              # Faculty management
│   ├── students.html             # Student management
│   ├── mark-attendance.html      # Daily attendance recording
│   ├── reports.html              # Attendance reporting & export
│   ├── register.html             # Account registration
│   ├── css/                      # Stylesheets (style.css, dashboard.css)
│   └── js/                       # Client scripts (main.js, attendance.js, charts.js)
├── server/                       # Node.js Express backend API
│   ├── config/                   # Database connection configuration
│   ├── controllers/              # Route handlers & business logic
│   ├── db/                       # SQL schema & database migrations
│   ├── middleware/               # Authentication & validation middleware
│   ├── routes/                   # Express API routes
│   └── server.js                 # API server entrypoint
├── guide/                        # Setup documentation & guides
└── README.md
```

## Quick Start

### 1. Database Setup
- Start MySQL (via XAMPP or native service).
- Create database `edudbms`.
- Import the schema from [server/db/schema.sql](file:///e:/Projects/Digital-Attandance-System/server/db/schema.sql).

### 2. Backend Setup
```bash
cd server
npm install
npm start
```
The server will run on `http://localhost:3000` and serve both the API routes (`/api/*`) and frontend static pages.

### 3. Frontend (Optional Standalone)
You can open `frontend/index.html` using Live Server in VS Code or `http-server`:
```bash
cd frontend
npx http-server -p 8080
```