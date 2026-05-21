async function renderEventDetail(id) {
  setContent('<div class="spinner-container"><div class="spinner"></div></div>');
  try {
    const res = await api(`/api/events/${id}`);
    const e = res.data;
    const fillPct = Math.round(e.reserved_count / e.capacity * 100);
    document.title = `${e.title} – ArtVault`;
    setContent(`
    <div class="container" style="padding-bottom:4rem">
      <div style="padding:2rem 0;color:var(--text2);font-size:.8rem">
        <a onclick="navigate(null,'/')" style="cursor:pointer">Ana Sayfa</a> / 
        <a onclick="navigate(null,'/events')" style="cursor:pointer">Etkinlikler</a> / ${e.title}
      </div>
      <div class="detail-grid">
        <div>
          <img src="${e.image_url}" alt="${e.title}" style="width:100%;border-radius:4px;object-fit:cover;max-height:500px" onerror="this.src='https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800'">
          <div style="margin-top:2rem;padding:1.5rem;background:var(--bg2);border:1px solid var(--border);border-radius:4px">
            <h3 style="margin-bottom:1rem;font-family:'Cormorant Garamond',serif;font-size:1.4rem">Etkinlik Detayları</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
              ${[['📅','Tarih',formatDate(e.date)],['⏰','Saat',e.time],['⏱','Süre',e.duration_hours+' saat'],['👤','Eğitmen',e.instructor],['📍','Konum',e.location||'Online'],['🎯','Seviye',e.level==='beginner'?'Başlangıç':e.level==='intermediate'?'Orta':'İleri']].map(([icon,label,val])=>`
              <div><div style="font-size:.7rem;color:var(--text2);letter-spacing:1px;text-transform:uppercase">${icon} ${label}</div><div style="margin-top:.25rem;font-weight:500">${val}</div></div>`).join('')}
            </div>
          </div>
        </div>
        <div class="detail-info">
          <span class="level-badge level-${e.level}">${e.level==='beginner'?'Başlangıç':e.level==='intermediate'?'Orta':'İleri'}</span>
          <h1 class="detail-title" style="margin-top:.75rem">${e.title}</h1>
          <p style="color:var(--text2);font-size:.9rem;margin-bottom:1.5rem">Eğitmen: <strong>${e.instructor}</strong></p>
          <div class="detail-price">${formatPrice(e.price)} <span style="font-size:.9rem;font-weight:400;color:var(--text2)">/ kişi</span></div>
          <p class="detail-desc">${e.description || ''}</p>
          <div style="margin:1.5rem 0">
            <div style="display:flex;justify-content:space-between;margin-bottom:.5rem">
              <span style="font-size:.8rem;color:var(--text2)">Kontenjan Durumu</span>
              <span style="font-size:.8rem;font-weight:600">${e.reserved_count}/${e.capacity} dolu</span>
            </div>
            <div class="capacity-bar" style="height:8px"><div class="capacity-fill" style="width:${fillPct}%;background:${fillPct>=90?'#f87171':fillPct>=70?'#fbbf24':'var(--gold)'}"></div></div>
            <p style="font-size:.75rem;color:var(--text2);margin-top:.5rem">${e.available_spots} kişilik yer mevcut</p>
          </div>
          ${!e.is_full ? `
          <div style="padding:1.5rem;background:var(--bg2);border:1px solid var(--border);border-radius:4px;margin:1.5rem 0" id="reservation-form">
            <h4 style="margin-bottom:1rem">Rezervasyon Yap</h4>
            <div class="form-group">
              <label>Katılımcı Sayısı</label>
              <select class="form-select" id="participant-count" onchange="updateResTotal(${e.price})">
                ${Array.from({length:Math.min(e.available_spots,10)},(_,i)=>`<option value="${i+1}">${i+1} kişi</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Tarih</label>
              <input type="date" class="form-control" id="reservation-date" value="${e.date}" min="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label>Saat</label>
              <input type="time" class="form-control" id="reservation-time" value="${e.time}">
            </div>
            <div id="res-total" style="padding:1rem;background:var(--bg);border:1px solid var(--border);border-radius:2px;margin-bottom:1rem">
              <div style="display:flex;justify-content:space-between"><span>Toplam</span><span style="color:var(--gold);font-weight:600">${formatPrice(e.price)}</span></div>
            </div>
            <button class="btn btn-gold" style="width:100%" onclick="makeReservation(${e.id})">Rezervasyon Yap</button>
            ${!isLoggedIn()?'<p style="color:var(--text2);font-size:.8rem;text-align:center;margin-top:.75rem">Rezervasyon için <a onclick="navigate(null,\'/login\')" style="color:var(--gold);cursor:pointer">giriş yapın</a></p>':''}
          </div>` : `<div style="padding:1.5rem;background:#3d0d0d;border:1px solid #7b2d2d;border-radius:4px;text-align:center;color:#f87171;font-weight:600">Bu etkinlik dolmuştur</div>`}
          <div style="margin-top:1.5rem">
            <button class="btn btn-outline" style="width:100%" onclick="addToCompare(${e.id},'event','${e.title.replace(/'/g,"\\'")}')">⚖ Karşılaştır</button>
          </div>
        </div>
      </div>
      <div id="event-comments" style="margin-top:4rem">
        <h2 style="font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:300;margin-bottom:2rem">Katılımcı Yorumları</h2>
        <div id="comment-list"><div class="spinner-container"><div class="spinner"></div></div></div>
        ${isLoggedIn()?`
        <div style="margin-top:2rem;padding:2rem;background:var(--bg2);border:1px solid var(--border);border-radius:4px">
          <h4 style="margin-bottom:1.5rem">Değerlendirme Yaz</h4>
          <div class="form-group"><label>Puan</label><select class="form-select" id="new-rating">${[5,4,3,2,1].map(n=>`<option value="${n}">${'★'.repeat(n)}</option>`).join('')}</select></div>
          <div class="form-group"><label>Yorumunuz</label><textarea class="form-control" id="new-comment" rows="4" placeholder="Deneyiminizi paylaşın..."></textarea></div>
          <button class="btn btn-gold" onclick="submitComment(${e.id},'event')">Gönder</button>
        </div>`:`<p style="color:var(--text2);text-align:center;padding:2rem">Yorum için <a onclick="navigate(null,'/login')" style="color:var(--gold);cursor:pointer">giriş yapın</a></p>`}
      </div>
    </div>`);
    loadComments('event', id);
  } catch (err) { setContent(`<div class="empty-state"><h3>Etkinlik Bulunamadı</h3><p>${err.message}</p></div>`); }
}

function updateResTotal(price) {
  const count = parseInt(document.getElementById('participant-count')?.value || 1);
  const el = document.getElementById('res-total');
  if (el) el.innerHTML = `<div style="display:flex;justify-content:space-between"><span>Toplam (${count} kişi)</span><span style="color:var(--gold);font-weight:600">${formatPrice(price * count)}</span></div>`;
}

async function makeReservation(eventId) {
  if (!isLoggedIn()) return navigate(null, '/login');
  const count = parseInt(document.getElementById('participant-count')?.value || 1);
  const date = document.getElementById('reservation-date')?.value;
  const time = document.getElementById('reservation-time')?.value;
  try {
    await api('/api/reservations', { method: 'POST', body: JSON.stringify({ event_id: eventId, participant_count: count, reservation_date: date, reservation_time: time }) });
    showToast('Rezervasyonunuz alındı! Onay için bekleyin.');
    setTimeout(() => navigate(null, '/reservations'), 1500);
  } catch (e) { showToast(e.message, 'error'); }
}

window.renderEventDetail = renderEventDetail;
window.updateResTotal = updateResTotal;
window.makeReservation = makeReservation;
