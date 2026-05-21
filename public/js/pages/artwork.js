async function renderArtwork(id) {
  setContent('<div class="spinner-container"><div class="spinner"></div></div>');
  try {
    const res = await api(`/api/artworks/${id}`);
    const a = res.data;
    const discounted = a.discount_percent > 0 ? a.price * (1 - a.discount_percent / 100) : null;
    document.title = `${a.title} – ArtVault`;
    setContent(`
    <div class="container" style="padding-bottom:4rem">
      <div style="padding:2rem 0;color:var(--text2);font-size:.8rem">
        <a onclick="navigate(null,'/')" style="cursor:pointer">Ana Sayfa</a> / 
        <a onclick="navigate(null,'/gallery')" style="cursor:pointer">Galeri</a> / ${a.title}
      </div>
      <div class="detail-grid">
        <div class="detail-img-wrap">
          <img class="detail-img" src="${a.image_url}" alt="${a.title}" onerror="this.src='https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800'">
          <div style="display:flex;gap:.5rem;margin-top:1rem">
            <button class="btn btn-outline" onclick="addToCompare(${a.id},'artwork','${a.title.replace(/'/g,"\\'")}')">⚖ Karşılaştır</button>
          </div>
        </div>
        <div class="detail-info">
          <p class="detail-category">${a.category}</p>
          <h1 class="detail-title">${a.title}</h1>
          <p class="detail-artist">— <strong>${a.artist_name}</strong>${a.artist_country ? ', '+a.artist_country : ''}</p>
          ${a.average_rating > 0 ? `<div class="rating" style="margin-bottom:1rem"><span class="stars">${stars(a.average_rating)}</span><span style="color:var(--text2);font-size:.85rem"> ${Number(a.average_rating).toFixed(1)} puan</span></div>` : ''}
          <div>
            ${discounted ? `<div class="detail-price">${formatPrice(discounted)}</div><div style="text-decoration:line-through;color:var(--text2)">${formatPrice(a.price)}</div>` : `<div class="detail-price">${formatPrice(a.price)}</div>`}
          </div>
          <div class="detail-meta">
            <div class="meta-item"><span class="meta-label">Kategori</span><span class="meta-value">${a.category}</span></div>
            <div class="meta-item"><span class="meta-label">Stok</span><span class="meta-value">${a.stock > 0 ? a.stock + ' adet' : 'Tükendi'}</span></div>
            <div class="meta-item"><span class="meta-label">Görüntülenme</span><span class="meta-value">${a.view_count}</span></div>
            <div class="meta-item"><span class="meta-label">Sanatçı Stili</span><span class="meta-value">${a.artist_style || '—'}</span></div>
          </div>
          <p class="detail-desc">${a.description || ''}</p>
          ${a.artist_bio ? `<div style="padding:1.5rem;background:var(--bg2);border:1px solid var(--border);border-radius:4px;margin:1.5rem 0">
            <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem">
              <img src="${a.artist_avatar||''}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;border:2px solid var(--gold)" onerror="this.style.display='none'">
              <div><strong>${a.artist_name}</strong><div style="font-size:.8rem;color:var(--gold)">${a.artist_style||''}</div></div>
            </div>
            <p style="font-size:.85rem;color:var(--text2);line-height:1.7">${a.artist_bio}</p>
          </div>` : ''}
          <div class="detail-actions">
            ${a.stock > 0 ? `<button class="btn btn-gold" onclick="addToCart(${a.id})" style="flex:1">🛒 Sepete Ekle</button>` : `<button class="btn btn-outline" disabled style="flex:1">Stok Yok</button>`}
            <button class="btn btn-outline" id="fav-btn-${a.id}" onclick="toggleFavDetail(${a.id})">${a.is_favorited ? '♥ Favoride' : '♡ Favorile'}</button>
          </div>
        </div>
      </div>
      <div id="comments-section" style="margin-top:4rem">
        <h2 style="font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:300;margin-bottom:2rem">Yorumlar</h2>
        <div id="comment-list"><div class="spinner-container"><div class="spinner"></div></div></div>
        ${isLoggedIn() ? `
        <div style="margin-top:2rem;padding:2rem;background:var(--bg2);border:1px solid var(--border);border-radius:4px">
          <h4 style="margin-bottom:1.5rem">Yorum Yaz</h4>
          <div class="form-group">
            <label>Puan</label>
            <select class="form-select" id="new-rating"><option value="">Seçin</option>${[5,4,3,2,1].map(n=>`<option value="${n}">${'★'.repeat(n)} ${n}/5</option>`).join('')}</select>
          </div>
          <div class="form-group">
            <label>Yorumunuz</label>
            <textarea class="form-control" id="new-comment" rows="4" placeholder="Bu eser hakkındaki düşüncelerinizi paylaşın..."></textarea>
          </div>
          <button class="btn btn-gold" onclick="submitComment(${a.id},'artwork')">Yorum Gönder</button>
        </div>` : `<div style="text-align:center;padding:2rem;color:var(--text2)">Yorum yapmak için <a onclick="navigate(null,'/login')" style="color:var(--gold);cursor:pointer">giriş yapın</a>.</div>`}
      </div>
      ${a.related && a.related.length ? `
      <div style="margin-top:4rem">
        <h2 style="font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:300;margin-bottom:2rem">Benzer Eserler</h2>
        <div class="grid grid-4">${a.related.map(artworkCard).join('')}</div>
      </div>` : ''}
    </div>`);
    loadComments('artwork', id);
  } catch (e) { setContent(`<div class="empty-state"><h3>Eser Bulunamadı</h3><p>${e.message}</p></div>`); }
}

async function loadComments(type, id, sort = 'newest') {
  const el = document.getElementById('comment-list');
  if (!el) return;
  const param = type === 'artwork' ? `artwork_id=${id}` : `event_id=${id}`;
  const res = await api(`/api/comments?${param}&sort=${sort}`);
  if (!res.data.length) { el.innerHTML = `<div class="empty-state" style="padding:2rem"><p>Henüz yorum yok</p></div>`; return; }
  el.innerHTML = `
  <div style="display:flex;gap:.5rem;margin-bottom:1.5rem;flex-wrap:wrap">
    ${[['newest','En Yeni'],['highest','En Yüksek Puan'],['helpful','En Faydalı']].map(([v,l])=>`<button class="btn-sm ${sort===v?'btn-primary':''}" onclick="loadComments('${type}',${id},'${v}')">${l}</button>`).join('')}
  </div>
  ${res.data.map(c=>`
  <div class="review-card">
    <div class="review-header">
      <div class="review-user">
        <img class="review-avatar" src="${c.avatar||'/images/default-avatar.png'}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(c.full_name)}&background=c9a84c&color=000'">
        <div>
          <div class="review-name">${c.full_name} ${c.is_verified?'<span class="verified-badge">✓ Doğrulanmış</span>':''}</div>
          <div class="review-date">${formatDate(c.created_at)}</div>
        </div>
      </div>
      ${c.rating?`<div class="stars">${stars(c.rating)}</div>`:''}
    </div>
    <p class="review-text">${c.comment}</p>
    ${c.admin_reply?`<div class="admin-reply"><div class="admin-reply-tag">✦ ArtVault Yanıtı</div><p style="font-size:.85rem;color:var(--text2)">${c.admin_reply}</p></div>`:''}
    <div style="margin-top:1rem;display:flex;gap:.5rem;align-items:center;">
      <span style="font-weight:600;font-size:1.1rem;margin-right:.5rem;color:var(--gold)">Puan: ${c.score || 0}</span>
      <button class="btn-sm" style="border-radius:50%;width:32px;height:32px;padding:0;display:flex;align-items:center;justify-content:center" onclick="voteComment('${type}', ${id}, ${c.id}, 1)" title="Artı Puan">👍</button>
      <button class="btn-sm" style="border-radius:50%;width:32px;height:32px;padding:0;display:flex;align-items:center;justify-content:center" onclick="voteComment('${type}', ${id}, ${c.id}, -1)" title="Eksi Puan">👎</button>
    </div>
  </div>`).join('')}`;
}

async function voteComment(type, targetId, commentId, voteValue) {
  if (!isLoggedIn()) return navigate(null, '/login');
  try {
    await api(`/api/comments/${commentId}/vote`, { 
      method: 'POST',
      body: JSON.stringify({ vote: voteValue })
    });
    showToast('Oyunuz kaydedildi');
    loadComments(type, targetId);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function submitComment(targetId, type) {
  const rating = document.getElementById('new-rating')?.value;
  const comment = document.getElementById('new-comment')?.value?.trim();
  if (!comment) return showToast('Yorum metni gerekli', 'error');
  try {
    const body = { comment };
    if (rating) body.rating = parseInt(rating);
    if (type === 'artwork') body.artwork_id = targetId;
    else body.event_id = targetId;
    await api('/api/comments', { method: 'POST', body: JSON.stringify(body) });
    showToast('Yorumunuz eklendi');
    loadComments(type, targetId);
    document.getElementById('new-comment').value = '';
  } catch (e) { 
    alert('HATA: ' + e.message); 
  }
}

async function toggleFavDetail(id) {
  if (!isLoggedIn()) return navigate(null, '/login');
  try {
    const check = await api(`/api/favorites/check/${id}`);
    if (check.is_favorited) {
      await api(`/api/favorites/${id}`, { method: 'DELETE' });
      document.getElementById(`fav-btn-${id}`).textContent = '♡ Favorile';
      showToast('Favorilerden kaldırıldı', 'info');
    } else {
      await api(`/api/favorites/${id}`, { method: 'POST' });
      document.getElementById(`fav-btn-${id}`).textContent = '♥ Favoride';
      showToast('Favorilere eklendi');
    }
  } catch (e) { showToast(e.message, 'error'); }
}

function addToCompare(id, type, title) {
  let list = JSON.parse(localStorage.getItem('compare_' + type) || '[]');
  if (list.includes(id)) return showToast('Zaten karşılaştırma listesinde', 'info');
  if (list.length >= 3) return showToast('En fazla 3 eser karşılaştırabilirsiniz', 'warning');
  list.push(id);
  localStorage.setItem('compare_' + type, JSON.stringify(list));
  showToast(`"${title}" karşılaştırma listesine eklendi`);
}

window.renderArtwork = renderArtwork;
window.loadComments = loadComments;
window.submitComment = submitComment;
window.toggleFavDetail = toggleFavDetail;
window.addToCompare = addToCompare;
window.voteComment = voteComment;
