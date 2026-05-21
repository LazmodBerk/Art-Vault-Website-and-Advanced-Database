let galleryPage = 1, galleryFilters = {};

function renderGallery() {
  setContent(`
  <div class="container" style="padding-top:2rem;padding-bottom:4rem">
    <div class="page-header"><h1>Sanat Galerisi</h1><p style="color:var(--text2);margin-top:.5rem">Özgün eserleri keşfedin</p></div>
    <div class="filters">
      <div class="filter-group" style="flex:1;min-width:200px">
        <label>Ara</label>
        <input class="form-control" id="gal-search" placeholder="Eser, sanatçı..." oninput="debounceGallery()">
      </div>
      <div class="filter-group">
        <label>Kategori</label>
        <select class="form-select" id="gal-cat" onchange="loadGallery()">
          <option value="">Tümü</option>
          <option>Abstract</option><option>Landscape</option><option>Minimalist</option>
          <option>Sculpture</option><option>Cultural</option><option>Impressionist</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Sırala</label>
        <select class="form-select" id="gal-sort" onchange="loadGallery()">
          <option value="created_at">Yeni</option>
          <option value="price">Fiyat ↑</option>
          <option value="view_count">Popüler</option>
          <option value="average_rating">Puan</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Min Fiyat</label>
        <input class="form-control" id="gal-min" type="number" placeholder="0" oninput="debounceGallery()">
      </div>
      <div class="filter-group">
        <label>Max Fiyat</label>
        <input class="form-control" id="gal-max" type="number" placeholder="999999" oninput="debounceGallery()">
      </div>
    </div>
    <div id="gallery-grid" class="grid grid-4"><div class="spinner-container"><div class="spinner"></div></div></div>
    <div id="gallery-pagination" class="pagination"></div>
  </div>`);
  loadGallery();
}

let galleryTimer;
function debounceGallery() { clearTimeout(galleryTimer); galleryTimer = setTimeout(loadGallery, 400); }

async function loadGallery(page = 1) {
  galleryPage = page;
  const search = document.getElementById('gal-search')?.value || '';
  const category = document.getElementById('gal-cat')?.value || '';
  const sort = document.getElementById('gal-sort')?.value || 'created_at';
  const min_price = document.getElementById('gal-min')?.value || '';
  const max_price = document.getElementById('gal-max')?.value || '';
  const params = new URLSearchParams({ page, limit: 12, sort });
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  if (min_price) params.set('min_price', min_price);
  if (max_price) params.set('max_price', max_price);
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
  try {
    const res = await api('/api/artworks?' + params);
    const { data, pagination } = res;
    if (!data.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🎨</div><h3>Eser Bulunamadı</h3><p>Farklı filtreler deneyin</p></div>`;
      document.getElementById('gallery-pagination').innerHTML = '';
      return;
    }
    grid.innerHTML = data.map(artworkCard).join('');
    const pg = document.getElementById('gallery-pagination');
    pg.innerHTML = '';
    for (let i = 1; i <= pagination.pages; i++) {
      const b = document.createElement('button');
      b.className = 'page-btn' + (i === page ? ' active' : '');
      b.textContent = i;
      b.onclick = () => loadGallery(i);
      pg.appendChild(b);
    }
  } catch (e) { grid.innerHTML = `<p style="color:var(--text2);grid-column:1/-1;text-align:center">${e.message}</p>`; }
}

window.renderGallery = renderGallery;
window.loadGallery = loadGallery;
window.debounceGallery = debounceGallery;
