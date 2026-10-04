/* ============================================
   MAIN JS — Shared Utilities & Navigation
   ============================================ */

// ---- Toast Notifications ----
const toastContainer = (() => {
  let el = document.getElementById('toast-container');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-container';
    document.body.appendChild(el);
  }
  return el;
})();

function showToast(message, type = 'info', duration = 3500) {
  const icons = { success: '✅', error: '❌', danger: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });
  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 500);
  }, duration);
}

// ---- Sidebar Toggle (Mobile) ----
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburger');
  if (!sidebar || !hamburger) return;

  // Create overlay
  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
  }

  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  });

  // Close sidebar on nav click (mobile)
  sidebar.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      }
    });
  });
}

// ---- Modal Helpers ----
function openModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (overlay) overlay.classList.add('active');
}
function closeModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (overlay) overlay.classList.remove('active');
}
function initModals() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay').classList.remove('active');
    });
  });
  document.querySelectorAll('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.modalOpen));
  });
}

// ---- Tabs ----
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabGroup = btn.dataset.tab;
      const panel = btn.dataset.panel;
      // Deactivate all in group
      document.querySelectorAll(`.tab-btn[data-tab="${tabGroup}"]`).forEach(b => b.classList.remove('active'));
      document.querySelectorAll(`.tab-content[data-tab="${tabGroup}"]`).forEach(c => c.classList.remove('active'));
      // Activate
      btn.classList.add('active');
      const target = document.querySelector(`.tab-content[data-tab="${tabGroup}"][data-panel="${panel}"]`);
      if (target) target.classList.add('active');
    });
  });
}

// ---- Number Counter Animation ----
function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const duration = 1500;
  const start = performance.now();
  const isFloat = String(target).includes('.');
  const decimals = isFloat ? (String(target).split('.')[1] || '').length : 0;

  function update(now) {
    const elapsed = Math.min(now - start, duration);
    const progress = elapsed / duration;
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const value = eased * target;
    el.textContent = prefix + (isFloat ? value.toFixed(decimals) : Math.floor(value)) + suffix;
    if (elapsed < duration) requestAnimationFrame(update);
    else el.textContent = prefix + target + suffix;
  }
  requestAnimationFrame(update);
}

// ---- Intersection Observer for animations ----
function initAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-fade-in-up, .animate-fade-in, .animate-scale-in').forEach(el => {
    el.style.animationPlayState = 'paused';
    observer.observe(el);
  });

  // Counter animations
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-value[data-target]').forEach(el => counterObserver.observe(el));
}

// ---- API Configuration ----
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Enhanced fetch utility for edudbms API
 * Handles: Base URL, Auth tokens, 401/403 redirects, and error parsing
 */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('ea_token');
  
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  try {
    const res = await fetch(url, { ...options, headers });
    
    // Handle auth errors (401 Unauthorized or 403 Forbidden)
    if (res.status === 401 || res.status === 403) {
      console.warn('Authentication error, redirecting to login...');
      localStorage.removeItem('ea_token');
      localStorage.removeItem('ea_user');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
        window.location.href = 'index.html';
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Session expired. Please login again.');
    }

    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      throw new Error(data.error || `HTTP error! status: ${res.status}`);
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      showToast('Cannot connect to server. Is it running?', 'danger');
    }
    throw error;
  }
}

// ---- Authentication / Login ----
async function login(e) {
  if (e) e.preventDefault();

  const identifier = document.getElementById('userId')?.value || document.getElementById('emailInput')?.value;
  const password = document.getElementById('password')?.value || document.getElementById('passwordInput')?.value;

  if (!identifier || !password) {
    showToast('Please enter your credentials', 'warning');
    return;
  }

  const btn = document.getElementById('loginBtn');
  const btnText = document.getElementById('loginBtnText');
  const spinner = document.getElementById('loginSpinner');

  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = 'Authenticating...';
  if (spinner) spinner.style.display = 'inline-block';

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });

    // Save token to localStorage
    localStorage.setItem('ea_token', data.token);
    localStorage.setItem('ea_user', JSON.stringify(data.user));

    showToast('Login successful!', 'success');

    // Redirect based on role
    setTimeout(() => {
      if (data.user.role === 'admin') window.location.href = 'admin-dashboard.html';
      else if (data.user.role === 'faculty') window.location.href = 'faculty-dashboard.html';
      else window.location.href = 'student-dashboard.html';
    }, 800);

  } catch (error) {
    showToast(error.message, 'danger');
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Sign In';
    if (spinner) spinner.style.display = 'none';
  }
}

// ---- Search Filter ----
function initSearch(inputId, itemSelector, searchFields) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('input', () => {
    const query = input.value.toLowerCase().trim();
    document.querySelectorAll(itemSelector).forEach(item => {
      const text = searchFields.map(f => {
        const el = item.querySelector(f);
        return el ? el.textContent.toLowerCase() : '';
      }).join(' ');
      item.style.display = text.includes(query) ? '' : 'none';
    });
  });
}

// ---- Profile Sync ----
function syncProfile() {
  const userString = localStorage.getItem('ea_user');
  if (!userString) return;
  const user = JSON.parse(userString);
  if (!user.name) return;

  const elements = {
    sidebarUserName: user.name,
    welcomeName: user.name,
    sidebarUserRole: user.role.charAt(0).toUpperCase() + user.role.slice(1)
  };

  for (const [id, val] of Object.entries(elements)) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  document.querySelectorAll('.avatar').forEach(av => {
    av.textContent = user.name.charAt(0).toUpperCase();
  });
}

// ---- Logout ----
function logout() {
  showToast('Logging out...', 'info', 1000);
  localStorage.removeItem('ea_token');
  localStorage.removeItem('ea_user');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

// ---- Progress bar animations ----
function animateProgressBars() {
  document.querySelectorAll('.progress-fill[data-width]').forEach(bar => {
    setTimeout(() => {
      bar.style.width = bar.dataset.width + '%';
    }, 300);
  });
}

// ---- Circular progress ----
function initCircularProgress() {
  document.querySelectorAll('.circular-progress').forEach(el => {
    const circle = el.querySelector('.value-circle');
    const valueEl = el.querySelector('.circular-progress-value');
    if (!circle) return;
    const radius = circle.getAttribute('r');
    const circumference = 2 * Math.PI * radius;
    const percent = parseFloat(el.dataset.percent || 0);
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference;
    setTimeout(() => {
      const offset = circumference - (percent / 100) * circumference;
      circle.style.strokeDashoffset = offset;
      if (valueEl) {
        let current = 0;
        const step = percent / 60;
        const interval = setInterval(() => {
          current = Math.min(current + step, percent);
          valueEl.textContent = Math.round(current) + '%';
          if (current >= percent) clearInterval(interval);
        }, 16);
      }
    }, 400);
  });
}

// ---- Active nav highlighting ----
function highlightActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item[href]').forEach(item => {
    const href = item.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      item.classList.add('active');
    }
  });
}

// ---- Initialize all ----
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initModals();
  initTabs();
  initAnimations();
  animateProgressBars();
  initCircularProgress();
  highlightActiveNav();
  syncProfile();

  // Close toast on click
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('toast')) e.target.remove();
  });
});

