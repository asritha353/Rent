// frontend/js/api.js — Shared API client for all dashboards
const API_BASE = '/api';

function getToken()  { return localStorage.getItem('rl_token'); }
function getUser()   { try { return JSON.parse(localStorage.getItem('rl_user')); } catch { return null; } }
function setAuth(token, user) {
  localStorage.setItem('rl_token', token);
  localStorage.setItem('rl_user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('rl_token');
  localStorage.removeItem('rl_user');
}

// ── Pick up Google OAuth token from URL after redirect ────────────────────
(function pickupGoogleToken() {
  const params = new URLSearchParams(window.location.search);
  const token  = params.get('google_token');
  const role   = params.get('google_role');
  const isNew  = params.get('new_user');

  if (token && role) {
    // Decode payload from JWT to get user info (without verification — server already verified)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user    = { id: payload.id, name: payload.name, email: payload.email, role: payload.role };
      setAuth(token, user);
      // Clean the URL (remove token from address bar)
      window.history.replaceState({}, document.title, '/');
      // Redirect to the correct dashboard
      window.location.href = { tenant: '/tenant/dashboard.html', owner: '/owner/dashboard.html', admin: '/admin/dashboard.html' }[role] || '/';
    } catch (e) {
      console.error('[Auth] Failed to parse Google token:', e);
    }
  }
})();

async function apiCall(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token   = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);

  const res  = await fetch(API_BASE + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

// ── Auth
const authAPI = {
  register       : (d)  => apiCall('POST', '/auth/register', d),
  login          : (d)  => apiCall('POST', '/auth/login', d),
  me             : ()   => apiCall('GET',  '/auth/me'),
  changePassword : (d)  => apiCall('PUT',  '/auth/change-password', d),
  googleAuth     : (role = 'tenant') => {
    window.location.href = `/api/auth/google?role=${role}`;
  },
};

// ── Public Properties
const propertyAPI = {
  getAll    : (q = {}) => apiCall('GET', `/properties?${new URLSearchParams(q)}`),
  getById   : (id)     => apiCall('GET', `/properties/${id}`),
  getStats  : ()       => apiCall('GET', '/properties/stats'),
  getSimilar: (id)     => apiCall('GET', `/properties/similar/${id}`),
};

// ── Tenant
const tenantAPI = {
  apply    : (property_id, message) => apiCall('POST',   '/tenant/applications', { property_id, message }),
  myApps   : ()   => apiCall('GET',    '/tenant/applications'),
  withdraw : (id) => apiCall('DELETE', `/tenant/applications/${id}`),
};

// ── Owner
const ownerAPI = {
  createProperty : (d)      => apiCall('POST',   '/owner/properties', d),
  myProperties   : (q)      => apiCall('GET',    `/owner/properties?${new URLSearchParams(q||{})}`),
  updateProperty : (id, d)  => apiCall('PUT',    `/owner/properties/${id}`, d),
  deleteProperty : (id)     => apiCall('DELETE', `/owner/properties/${id}`),
  applications   : ()       => apiCall('GET',    '/owner/applications'),
  accept         : (id)     => apiCall('PUT',    `/owner/applications/${id}/accept`),
  reject         : (id)     => apiCall('PUT',    `/owner/applications/${id}/reject`),
  stats          : ()       => apiCall('GET',    '/owner/stats'),
};

// ── Admin
const adminAPI = {
  stats          : ()        => apiCall('GET',    '/admin/stats'),
  analytics      : ()        => apiCall('GET',    '/admin/analytics'),
  users          : (q = {})  => apiCall('GET',    `/admin/users?${new URLSearchParams(q)}`),
  properties     : (q = {})  => apiCall('GET',    `/admin/properties?${new URLSearchParams(q)}`),
  applications   : (q = {})  => apiCall('GET',    `/admin/applications?${new URLSearchParams(q)}`),
  deleteUser     : (id)      => apiCall('DELETE', `/admin/users/${id}`),
  deleteProperty : (id)      => apiCall('DELETE', `/admin/properties/${id}`),
  changeRole     : (id, role)=> apiCall('PUT',    `/admin/users/${id}/role`, { role }),
};

// ── Agreements
const agreementAPI = {
  generate : (application_id) => apiCall('POST', '/agreements', { application_id }),
  get      : (applicationId)  => apiCall('GET',  `/agreements/${applicationId}`),
  sign     : (id)             => apiCall('PUT',  `/agreements/${id}/sign`),
};

// ── Chat
const chatAPI = {
  send : (message, context) => apiCall('POST', '/chat', { message, context }),
};
