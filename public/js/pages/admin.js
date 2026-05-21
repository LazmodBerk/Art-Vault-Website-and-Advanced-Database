function renderAdmin(path) {
  if (!isAdmin()) return navigate(null, '/login');
  const sub = path.split('/')[2] || 'dashboard';
  setContent(`
  <div class="admin-layout">
    <nav class="admin-sidebar">
      <div class="sidebar-section">
        <div class="sidebar-title">Yönetim</div>
        <a class="sidebar-link" onclick="navigate(null,'/admin/dashboard')">📊 Dashboard</a>
        <a class="sidebar-link" onclick="navigate(null,'/admin/artworks')">🎨 Eserler</a>
        <a class="sidebar-link" onclick="navigate(null,'/admin/events')">📅 Etkinlikler</a>
        <a class="sidebar-link" onclick="navigate(null,'/admin/users')">👥 Kullanıcılar</a>
        <a class="sidebar-link" onclick="navigate(null,'/admin/orders')">📦 Siparişler</a>
        <a class="sidebar-link" onclick="navigate(null,'/admin/reservations')">📋 Rezervasyonlar</a>
        <a class="sidebar-link" onclick="navigate(null,'/admin/comments')">💬 Yorumlar</a>
        <a class="sidebar-link" onclick="navigate(null,'/admin/coupons')">🎫 Kuponlar</a>
        <a class="sidebar-link" onclick="navigate(null,'/admin/support')">🎧 Destek</a>
      </div>
    </nav>
    <div class="admin-main" id="admin-content">
      <div class="spinner-container"><div class="spinner"></div></div>
    </div>
  </div>`);
  const fns = { dashboard: loadAdminDashboard, artworks: loadAdminArtworks, events: loadAdminEvents, users: loadAdminUsers, orders: loadAdminOrders, reservations: loadAdminReservations, comments: loadAdminComments, coupons: loadAdminCoupons, support: loadAdminSupport };
  (fns[sub] || loadAdminDashboard)();
}

async function loadAdminDashboard() {
  const el = document.getElementById('admin-content'); if (!el) return;
  try {
    const r = await api('/api/admin/dashboard'); const d = r.data;
    el.innerHTML = `
    <h2 style="font-family:Cormorant Garamond,serif;font-size:2rem;font-weight:300;margin-bottom:2rem">Dashboard</h2>
    <div class="stat-grid">
      ${[['👥', 'Kullanıcılar', d.stats.totalUsers, ''], ['📦', 'Siparişler', d.stats.totalOrders, ''], ['💰', 'Gelir', d.stats.totalRevenue, '₺'], ['⏳', 'Bekleyen', d.stats.pendingOrders, ''], ['🎨', 'Eserler', d.stats.totalArtworks, ''], ['📅', 'Etkinlikler', d.stats.totalEvents, ''], ['📋', 'Rezervasyon', d.stats.totalReservations, ''], ['🎧', 'Açık Talep', d.stats.openTickets, '']].map(([icon, label, val, prefix]) => `<div class="stat-card"><div class="stat-icon">${icon}</div><div class="stat-value">${prefix === '₺' ? formatPrice(val) : val}</div><div class="stat-label">${label}</div></div>`).join('')}
    </div>
    <h3 style="font-family:Cormorant Garamond,serif;font-size:1.5rem;font-weight:300;margin:2rem 0 1rem">En Popüler Eserler</h3>
    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>Eser</th><th>Sanatçı</th><th>Görüntülenme</th><th>Puan</th><th>Fiyat</th></tr></thead>
        <tbody>
          ${d.topArtworks.map(a => `<tr><td><div style="display:flex;align-items:center;gap:.75rem"><img src="${a.image_url}" style="width:40px;height:35px;object-fit:cover;border-radius:2px" onerror="this.style.display='none'"><span>${a.title}</span></div></td><td style="color:var(--text2)">${a.artist_name}</td><td>${a.view_count}</td><td><span class="stars">${stars(a.average_rating)}</span></td><td style="color:var(--gold)">${formatPrice(a.price)}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
    <h3 style="font-family:Cormorant Garamond,serif;font-size:1.5rem;font-weight:300;margin:2rem 0 1rem">Son Siparişler</h3>
    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>#</th><th>Müşteri</th><th>Tutar</th><th>Durum</th><th>Tarih</th></tr></thead>
        <tbody>
          ${d.recentOrders.map(o => `<tr><td>#${o.id}</td><td>${o.full_name}</td><td style="color:var(--gold)">${formatPrice(o.total_amount)}</td><td><span class="status-badge status-${o.order_status}">${o.order_status}</span></td><td style="color:var(--text2)">${formatDate(o.created_at)}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  } catch (e) { el.innerHTML = '<p style="color:var(--text2)">' + e.message + '</p>'; }
}

async function loadAdminArtworks() {
  const el = document.getElementById('admin-content'); if (!el) return;
  const r = await api('/api/artworks?limit=50');
  el.innerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem"><h2 style="font-family:Cormorant Garamond,serif;font-size:2rem;font-weight:300">Eserler</h2><button class="btn btn-gold" onclick="showArtworkModal()">+ Eser Ekle</button></div>
  <div class="table-wrap">
    <table class="table">
      <thead><tr><th>Eser</th><th>Kategori</th><th>Fiyat</th><th>Stok</th><th>Görüntülenme</th><th>İşlem</th></tr></thead>
      <tbody>
        ${r.data.map(a => `<tr><td><div style="display:flex;align-items:center;gap:.75rem"><img src="${a.image_url}" style="width:50px;height:40px;object-fit:cover;border-radius:2px" onerror="this.style.display='none'"><div><div style="font-weight:500">${a.title}</div><div style="color:var(--text2);font-size:.8rem">${a.artist_name}</div></div></div></td><td>${a.category}</td><td style="color:var(--gold)">${formatPrice(a.price)}</td><td>${a.stock}</td><td>${a.view_count}</td><td><button class="btn-sm btn-primary" onclick="navigate(null,'/artwork/${a.id}')" style="margin-right:.5rem">Gör</button><button class="btn-sm" onclick="deleteArtwork(${a.id})" style="color:#f87171;border-color:#f87171">Sil</button></td></tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div id="artwork-modal"></div>`;
}

async function deleteArtwork(id) {
  if (!confirm('Bu eseri silmek istediğinize emin misiniz?')) return;
  try { await api('/api/artworks/' + id, { method: 'DELETE' }); showToast('Eser silindi', 'info'); loadAdminArtworks(); } catch (e) { showToast(e.message, 'error'); }
}

function showArtworkModal() {
  const el = document.getElementById('artwork-modal'); if (!el) return;
  el.innerHTML = `
  <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
    <div class="modal">
      <div class="modal-header"><h3>Yeni Eser Ekle</h3><button onclick="this.closest('.modal-overlay').remove()" style="background:none;border:none;color:var(--text);cursor:pointer;font-size:1.5rem">&#10005;</button></div>
      <div class="modal-body">
        <form onsubmit="createArtwork(event)">
          <div class="form-group"><label>Başlık</label><input class="form-control" id="aw-title" required></div>
          <div class="form-group"><label>Kategori</label><select class="form-select" id="aw-cat"><option>Abstract</option><option>Landscape</option><option>Minimalist</option><option>Sculpture</option><option>Cultural</option><option>Impressionist</option></select></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem"><div class="form-group"><label>Fiyat (₺)</label><input class="form-control" id="aw-price" type="number" required></div><div class="form-group"><label>Stok</label><input class="form-control" id="aw-stock" type="number" value="1"></div></div>
          <div class="form-group"><label>Sanatçı ID</label><input class="form-control" id="aw-artist" type="number" value="1" required></div>
          <div class="form-group"><label>Görsel URL</label><input class="form-control" id="aw-img" placeholder="https://..."></div>
          <div class="form-group"><label>Açıklama</label><textarea class="form-control" id="aw-desc" rows="3"></textarea></div>
          <button type="submit" class="btn btn-gold">Ekle</button>
        </form>
      </div>
    </div>
  </div>`;
}

async function createArtwork(e) {
  e.preventDefault();
  try {
    await api('/api/artworks', { method: 'POST', body: JSON.stringify({ title: document.getElementById('aw-title').value, category: document.getElementById('aw-cat').value, price: parseFloat(document.getElementById('aw-price').value), stock: parseInt(document.getElementById('aw-stock').value), artist_id: parseInt(document.getElementById('aw-artist').value), image_url: document.getElementById('aw-img').value, description: document.getElementById('aw-desc').value }) });
    document.querySelector('.modal-overlay').remove(); showToast('Eser eklendi'); loadAdminArtworks();
  } catch (ex) { showToast(ex.message, 'error'); }
}

async function loadAdminEvents() {
  const el = document.getElementById('admin-content'); if (!el) return;
  const r = await api('/api/events?limit=50');
  el.innerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem"><h2 style="font-family:Cormorant Garamond,serif;font-size:2rem;font-weight:300">Etkinlikler</h2></div>
  <div class="table-wrap">
    <table class="table">
      <thead><tr><th>Etkinlik</th><th>Tarih</th><th>Eğitmen</th><th>Kapasite</th><th>Fiyat</th><th>İşlem</th></tr></thead>
      <tbody>
        ${r.data.map(e => `<tr><td>${e.title}</td><td>${formatDate(e.date)} ${e.time}</td><td>${e.instructor}</td><td>${e.reserved_count}/${e.capacity}</td><td style="color:var(--gold)">${formatPrice(e.price)}</td><td><button class="btn-sm" onclick="deleteEvent(${e.id})" style="color:#f87171;border-color:#f87171">Sil</button></td></tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

async function deleteEvent(id) {
  if (!confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;
  try { await api('/api/events/' + id, { method: 'DELETE' }); showToast('Etkinlik silindi', 'info'); loadAdminEvents(); } catch (e) { showToast(e.message, 'error'); }
}

async function loadAdminUsers() {
  const el = document.getElementById('admin-content'); if (!el) return;
  const r = await api('/api/users');
  el.innerHTML = `
  <h2 style="font-family:Cormorant Garamond,serif;font-size:2rem;font-weight:300;margin-bottom:1.5rem">Kullanıcılar</h2>
  <div class="table-wrap">
    <table class="table">
      <thead><tr><th>Kullanıcı</th><th>E-posta</th><th>Rol</th><th>Telefon</th><th>Kayıt</th><th>İşlem</th></tr></thead>
      <tbody>
        ${r.data.map(u => `<tr><td><div style="display:flex;align-items:center;gap:.75rem"><img src="${u.avatar}" style="width:36px;height:36px;border-radius:50%;object-fit:cover" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name)}&background=c9a84c&color=000'"><span>${u.full_name}</span></div></td><td style="color:var(--text2)">${u.email}</td><td><span class="status-badge ${u.role === 'admin' ? 'status-confirmed' : 'status-processing'}">${u.role}</span></td><td style="color:var(--text2)">${u.phone || '—'}</td><td style="color:var(--text2)">${formatDate(u.created_at)}</td><td>${u.role !== 'admin' ? `<button class="btn-sm" onclick="deleteUser(${u.id})" style="color:#f87171;border-color:#f87171">Sil</button>` : '—'}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

async function deleteUser(id) {
  if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
  try { await api('/api/users/' + id, { method: 'DELETE' }); showToast('Kullanıcı silindi', 'info'); loadAdminUsers(); } catch (e) { showToast(e.message, 'error'); }
}

async function loadAdminOrders() {
  const el = document.getElementById('admin-content'); if (!el) return;
  const r = await api('/api/orders');
  el.innerHTML = `
  <h2 style="font-family:Cormorant Garamond,serif;font-size:2rem;font-weight:300;margin-bottom:1.5rem">Siparişler</h2>
  <div class="table-wrap">
    <table class="table">
      <thead><tr><th>#</th><th>Müşteri</th><th>Tutar</th><th>Ödeme</th><th>Durum</th><th>Tarih</th><th>İşlem</th></tr></thead>
      <tbody>
        ${r.data.map(o => `<tr><td>#${o.id}</td><td>${o.user_name || '—'}</td><td style="color:var(--gold)">${formatPrice(o.total_amount)}</td><td><span class="status-badge status-${o.payment_status === 'paid' ? 'confirmed' : o.payment_status === 'pending' ? 'pending' : 'cancelled'}">${o.payment_status}</span></td><td><span class="status-badge status-${o.order_status}">${o.order_status}</span></td><td style="color:var(--text2)">${formatDate(o.created_at)}</td><td><button class="btn-sm btn-primary" onclick="confirmOrder(${o.id})">Onayla</button></td></tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

async function confirmOrder(id) {
  try { await api('/api/orders/' + id + '/status', { method: 'PUT', body: JSON.stringify({ order_status: 'confirmed', payment_status: 'paid' }) }); showToast('Sipariş onaylandı'); loadAdminOrders(); } catch (e) { showToast(e.message, 'error'); }
}

async function loadAdminReservations() {
  const el = document.getElementById('admin-content'); if (!el) return;
  const r = await api('/api/reservations');
  el.innerHTML = `
  <h2 style="font-family:Cormorant Garamond,serif;font-size:2rem;font-weight:300;margin-bottom:1.5rem">Rezervasyonlar</h2>
  <div class="table-wrap">
    <table class="table">
      <thead><tr><th>#</th><th>Müşteri</th><th>Etkinlik</th><th>Katılımcı</th><th>Toplam</th><th>Durum</th><th>İşlem</th></tr></thead>
      <tbody>
        ${r.data.map(res => `<tr><td>#${res.id}</td><td>${res.user_name || '—'}</td><td>${res.event_title}</td><td>${res.participant_count} kişi</td><td style="color:var(--gold)">${formatPrice(res.total_price)}</td><td><span class="status-badge status-${res.status === 'confirmed' ? 'confirmed' : res.status === 'cancelled' ? 'cancelled' : 'pending'}">${res.status}</span></td><td>${res.status === 'pending' ? `<button class="btn-sm btn-primary" onclick="confirmReservation(${res.id})">Onayla</button>` : '—'}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

async function confirmReservation(id) {
  try { await api('/api/reservations/' + id + '/confirm', { method: 'PUT' }); showToast('Rezervasyon onaylandı'); loadAdminReservations(); } catch (e) { showToast(e.message, 'error'); }
}

async function loadAdminComments() {
  const el = document.getElementById('admin-content'); if (!el) return;
  const r = await api('/api/comments?limit=50');
  el.innerHTML = `
  <h2 style="font-family:Cormorant Garamond,serif;font-size:2rem;font-weight:300;margin-bottom:1.5rem">Yorumlar</h2>
  <div class="table-wrap">
    <table class="table">
      <thead><tr><th>Kullanıcı</th><th>Yorum</th><th>Puan</th><th>Durum</th><th>İşlem</th></tr></thead>
      <tbody>
        ${r.data.map(c => `<tr><td>${c.full_name}</td><td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.comment}${c.admin_reply ? `<br><small style="color:var(--gold)">↳ ${c.admin_reply}</small>` : ''}</td><td>${c.rating ? stars(c.rating) : '—'}</td><td><span class="status-badge ${c.is_approved ? 'status-confirmed' : 'status-cancelled'}">${c.is_approved ? 'Onaylı' : 'Gizli'}</span></td><td style="display:flex;gap:.5rem"><button class="btn-sm" onclick="toggleComment(${c.id},${c.is_approved})">${c.is_approved ? 'Gizle' : 'Göster'}</button><button class="btn-sm" onclick="replyComment(${c.id})">Yanıtla</button></td></tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

async function toggleComment(id, current) {
  try { await api('/api/comments/' + id + '/approve', { method: 'PUT', body: JSON.stringify({ is_approved: !current }) }); loadAdminComments(); } catch (e) { showToast(e.message, 'error'); }
}

async function replyComment(id) {
  const reply = prompt('Yoruma yanıt yazın:'); if (!reply) return;
  try { await api('/api/comments/' + id + '/reply', { method: 'POST', body: JSON.stringify({ reply }) }); showToast('Yanıt eklendi'); loadAdminComments(); } catch (e) { showToast(e.message, 'error'); }
}

async function loadAdminCoupons() {
  const el = document.getElementById('admin-content'); if (!el) return;
  const r = await api('/api/coupons');
  el.innerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem"><h2 style="font-family:Cormorant Garamond,serif;font-size:2rem;font-weight:300">Kuponlar</h2><button class="btn btn-gold" onclick="showCouponModal()">+ Kupon Ekle</button></div>
  <div class="table-wrap">
    <table class="table">
      <thead><tr><th>Kod</th><th>İndirim</th><th>Son Tarih</th><th>Kullanım</th><th>Durum</th><th>İşlem</th></tr></thead>
      <tbody>
        ${r.data.map(c => `<tr><td style="font-family:monospace;font-size:1rem;color:var(--gold)">${c.code}</td><td>%${c.discount_percent}</td><td>${formatDate(c.expiration_date)}</td><td>${c.usage_count}/${c.usage_limit}</td><td><span class="status-badge ${c.is_active ? 'status-confirmed' : 'status-cancelled'}">${c.is_active ? 'Aktif' : 'Pasif'}</span></td><td><button class="btn-sm" onclick="deleteCoupon(${c.id})" style="color:#f87171;border-color:#f87171">Sil</button></td></tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div id="coupon-modal"></div>`;
}

async function deleteCoupon(id) {
  if (!confirm('Bu kuponu silmek istediğinize emin misiniz?')) return;
  try { await api('/api/coupons/' + id, { method: 'DELETE' }); showToast('Kupon silindi', 'info'); loadAdminCoupons(); } catch (e) { showToast(e.message, 'error'); }
}

function showCouponModal() {
  const el = document.getElementById('coupon-modal'); if (!el) return;
  el.innerHTML = `
  <div class="modal-overlay" onclick="if(event.target===this)this.remove()">
    <div class="modal">
      <div class="modal-header"><h3>Yeni Kupon</h3><button onclick="this.closest('.modal-overlay').remove()" style="background:none;border:none;color:var(--text);cursor:pointer;font-size:1.5rem">&#10005;</button></div>
      <div class="modal-body">
        <form onsubmit="createCoupon(event)">
          <div class="form-group"><label>Kupon Kodu</label><input class="form-control" id="cp-code" placeholder="WELCOME20" required style="text-transform:uppercase"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem"><div class="form-group"><label>İndirim %</label><input class="form-control" id="cp-discount" type="number" min="1" max="100" required></div><div class="form-group"><label>Kullanım Limiti</label><input class="form-control" id="cp-limit" type="number" value="100"></div></div>
          <div class="form-group"><label>Son Kullanma Tarihi</label><input class="form-control" id="cp-exp" type="date" required></div>
          <div class="form-group"><label>Min. Sipariş (₺)</label><input class="form-control" id="cp-min" type="number" value="0"></div>
          <button type="submit" class="btn btn-gold">Oluştur</button>
        </form>
      </div>
    </div>
  </div>`;
}

async function createCoupon(e) {
  e.preventDefault();
  try { await api('/api/coupons', { method: 'POST', body: JSON.stringify({ code: document.getElementById('cp-code').value, discount_percent: parseFloat(document.getElementById('cp-discount').value), expiration_date: document.getElementById('cp-exp').value, usage_limit: parseInt(document.getElementById('cp-limit').value), min_order_amount: parseFloat(document.getElementById('cp-min').value) }) }); document.querySelector('.modal-overlay').remove(); showToast('Kupon oluşturuldu'); loadAdminCoupons(); } catch (ex) { showToast(ex.message, 'error'); }
}

async function loadAdminSupport() {
  const el = document.getElementById('admin-content'); if (!el) return;
  const r = await api('/api/support');
  el.innerHTML = `
  <h2 style="font-family:Cormorant Garamond,serif;font-size:2rem;font-weight:300;margin-bottom:1.5rem">Destek Talepleri</h2>
  ${r.data.map(t => `<div style="background:var(--card);border:1px solid var(--border);border-radius:4px;margin-bottom:1rem;overflow:hidden"><div style="padding:1.25rem 1.5rem;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border)"><div><div style="font-weight:500">${t.subject}</div><div style="font-size:.75rem;color:var(--text2)">${t.full_name} – ${formatDate(t.created_at)}</div></div><div style="display:flex;gap:.75rem;align-items:center"><span class="status-badge status-${t.status === 'open' ? 'open' : t.status === 'resolved' ? 'confirmed' : 'processing'}">${t.status === 'open' ? 'Açık' : t.status === 'resolved' ? 'Çözüldü' : t.status === 'closed' ? 'Kapalı' : 'İşlemde'}</span><button class="btn-sm btn-primary" onclick="adminReplyTicket(${t.id})">Yanıtla</button>${t.status !== 'resolved' && t.status !== 'closed' ? `<button class="btn-sm" style="color:#4ade80;border-color:#4ade80" onclick="resolveTicket(${t.id})">Çözüldü</button>` : ''}<button class="btn-sm" onclick="closeTicket(${t.id})">Kapat</button></div></div><div style="padding:1.25rem 1.5rem;color:var(--text2);font-size:.875rem">${t.message}</div></div>`).join('')}`;
}

async function adminReplyTicket(id) {
  const msg = prompt('Yanıtınızı yazın:'); if (!msg) return;
  try { await api('/api/support/' + id + '/reply', { method: 'POST', body: JSON.stringify({ message: msg }) }); showToast('Yanıt gönderildi'); loadAdminSupport(); } catch (e) { showToast(e.message, 'error'); }
}

async function resolveTicket(id) {
  try { await api('/api/support/' + id + '/status', { method: 'PUT', body: JSON.stringify({ status: 'resolved' }) }); showToast('Talep çözüldü olarak işaretlendi', 'success'); loadAdminSupport(); } catch (e) { showToast(e.message, 'error'); }
}

async function closeTicket(id) {
  try { await api('/api/support/' + id + '/status', { method: 'PUT', body: JSON.stringify({ status: 'closed' }) }); showToast('Talep kapatıldı', 'info'); loadAdminSupport(); } catch (e) { showToast(e.message, 'error'); }
}

window.renderAdmin = renderAdmin; window.loadAdminDashboard = loadAdminDashboard; window.loadAdminArtworks = loadAdminArtworks; window.loadAdminEvents = loadAdminEvents; window.loadAdminUsers = loadAdminUsers; window.loadAdminOrders = loadAdminOrders; window.loadAdminReservations = loadAdminReservations; window.loadAdminComments = loadAdminComments; window.loadAdminCoupons = loadAdminCoupons; window.loadAdminSupport = loadAdminSupport; window.showArtworkModal = showArtworkModal; window.createArtwork = createArtwork; window.deleteArtwork = deleteArtwork; window.deleteEvent = deleteEvent; window.deleteUser = deleteUser; window.confirmOrder = confirmOrder; window.confirmReservation = confirmReservation; window.toggleComment = toggleComment; window.replyComment = replyComment; window.showCouponModal = showCouponModal; window.createCoupon = createCoupon; window.deleteCoupon = deleteCoupon; window.adminReplyTicket = adminReplyTicket; window.resolveTicket = resolveTicket; window.closeTicket = closeTicket;
