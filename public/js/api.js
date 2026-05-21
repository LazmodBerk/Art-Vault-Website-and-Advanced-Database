const API = '';
const getToken = () => localStorage.getItem('token');
const setToken = t => localStorage.setItem('token', t);
const removeToken = () => localStorage.removeItem('token');
const getUser = () => JSON.parse(localStorage.getItem('user') || 'null');
const setUser = u => localStorage.setItem('user', JSON.stringify(u));
const removeUser = () => localStorage.removeItem('user');

async function api(path, opts = {}) {
  const h = { 'Content-Type': 'application/json' };
  const t = getToken();
  if (t) h['Authorization'] = 'Bearer ' + t;
  const r = await fetch(API + path, { ...opts, headers: { ...h, ...(opts.headers || {}) } });
  const d = await r.json();
  if (!r.ok) {
    if (r.status === 401) {
      removeToken();
      removeUser();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    throw new Error(d.message || 'Request failed');
  }
  return d;
}

function showToast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.innerHTML = `${msg}<button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;cursor:pointer;margin-left:1rem;font-size:1rem">&#10005;</button>`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function stars(rating) {
  const n = Math.round(rating || 0);
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function formatPrice(p) { return '₺' + Number(p).toLocaleString('tr-TR'); }
function formatDate(d) { return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }); }
function isLoggedIn() { return !!getToken(); }
function isAdmin() { const u = getUser(); return u && u.role === 'admin'; }

window.api = api; window.showToast = showToast; window.stars = stars;
window.formatPrice = formatPrice; window.formatDate = formatDate;
window.isLoggedIn = isLoggedIn; window.isAdmin = isAdmin;
window.getToken = getToken; window.setToken = setToken; window.removeToken = removeToken;
window.getUser = getUser; window.setUser = setUser; window.removeUser = removeUser;
