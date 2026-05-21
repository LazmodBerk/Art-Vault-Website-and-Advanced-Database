function renderEvents() {
  setContent(`
  <div class="container" style="padding-top:2rem;padding-bottom:4rem">
    <div class="page-header"><h1>Atölyeler & Etkinlikler</h1><p style="color:var(--text2);margin-top:.5rem">Sanat atölyelerine katılın, yeni beceriler kazanın</p></div>
    <div class="filters">
      <div class="filter-group" style="flex:1;min-width:200px">
        <label>Ara</label>
        <input class="form-control" id="ev-search" placeholder="Etkinlik, eğitmen..." oninput="debounceEvents()">
      </div>
      <div class="filter-group">
        <label>Kategori</label>
        <select class="form-select" id="ev-cat" onchange="loadEvents()">
          <option value="">Tümü</option><option value="workshop">Atölye</option><option value="masterclass">Masterclass</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Seviye</label>
        <select class="form-select" id="ev-lvl" onchange="loadEvents()">
          <option value="">Tümü</option><option value="beginner">Başlangıç</option>
          <option value="intermediate">Orta</option><option value="advanced">İleri</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Sırala</label>
        <select class="form-select" id="ev-sort" onchange="loadEvents()">
          <option value="date">Tarih</option><option value="price">Fiyat</option><option value="capacity">Kapasite</option>
        </select>
      </div>
    </div>
    <div id="events-grid" class="grid grid-3"><div class="spinner-container"><div class="spinner"></div></div></div>
    <div id="events-pagination" class="pagination"></div>
  </div>`);
  loadEvents();
}

let evTimer;
function debounceEvents() { clearTimeout(evTimer); evTimer = setTimeout(loadEvents, 400); }

async function loadEvents(page = 1) {
  const search = document.getElementById('ev-search')?.value || '';
  const category = document.getElementById('ev-cat')?.value || '';
  const level = document.getElementById('ev-lvl')?.value || '';
  const sort = document.getElementById('ev-sort')?.value || 'date';
  const params = new URLSearchParams({ page, limit: 9, sort });
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  if (level) params.set('level', level);
  const grid = document.getElementById('events-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
  try {
    const res = await api('/api/events?' + params);
    const { data, pagination } = res;
    if (!data.length) { grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🎨</div><h3>Etkinlik Bulunamadı</h3></div>`; return; }
    grid.innerHTML = data.map(eventCard).join('');
    const pg = document.getElementById('events-pagination');
    pg.innerHTML = '';
    for (let i = 1; i <= pagination.pages; i++) {
      const b = document.createElement('button');
      b.className = 'page-btn' + (i === page ? ' active' : '');
      b.textContent = i; b.onclick = () => loadEvents(i); pg.appendChild(b);
    }
  } catch (e) { grid.innerHTML = `<p style="color:var(--text2);grid-column:1/-1;text-align:center">${e.message}</p>`; }
}

window.renderEvents = renderEvents;
window.loadEvents = loadEvents;
window.debounceEvents = debounceEvents;
