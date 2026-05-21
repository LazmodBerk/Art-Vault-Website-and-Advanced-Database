async function renderReservations() {
  if (!isLoggedIn()) return navigate(null, '/login');
  setContent('<div class="spinner-container"><div class="spinner"></div></div>');
  document.title = 'Rezervasyonlarım – ArtVault';
  try {
    const res = await api('/api/reservations');
    const items = res.data;
    if (!items.length) {
      setContent(`<div class="container" style="padding-top:2rem"><div class="page-header"><h1>Rezervasyonlarım</h1></div><div class="empty-state"><div class="empty-icon">📅</div><h3>Rezervasyon Bulunamadı</h3><button class="btn btn-gold" onclick="navigate(null,'/events')" style="margin-top:1.5rem">Etkinlikleri Keşfet</button></div></div>`);
      return;
    }
    setContent(`
    <div class="container" style="padding-top:2rem;padding-bottom:4rem">
      <div class="page-header"><h1>Rezervasyonlarım</h1></div>
      ${items.map(r => `
      <div style="background:var(--bg2);border:1px solid var(--border);border-radius:4px;margin-bottom:1.5rem;overflow:hidden" id="res-${r.id}">
        <div style="display:grid;grid-template-columns:120px 1fr;gap:0">
          <img src="${r.event_image}" style="width:120px;height:100%;min-height:140px;object-fit:cover" onerror="this.src='https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400'">
          <div style="padding:1.5rem">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:1rem">
              <div>
                <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:400">${r.event_title}</h3>
                <p style="color:var(--text2);font-size:.85rem">📅 ${formatDate(r.reservation_date || r.date)} ⏰ ${r.reservation_time || r.time}</p>
                <p style="color:var(--text2);font-size:.85rem">📍 ${r.location||'Online'}</p>
              </div>
              <span class="status-badge status-${r.status}">${{pending:'Bekliyor',confirmed:'Onaylandı',cancelled:'İptal'}[r.status]||r.status}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
              <div style="display:flex;gap:1.5rem">
                <div><div style="font-size:.7rem;color:var(--text2);text-transform:uppercase;letter-spacing:1px">Katılımcı</div><div style="font-weight:600">${r.participant_count} kişi</div></div>
                <div><div style="font-size:.7rem;color:var(--text2);text-transform:uppercase;letter-spacing:1px">Toplam</div><div style="font-weight:600;color:var(--gold)">${formatPrice(r.total_price)}</div></div>
              </div>
              ${r.status !== 'cancelled' ? `
              <div style="display:flex;gap:.5rem">
                <button class="btn-sm" onclick="editReservation(${r.id}, ${r.participant_count}, '${r.reservation_date || r.date}', '${r.reservation_time || r.time}')">Güncelle</button>
                <button class="btn-sm" onclick="cancelReservation(${r.id})" style="color:#f87171;border-color:#f87171">İptal Et</button>
              </div>` : ''}
            </div>
          </div>
        </div>
      </div>`).join('')}
    </div>`);
  } catch (e) { setContent(`<div class="empty-state"><h3>Hata</h3><p>${e.message}</p></div>`); }
}

async function cancelReservation(id) {
  if (!confirm('Bu rezervasyonu iptal etmek istiyor musunuz?')) return;
  try {
    await api(`/api/reservations/${id}`, { method: 'DELETE' });
    showToast('Rezervasyon iptal edildi', 'info'); renderReservations();
  } catch (e) { showToast(e.message, 'error'); }
}

async function editReservation(id, currentCount, currentDate, currentTime) {
  const count = prompt(`Yeni katılımcı sayısı (mevcut: ${currentCount}):`, currentCount);
  if (!count) return;
  const newDate = prompt(`Yeni tarih (YYYY-MM-DD formatında, mevcut: ${currentDate}):`, currentDate);
  if (!newDate) return;
  const newTime = prompt(`Yeni saat (HH:MM formatında, mevcut: ${currentTime}):`, currentTime);
  if (!newTime) return;

  if (count == currentCount && newDate == currentDate && newTime == currentTime) return;

  try {
    await api(`/api/reservations/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify({ 
        participant_count: parseInt(count),
        reservation_date: newDate,
        reservation_time: newTime
      }) 
    });
    showToast('Rezervasyon güncellendi'); renderReservations();
  } catch (e) { showToast(e.message, 'error'); }
}

window.renderReservations = renderReservations;
window.cancelReservation = cancelReservation;
window.editReservation = editReservation;
