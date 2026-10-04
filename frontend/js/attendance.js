// ============================================
// ATTENDANCE.JS — Attendance logic & utilities
// ============================================

// ---- Attendance State Store ----
const AttendanceStore = {
  records: {},       // { "subjectCode_date": { studentId: 'present'|'absent'|'late' } }
  drafts: {},       // same structure, unsaved

  getKey(subjectCode, date) {
    return `${subjectCode}_${date}`;
  },

  save(subjectCode, date, data) {
    const key = this.getKey(subjectCode, date);
    this.records[key] = { ...data, _submittedAt: new Date().toISOString() };
    delete this.drafts[key];
    this._persist();
    return key;
  },

  saveDraft(subjectCode, date, data) {
    const key = this.getKey(subjectCode, date);
    this.drafts[key] = { ...data, _savedAt: new Date().toISOString() };
    this._persist();
  },

  get(subjectCode, date) {
    const key = this.getKey(subjectCode, date);
    return this.records[key] || null;
  },

  getDraft(subjectCode, date) {
    const key = this.getKey(subjectCode, date);
    return this.drafts[key] || null;
  },

  isSubmitted(subjectCode, date) {
    return !!this.records[this.getKey(subjectCode, date)];
  },

  _persist() {
    try {
      localStorage.setItem('ea_records', JSON.stringify(this.records));
      localStorage.setItem('ea_drafts', JSON.stringify(this.drafts));
    } catch (e) { /* storage unavailable */ }
  },

  load() {
    try {
      const r = localStorage.getItem('ea_records');
      const d = localStorage.getItem('ea_drafts');
      if (r) this.records = JSON.parse(r);
      if (d) this.drafts = JSON.parse(d);
    } catch (e) { /* parse error */ }
  },

  clearAll() {
    this.records = {}; this.drafts = {};
    localStorage.removeItem('ea_records');
    localStorage.removeItem('ea_drafts');
  }
};

// Load persisted data on boot
AttendanceStore.load();


// ---- Attendance Calculator ----
const AttendanceCalc = {

  /**
   * Calculate attendance percentage
   * @param {number} attended
   * @param {number} conducted
   * @returns {number} percentage (0-100)
   */
  percentage(attended, conducted) {
    if (!conducted) return 0;
    return Math.round((attended / conducted) * 100);
  },

  /**
   * Status based on percentage
   * @param {number} pct
   * @returns {'good'|'average'|'low'}
   */
  status(pct) {
    if (pct >= 85) return 'good';
    if (pct >= 75) return 'average';
    return 'low';
  },

  /**
   * How many classes a student can still miss while staying >= minPct
   * @param {number} attended
   * @param {number} conducted
   * @param {number} minPct - default 75
   * @returns {number} classes that can be missed (0 if already below)
   */
  canMiss(attended, conducted, minPct = 75) {
    // attended / (conducted + x) >= minPct/100  → x can be negative (already below)
    // Solve for missing classes:  (attended - minPct/100 * conducted) / (minPct/100)
    const result = Math.floor((attended - (minPct / 100) * conducted) / (minPct / 100));
    return Math.max(0, result);
  },

  /**
   * How many more classes must be attended to reach minPct
   * @param {number} attended
   * @param {number} conducted
   * @param {number} minPct
   * @returns {number} 0 if already above threshold
   */
  mustAttend(attended, conducted, minPct = 75) {
    // (attended + x) / (conducted + x) >= minPct/100
    // x >= (minPct * conducted - 100 * attended) / (100 - minPct)
    const x = Math.ceil((minPct * conducted - 100 * attended) / (100 - minPct));
    return Math.max(0, x);
  },

  /**
   * Summarise an attendance record object { studentId: status }
   * @param {object} record
   * @returns {{ present, absent, late, total, presentPct }}
   */
  summarise(record) {
    const entries = Object.entries(record).filter(([k]) => !k.startsWith('_'));
    const total = entries.length;
    const present = entries.filter(([, v]) => v === 'present').length;
    const absent = entries.filter(([, v]) => v === 'absent').length;
    const late = entries.filter(([, v]) => v === 'late').length;
    return { present, absent, late, total, presentPct: this.percentage(present + late, total) };
  },

  /**
   * Build a per-student attendance summary across multiple records
   * @param {string[]} studentIds
   * @param {object[]} records  - array of record objects
   * @returns {object} { studentId: { attended, conducted, pct, status } }
   */
  buildStudentSummary(studentIds, records) {
    const summary = {};
    studentIds.forEach(id => {
      summary[id] = { attended: 0, conducted: 0 };
    });
    records.forEach(rec => {
      const entries = Object.entries(rec).filter(([k]) => !k.startsWith('_'));
      entries.forEach(([id, status]) => {
        if (!summary[id]) summary[id] = { attended: 0, conducted: 0 };
        summary[id].conducted++;
        if (status === 'present' || status === 'late') summary[id].attended++;
      });
    });
    Object.keys(summary).forEach(id => {
      const s = summary[id];
      s.pct = this.percentage(s.attended, s.conducted);
      s.status = this.status(s.pct);
    });
    return summary;
  }
};


// ---- Attendance UI Helpers ----
const AttendanceUI = {

  /**
   * Render a colour-coded attendance badge element (returns HTML string)
   */
  badge(pct) {
    const st = AttendanceCalc.status(pct);
    const cls = st === 'good' ? 'badge-success' : st === 'average' ? 'badge-warning' : 'badge-danger';
    const lbl = st === 'good' ? 'Good' : st === 'average' ? 'Average' : 'Low';
    return `<span class="badge ${cls}">${pct}% · ${lbl}</span>`;
  },

  /**
   * Render a mini progress bar HTML string
   */
  progressBar(pct, width = 80) {
    const cls = AttendanceCalc.status(pct);
    const fillClass = cls === 'good' ? 'success' : cls === 'average' ? 'warning' : 'danger';
    return `<div class="progress-bar" style="width:${width}px">
      <div class="progress-fill ${fillClass}" style="width:${pct}%"></div>
    </div>`;
  },

  /**
   * Render the circular SVG progress ring HTML
   */
  circularRing(pct, size = 120, colorStart = '#4361ee', colorStop = '#4cc9f0') {
    const r = size * 0.4;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (pct / 100) * circumference;
    const gradId = 'cg' + Math.random().toString(36).slice(2, 6);
    return `
    <div style="position:relative;width:${size}px;height:${size}px">
      <svg viewBox="0 0 ${size} ${size}" style="width:${size}px;height:${size}px;transform:rotate(-90deg)">
        <defs>
          <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${colorStart}"/>
            <stop offset="100%" stop-color="${colorStop}"/>
          </linearGradient>
        </defs>
        <circle fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="${size * 0.08}"
          cx="${size / 2}" cy="${size / 2}" r="${r}"/>
        <circle fill="none" stroke="url(#${gradId})" stroke-width="${size * 0.08}"
          stroke-linecap="round" cx="${size / 2}" cy="${size / 2}" r="${r}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${offset}"
          style="transition:stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)"/>
      </svg>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center">
        <div style="font-size:${size * 0.18}px;font-weight:800;font-family:'Orbitron',sans-serif;line-height:1">${pct}%</div>
        <div style="font-size:${size * 0.09}px;color:rgba(255,255,255,0.4)">Attendance</div>
      </div>
    </div>`;
  },

  /**
   * Update toggle button states for a student row
   * @param {HTMLElement} row - the .student-row element
   * @param {string} status - 'present' | 'absent' | 'late' | ''
   */
  updateToggle(row, status) {
    if (!row) return;
    row.className = 'student-row' + (status ? ` ${status}-row` : '');
    const btns = row.querySelectorAll('.att-btn');
    if (btns.length >= 3) {
      btns[0].className = 'att-btn present' + (status === 'present' ? ' active' : '');
      btns[1].className = 'att-btn absent' + (status === 'absent' ? ' active' : '');
      btns[2].className = 'att-btn late' + (status === 'late' ? ' active' : '');
    }
  },

  /**
   * Live counter update — call after every status change
   * @param {object} attendance - { studentName: 'present'|'absent'|'late'|'' }
   * @param {number} total - total students
   * @param {object} elIds - { present, absent, late, unmarked }
   */
  updateCounters(attendance, total, elIds = {}) {
    const vals = Object.values(attendance);
    const p = vals.filter(v => v === 'present').length;
    const a = vals.filter(v => v === 'absent').length;
    const l = vals.filter(v => v === 'late').length;
    const u = total - vals.filter(v => v).length;
    if (elIds.present) { const el = document.getElementById(elIds.present); if (el) el.textContent = p; }
    if (elIds.absent) { const el = document.getElementById(elIds.absent); if (el) el.textContent = a; }
    if (elIds.late) { const el = document.getElementById(elIds.late); if (el) el.textContent = l; }
    if (elIds.unmarked) { const el = document.getElementById(elIds.unmarked); if (el) el.textContent = u; }
    return { p, a, l, u };
  }
};


// ---- Date Utilities ----
const AttendanceDate = {

  today() {
    return new Date().toISOString().split('T')[0];
  },

  format(dateStr, style = 'long') {
    const d = new Date(dateStr);
    if (style === 'short') return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  },

  /**
   * Generate an array of date strings for a month
   * @param {number} year
   * @param {number} month - 1-indexed
   * @returns {string[]}
   */
  daysInMonth(year, month) {
    const days = [];
    const date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
      days.push(date.toISOString().split('T')[0]);
      date.setDate(date.getDate() + 1);
    }
    return days;
  },

  isWeekend(dateStr) {
    const d = new Date(dateStr);
    return d.getDay() === 0 || d.getDay() === 6;
  },

  isFuture(dateStr) {
    return new Date(dateStr) > new Date();
  },

  isToday(dateStr) {
    return dateStr === this.today();
  }
};


// ---- CSV Export ----
const AttendanceExport = {

  /**
   * Export student-wise attendance summary to CSV
   * @param {object[]} rows  - array of { name, id, dept, year, subject, conducted, attended }
   * @param {string} filename
   */
  toCSV(rows, filename = 'attendance_report.csv') {
    const headers = ['Name', 'Student ID', 'Department', 'Year', 'Subject', 'Conducted', 'Attended', 'Attendance %', 'Status'];
    const body = rows.map(r => {
      const pct = AttendanceCalc.percentage(r.attended, r.conducted);
      const st = AttendanceCalc.status(pct);
      const lbl = st === 'good' ? 'Good' : st === 'average' ? 'Average' : 'Low';
      return [r.name, r.id, r.dept, r.year, r.subject, r.conducted, r.attended, pct + '%', lbl].join(',');
    });
    const csv = [headers.join(','), ...body].join('\n');
    this._download(csv, filename, 'text/csv;charset=utf-8;');
  },

  /**
   * Export a single session's attendance (present/absent/late list)
   */
  sessionToCSV(subject, date, section, records, filename) {
    const headers = ['Roll No', 'Name', 'Status', 'Date', 'Subject', 'Section'];
    const body = Object.entries(records)
      .filter(([k]) => !k.startsWith('_'))
      .map(([id, status]) => [id, '', status, date, subject, section].join(','));
    const csv = [headers.join(','), ...body].join('\n');
    this._download(csv, filename || `attendance_${subject}_${date}.csv`, 'text/csv;charset=utf-8;');
  },

  _download(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
  }
};


// ---- Heatmap Builder ----
const AttendanceHeatmap = {

  /**
   * Render a monthly attendance heatmap into a container
   * @param {string} containerId - id of the grid container
   * @param {number} year
   * @param {number} month - 1-indexed
   * @param {object} statusMap - { 'YYYY-MM-DD': 'present'|'absent'|'late'|'holiday' }
   */
  render(containerId, year, month, statusMap = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
    const days = AttendanceDate.daysInMonth(year, month);

    // Fill leading empty cells
    for (let i = 0; i < firstDay; i++) {
      const blank = document.createElement('div');
      blank.className = 'heatmap-cell future';
      blank.style.opacity = '0';
      container.appendChild(blank);
    }

    days.forEach(dateStr => {
      const cell = document.createElement('div');
      const isWeekend = AttendanceDate.isWeekend(dateStr);
      const isFuture = AttendanceDate.isFuture(dateStr);
      const status = statusMap[dateStr];
      const day = new Date(dateStr).getDate();

      if (isFuture || isWeekend) {
        cell.className = 'heatmap-cell future';
        if (isWeekend) cell.style.opacity = '0.3';
      } else if (status) {
        cell.className = `heatmap-cell ${status}`;
      } else {
        cell.className = 'heatmap-cell';
      }

      cell.title = `${AttendanceDate.format(dateStr, 'short')} — ${status ? status.charAt(0).toUpperCase() + status.slice(1) : 'No data'}`;
      cell.dataset.date = dateStr;

      // Tooltip on click
      cell.addEventListener('click', () => {
        if (window.showToast) showToast(`${AttendanceDate.format(dateStr, 'short')}: ${status || 'No record'}`, 'info', 2000);
      });

      container.appendChild(cell);
    });
  }
};


// ---- Notification / Alert Helpers ----
const AttendanceAlerts = {

  LOW_THRESHOLD: 75,

  /**
   * Get students below the threshold from a summary object
   */
  getLowStudents(summaryMap) {
    return Object.entries(summaryMap)
      .filter(([, s]) => s.pct < this.LOW_THRESHOLD)
      .sort((a, b) => a[1].pct - b[1].pct);
  },

  /**
   * Render an alert banner into a container element
   */
  renderBanner(containerId, lowStudents) {
    const el = document.getElementById(containerId);
    if (!el || !lowStudents.length) return;
    el.innerHTML = `
    <div class="alert alert-warning">
      <span style="font-size:20px">⚠️</span>
      <div>
        <strong>${lowStudents.length} student${lowStudents.length > 1 ? 's' : ''}</strong>
        with attendance below ${this.LOW_THRESHOLD}%.
        <a href="reports.html" style="color:inherit;text-decoration:underline;font-weight:600;margin-left:8px">View Report →</a>
      </div>
    </div>`;
  }
};


// ---- Expose globally ----
window.AttendanceStore = AttendanceStore;
window.AttendanceCalc = AttendanceCalc;
window.AttendanceUI = AttendanceUI;
window.AttendanceDate = AttendanceDate;
window.AttendanceExport = AttendanceExport;
window.AttendanceHeatmap = AttendanceHeatmap;
window.AttendanceAlerts = AttendanceAlerts;
