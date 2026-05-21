async function renderCompare() {
  document.title = 'Karşılaştır – ArtVault';
  const artIds = JSON.parse(localStorage.getItem('compare_artwork') || '[]');
  const evIds = JSON.parse(localStorage.getItem('compare_event') || '[]');

  setContent(`
  <div class="container" style="padding-top:2rem;padding-bottom:4rem">
    <div class="page-header"><h1>Karşılaştırma</h1></div>
    <div style="display:flex;gap:1rem;margin-bottom:2rem">
      <button class="btn btn-outline" onclick="showCompare('artwork')" id="tab-artwork">🎨 Eserler (${artIds.length})</button>
      <button class="btn btn-outline" onclick="showCompare('event')" id="tab-event">📅 Etkinlikler (${evIds.length})</button>
      <button class="btn btn-sm" onclick="clearCompare()" style="margin-left:auto;color:#f87171;border-color:#f87171">Listeyi Temizle</button>
    </div>
    <div id="compare-result"><div class="spinner-container"><div class="spinner"></div></div></div>
  </div>`);
  showCompare('artwork');
}

async function showCompare(type) {
  const ids = JSON.parse(localStorage.getItem(`compare_${type}`) || '[]');
  const el = document.getElementById('compare-result');
  if (!el) return;

  document.getElementById('tab-artwork')?.classList.toggle('btn-gold', type === 'artwork');
  document.getElementById('tab-event')?.classList.toggle('btn-gold', type === 'event');

  if (!ids.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚖</div><h3>Karşılaştırma Listesi Boş</h3><p>${type==='artwork'?'Eserleri':'Etkinlikleri'} incelerken <strong>"Karşılaştır"</strong> butonuna tıklayın</p></div>`;
    return;
  }

  el.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
  try {
    if (type === 'artwork') {
      const items = await Promise.all(ids.map(id => api(`/api/artworks/${id}`).then(r => r.data)));
      const fields = [['Başlık','title'],['Sanatçı','artist_name'],['Kategori','category'],['Fiyat','price'],['Puan','average_rating'],['Görüntülenme','view_count'],['Stok','stock']];
      el.innerHTML = `
      <div class="table-wrap">
        <table class="compare-table">
          <thead><tr><th>Özellik</th>${items.map(a=>`<th><img class="compare-img" src="${a.image_url}" onerror="this.src='https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300'"><br>${a.title}</th>`).join('')}</tr></thead>
          <tbody>${fields.map(([label,key])=>`
          <tr><td><strong>${label}</strong></td>${items.map(a=>{
            let v = a[key];
            if (key==='price') v = formatPrice(v);
            else if (key==='average_rating') v = v>0?`<span class="stars">${stars(v)}</span> ${Number(v).toFixed(1)}`:'—';
            return `<td>${v||'—'}</td>`;
          }).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>
      <div style="text-align:right;margin-top:1rem">
        <button class="btn btn-sm" onclick="localStorage.removeItem('compare_artwork');renderCompare()">Listeyi Temizle</button>
      </div>`;
    } else {
      const items = await Promise.all(ids.map(id => api(`/api/events/${id}`).then(r => r.data)));
      const fields = [['Başlık','title'],['Eğitmen','instructor'],['Tarih','date'],['Saat','time'],['Fiyat','price'],['Kapasite','capacity'],['Dolu','reserved_count'],['Süre','duration_hours'],['Seviye','level']];
      el.innerHTML = `
      <div class="table-wrap">
        <table class="compare-table">
          <thead><tr><th>Özellik</th>${items.map(e=>`<th><img class="compare-img" src="${e.image_url}" onerror="this.src='https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=300'"><br>${e.title}</th>`).join('')}</tr></thead>
          <tbody>${fields.map(([label,key])=>`
          <tr><td><strong>${label}</strong></td>${items.map(e=>{
            let v = e[key];
            if (key==='price') v = formatPrice(v);
            else if (key==='date') v = formatDate(v);
            else if (key==='duration_hours') v = v+' saat';
            else if (key==='level') v = {beginner:'Başlangıç',intermediate:'Orta',advanced:'İleri'}[v]||v;
            return `<td>${v||'—'}</td>`;
          }).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>
      <div style="text-align:right;margin-top:1rem">
        <button class="btn btn-sm" onclick="localStorage.removeItem('compare_event');renderCompare()">Listeyi Temizle</button>
      </div>`;
    }
  } catch (e) { el.innerHTML = `<p style="color:var(--text2);text-align:center">${e.message}</p>`; }
}

function clearCompare() {
  localStorage.removeItem('compare_artwork');
  localStorage.removeItem('compare_event');
  renderCompare();
}

window.renderCompare = renderCompare;
window.showCompare = showCompare;
window.clearCompare = clearCompare;
