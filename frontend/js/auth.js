// frontend/js/auth.js — Shared auth helpers for all pages

/** Guard: redirect to login if not authenticated or wrong role */
function requireAuth(allowedRoles = []) {
  const token = getToken();
  const user  = getUser();
  if (!token || !user) { window.location.href = '/'; return null; }
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    window.location.href = '/';
    return null;
  }
  return user;
}

/** Redirect to the correct dashboard after login */
function redirectToDashboard(role) {
  const map = { tenant: '/tenant/dashboard.html', owner: '/owner/dashboard.html', admin: '/admin/dashboard.html' };
  window.location.href = map[role] || '/';
}

function logout() { clearAuth(); window.location.href = '/'; }

/* ── UI Helpers ───────────────────────────── */
function formatCurrency(amount) {
  const n = Number(amount);
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusBadge(status) {
  const map = {
    pending  : '<span class="badge badge-warning">⏳ Pending</span>',
    accepted : '<span class="badge badge-success">✅ Accepted</span>',
    rejected : '<span class="badge badge-danger">❌ Rejected</span>',
    withdrawn: '<span class="badge badge-muted">↩ Withdrawn</span>',
    available: '<span class="badge badge-success">🟢 Available</span>',
    rented   : '<span class="badge badge-danger">🔴 Rented</span>',
  };
  return map[status] || `<span class="badge badge-muted">${status}</span>`;
}

function showToast(message, type = 'success') {
  document.querySelector('.toast-container')?.remove();
  const c = document.createElement('div');
  c.className = 'toast-container';
  c.innerHTML = `<div class="toast toast-${type === 'error' ? 'error' : type === 'info' ? 'info' : 'success'}">${message}</div>`;
  document.body.appendChild(c);
  setTimeout(() => {
    c.querySelector('.toast').classList.add('toast-fade-out');
    setTimeout(() => c.remove(), 400);
  }, 3500);
}

function showModal(html, title = '') {
  document.getElementById('global-modal')?.remove();
  const m = document.createElement('div');
  m.id = 'global-modal';
  m.className = 'modal-overlay';
  m.innerHTML = `
    <div class="modal-box">
      ${title ? `<div class="modal-header"><h3>${title}</h3><button onclick="closeModal()" class="modal-close">✕</button></div>` : ''}
      <div class="modal-body">${html}</div>
    </div>`;
  m.addEventListener('click', e => { if (e.target === m) closeModal(); });
  document.body.appendChild(m);
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const m = document.getElementById('global-modal');
  if (m) { m.classList.add('modal-fade-out'); setTimeout(() => { m.remove(); document.body.style.overflow = ''; }, 300); }
}

/** Initialise nav user info — call after requireAuth */
function renderNav(user) {
  const el = document.getElementById('nav-user-info');
  if (!el || !user) return;
  el.innerHTML = `
    <div class="nav-avatar">${user.name[0].toUpperCase()}</div>
    <span style="font-size:0.85rem; color:var(--text-secondary)">${user.name}</span>
    <span class="nav-role-badge role-${user.role}">${user.role}</span>
    <button class="nav-btn" onclick="logout()">Logout</button>`;
}

/** Switch active tab */
function switchTab(id) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === id));
}

/** Property image with fallback */
function propImg(images, title) {
  const src = Array.isArray(images) && images[0] ? images[0] : null;
  if (src) return `<img class="property-img" src="${src}" alt="${title}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div class="property-img-placeholder" style="display:none">🏠</div>`;
  return `<div class="property-img-placeholder">🏠</div>`;
}
