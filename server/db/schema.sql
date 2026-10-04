
CREATE TABLE IF NOT EXISTS departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  -- bcrypt hash
  role ENUM('admin', 'faculty', 'student') NOT NULL,
  phone VARCHAR(15),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  student_code VARCHAR(20) NOT NULL UNIQUE,
  -- STU2024001
  roll_number VARCHAR(20) NOT NULL UNIQUE,
  -- 24CS001
  dept_id INT NOT NULL,
  year TINYINT NOT NULL CHECK (
    year BETWEEN 1 AND 4
  ),
  section CHAR(1) NOT NULL,
  -- A / B / C
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS faculty (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  faculty_code VARCHAR(20) NOT NULL UNIQUE,
  -- FAC001
  dept_id INT NOT NULL,
  designation VARCHAR(100) DEFAULT 'Assistant Professor',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS subjects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  -- CS301
  dept_id INT NOT NULL,
  year TINYINT NOT NULL,
  credits TINYINT DEFAULT 3,
  FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS faculty_subjects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  faculty_id INT NOT NULL,
  subject_id INT NOT NULL,
  section CHAR(1) NOT NULL,
  semester VARCHAR(20) NOT NULL DEFAULT 'ODD-2024',
  UNIQUE KEY uniq_assignment (faculty_id, subject_id, section, semester),
  FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  faculty_subj_id INT NOT NULL,
  date DATE NOT NULL,
  period TINYINT NOT NULL CHECK (
    period BETWEEN 1 AND 8
  ),
  conducted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_session (faculty_subj_id, date, period),
  FOREIGN KEY (faculty_subj_id) REFERENCES faculty_subjects(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS attendance_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  student_id INT NOT NULL,
  status ENUM('present', 'absent', 'late') NOT NULL,
  marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_record (session_id, student_id),
  FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
CREATE OR REPLACE VIEW v_student_attendance AS
SELECT s.id AS student_id,
  u.name AS student_name,
  s.student_code,
  s.roll_number,
  d.code AS dept,
  s.year,
  s.section,
  sub.name AS subject_name,
  sub.code AS subject_code,
  COUNT(ar.id) AS conducted,
  SUM(ar.status IN ('present', 'late')) AS attended,
  ROUND(
    SUM(ar.status IN ('present', 'late')) / COUNT(ar.id) * 100,
    1
  ) AS attendance_pct
FROM students s
  JOIN users u ON s.user_id = u.id
  JOIN departments d ON s.dept_id = d.id
  JOIN attendance_records ar ON ar.student_id = s.id
  JOIN attendance_sessions ss ON ss.id = ar.session_id
  JOIN faculty_subjects fs ON fs.id = ss.faculty_subj_id
  JOIN subjects sub ON sub.id = fs.subject_id
GROUP BY s.id,
  sub.id;
CREATE OR REPLACE VIEW v_dept_attendance AS
SELECT d.id AS dept_id,
  d.name AS dept_name,
  d.code AS dept_code,
  (
    SELECT COUNT(*)
    FROM students s
    WHERE s.dept_id = d.id
  ) AS total_students,
  COALESCE(
    (
      SELECT ROUND(AVG(attendance_pct), 1)
      FROM v_student_attendance vsa
        JOIN students s2 ON vsa.student_id = s2.id
      WHERE s2.dept_id = d.id
    ),
    0
  ) AS avg_attendance
FROM departments d;
-- SEED DATA: Basic Departments
INSERT INTO departments (name, code)
VALUES ('Computer Science and Engineering', 'CSE'),
  (
    'Electronics and Communication Engineering',
    'ECE'
  ),
  ('Mechanical Engineering', 'ME'),
  ('Civil Engineering', 'CE'),
  ('Electrical Engineering', 'EE'),
  ('Information Technology', 'IT');