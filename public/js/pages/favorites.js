async function renderFavorites() {
  if (!isLoggedIn()) return navigate(null, '/login');
  setContent('<div class="spinner-container"><div class="spinner"></div></div>');
  try {
    const res = await api('/api/favorites');
    document.title = 'Favorilerim – ArtVault';
    if (!res.data.length) {
      setContent(`<div class="container" style="padding-top:2rem"><div class="page-header"><h1>Favorilerim</h1></div><div class="empty-state"><div class="empty-icon">♡</div><h3>Liste Boş</h3><p>Henüz favorilerinize bir eser eklemediniz.</p><button class="btn btn-gold" onclick="navigate(null,'/gallery')" style="margin-top:1.5rem">Galeriyi Keşfet</button></div></div>`);
      return;
    }
    setContent(`
    <div class="container" style="padding-top:2rem;padding-bottom:4rem">
      <div class="page-header">
        <h1>Favorilerim</h1>
        <p style="color:var(--text2);margin-top:.5rem">${res.data.length} eser</p>
      </div>
      <div class="grid grid-4">${res.data.map(f => `
        <div class="card">
          <img class="card-img" src="${f.image_url}" alt="${f.title}" onclick="navigate(null,'/artwork/${f.artwork_id}')" style="cursor:pointer" onerror="this.src='https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600'">
          <div class="card-body">
            <p class="card-tag">${f.category}</p>
            <h3 class="card-title">${f.title}</h3>
            <p class="card-artist">— ${f.artist_name}</p>
          </div>
          <div class="card-footer">
            <span class="card-price">${formatPrice(f.price)}</span>
            <div class="card-actions">
              <button class="btn-sm" onclick="removeFav(${f.artwork_id},this.closest('.card'))">♥ Kaldır</button>
              <button class="btn-sm btn-primary" onclick="addToCart(${f.artwork_id})">Sepet</button>
            </div>
          </div>
        </div>`).join('')}
      </div>
    </div>`);
  } catch (e) { setContent(`<div class="empty-state"><h3>Hata</h3><p>${e.message}</p></div>`); }
}

async function removeFav(id, el) {
  try {
    await api(`/api/favorites/${id}`, { method: 'DELETE' });
    el.remove(); showToast('Favorilerden kaldırıldı', 'info');
  } catch (e) { showToast(e.message, 'error'); }
}

window.renderFavorites = renderFavorites;
window.removeFav = removeFav;
