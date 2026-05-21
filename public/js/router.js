function getContent() { return document.getElementById('page-content'); }
function setContent(html) { const el = getContent(); if (el) el.innerHTML = html; }

const routes = {
  '/': () => renderHome(),
  '/gallery': () => renderGallery(),
  '/events': () => renderEvents(),
  '/favorites': () => renderFavorites(),
  '/cart': () => renderCart(),
  '/checkout': () => renderCheckout(),
  '/login': () => renderLogin(),
  '/register': () => renderRegister(),
  '/profile': () => renderProfile(),
  '/orders': () => renderOrders(),
  '/reservations': () => renderReservations(),
  '/support': () => renderSupport(),
  '/compare': () => renderCompare(),
  '/campaigns': () => renderCampaigns(),
};

function navigate(e, path) {
  if (e) e.preventDefault();
  history.pushState(null, null, path);
  renderPage(path);
  window.scrollTo(0, 0);
  const dd = document.getElementById('user-dropdown');
  if (dd) dd.classList.remove('open');
  const navLinks = document.getElementById('nav-links');
  if (navLinks) navLinks.classList.remove('open');
}

function renderPage(path) {
  const clean = path.split('?')[0];
  if (clean.startsWith('/artwork/')) return renderArtwork(parseInt(clean.split('/')[2]));
  if (clean.startsWith('/event/')) return renderEventDetail(parseInt(clean.split('/')[2]));
  if (clean.startsWith('/admin')) return renderAdmin(clean);
  const fn = routes[clean];
  if (fn) fn();
  else renderHome();
}

window.addEventListener('popstate', () => renderPage(location.pathname));
window.navigate = navigate;
window.renderPage = renderPage;
window.setContent = setContent;
window.getContent = getContent;
