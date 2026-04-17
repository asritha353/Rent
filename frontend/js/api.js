// frontend/js/api.js — Shared API client for all dashboards
const API_BASE = '/api';

function getToken()  { return localStorage.getItem('rl_token'); }
function getUser()   { try { return JSON.parse(localStorage.getItem('rl_user')); } catch { return null; } }
function setAuth(token, user) {
  localStorage.setItem('rl_token', token);
  localStorage.setItem('rl_user', JSON.stringify(user));
}
function clearAuth() { localStorage.removeItem('rl_token'); localStorage.removeItem('rl_user'); }

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
  register : (d)  => apiCall('POST', '/auth/register', d),
  login    : (d)  => apiCall('POST', '/auth/login', d),
  me       : ()   => apiCall('GET',  '/auth/me'),
};

// ── Public Properties
const propertyAPI = {
  getAll   : (q = {}) => apiCall('GET', `/properties?${new URLSearchParams(q)}`),
  getById  : (id)     => apiCall('GET', `/properties/${id}`),
  getStats : ()       => apiCall('GET', '/properties/stats'),
  getSimilar:(id)     => apiCall('GET', `/properties/similar/${id}`),
};

// ── Tenant
const tenantAPI = {
  apply    : (property_id, message) => apiCall('POST',   '/tenant/applications', { property_id, message }),
  myApps   : ()   => apiCall('GET',    '/tenant/applications'),
  withdraw : (id) => apiCall('DELETE', `/tenant/applications/${id}`),
};

// ── Owner
const ownerAPI = {
  createProperty  : (d)  => apiCall('POST',   '/owner/properties', d),
  myProperties    : (q)  => apiCall('GET',    `/owner/properties?${new URLSearchParams(q||{})}`),
  updateProperty  : (id, d) => apiCall('PUT', `/owner/properties/${id}`, d),
  deleteProperty  : (id) => apiCall('DELETE', `/owner/properties/${id}`),
  applications    : ()   => apiCall('GET',    '/owner/applications'),
  accept          : (id) => apiCall('PUT',    `/owner/applications/${id}/accept`),
  reject          : (id) => apiCall('PUT',    `/owner/applications/${id}/reject`),
};

// ── Admin
const adminAPI = {
  stats           : ()       => apiCall('GET',    '/admin/stats'),
  analytics       : (days)   => apiCall('GET',    `/admin/analytics?days=${days||7}`),
  users           : (q = {}) => apiCall('GET',    `/admin/users?${new URLSearchParams(q)}`),
  properties      : (q = {}) => apiCall('GET',    `/admin/properties?${new URLSearchParams(q)}`),
  applications    : (q = {}) => apiCall('GET',    `/admin/applications?${new URLSearchParams(q)}`),
  deleteUser      : (id)     => apiCall('DELETE', `/admin/users/${id}`),
  deleteProperty  : (id)     => apiCall('DELETE', `/admin/properties/${id}`),
  changeUserRole  : (id, role) => apiCall('PUT',  `/admin/users/${id}/role`, { role }),
};

// ── Agreements
const agreementAPI = {
  generate  : (application_id) => apiCall('POST', '/agreements', { application_id }),
  get       : (applicationId)  => apiCall('GET',  `/agreements/${applicationId}`),
  sign      : (id)             => apiCall('PUT',  `/agreements/${id}/sign`),
};

// ── Chat
const chatAPI = {
  send : (message, context) => apiCall('POST', '/chat', { message, context }),
};
