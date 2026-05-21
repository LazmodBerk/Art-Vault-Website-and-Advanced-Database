function getContent() { return document.getElementById('page-content'); }
function setContent(html) { const el = getContent(); if (el) el.innerHTML = html; }

function renderHome() {
  setContent(`
  <div style="padding-top:0">
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <p class="hero-tag">Premium Sanat Deneyimi</p>
        <h1>Sanatın <em>Kalbinde</em><br>Bir Yolculuk</h1>
        <p>Dünyanın dört bir yanından sanatçıların eserlerini keşfedin, atölyelere katılın ve sanatla yaşayın.</p>
        <div class="hero-actions">
          <button class="btn btn-gold" onclick="navigate(null,'/gallery')">Galeriyi Keşfet</button>
          <button class="btn btn-outline" onclick="navigate(null,'/events')">Etkinlikler</button>
        </div>
      </div>
    </section>
    <div id="home-sections"><div class="spinner-container"><div class="spinner"></div></div></div>
  </div>`);
  loadHomeSections();
}

async function loadHomeSections() {
  try {
    const [artRes, evRes] = await Promise.all([
      api('/api/artworks?featured=1&limit=6'),
      api('/api/events?limit=3')
    ]);
    const featured = artRes.data || [];
    const events = evRes.data || [];
    document.getElementById('home-sections').innerHTML = `
    <section class="section container">
      <div class="section-header">
        <span class="section-tag">Seçkili Eserler</span>
        <h2>Öne Çıkan Sanat Eserleri</h2>
      </div>
      <div class="grid grid-3">${featured.map(artworkCard).join('')}</div>
      <div style="text-align:center;margin-top:3rem">
        <button class="btn btn-outline" onclick="navigate(null,'/gallery')">Tüm Eserleri Gör</button>
      </div>
    </section>
    <section class="section" style="background:var(--bg2);border-top:1px solid var(--border);border-bottom:1px solid var(--border)">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Atölyeler & Etkinlikler</span>
          <h2>Yaklaşan Etkinlikler</h2>
        </div>
        <div class="grid grid-3">${events.map(eventCard).join('')}</div>
        <div style="text-align:center;margin-top:3rem">
          <button class="btn btn-outline" onclick="navigate(null,'/events')">Tüm Etkinlikler</button>
        </div>
      </div>
    </section>
    <section class="section container">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center">
        <div>
          <span class="section-tag">Neden ArtVault?</span>
          <h2 style="font-family:'Cormorant Garamond',serif;font-size:2.5rem;font-weight:300;margin:1rem 0">Premium Sanat<br><em style="color:var(--gold);font-style:italic">Deneyimi</em></h2>
          <p style="color:var(--text2);line-height:1.8;margin-bottom:2rem">Türkiye'nin ve dünyanın önde gelen sanatçılarıyla buluşturan platformumuzda özgün eserler satın alın, atölyelere katılın ve sanat dünyanızı genişletin.</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
            ${[['🎨','200+ Eser','Özgün sanat eserleri'],['👨‍🎨','50+ Sanatçı','Usta isimler'],['🏛️','30+ Atölye','Her ay yeni etkinlik'],['⭐','4.9/5','Müşteri memnuniyeti']].map(([icon,title,desc])=>`
            <div style="padding:1.5rem;background:var(--bg2);border:1px solid var(--border);border-radius:4px">
              <div style="font-size:2rem;margin-bottom:.5rem">${icon}</div>
              <div style="font-weight:600;margin-bottom:.25rem">${title}</div>
              <div style="font-size:.8rem;color:var(--text2)">${desc}</div>
            </div>`).join('')}
          </div>
        </div>
        <div style="position:relative">
          <img src="https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=600" alt="Gallery" style="width:100%;border-radius:4px;object-fit:cover;aspect-ratio:4/3">
          <div style="position:absolute;bottom:-1.5rem;left:-1.5rem;background:var(--gold);color:#000;padding:1.5rem 2rem;border-radius:4px">
            <div style="font-size:2rem;font-weight:700">500+</div>
            <div style="font-size:.8rem;font-weight:600">Mutlu Koleksiyoner</div>
          </div>
        </div>
      </div>
    </section>`;
  } catch(e) { document.getElementById('home-sections').innerHTML = `<p style="text-align:center;color:var(--text2);padding:2rem">Yüklenemedi: ${e.message}</p>`; }
}

function artworkCard(a) {
  const discounted = a.discount_percent > 0 ? a.price * (1 - a.discount_percent / 100) : null;
  return `<div class="card" onclick="navigate(null,'/artwork/${a.id}')">
    ${a.discount_percent > 0 ? `<div style="position:relative"><img class="card-img" src="${a.image_url}" alt="${a.title}" onerror="this.src='https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600'">
    <span style="position:absolute;top:.75rem;right:.75rem;background:var(--gold);color:#000;padding:.2rem .6rem;font-size:.7rem;border-radius:2px;font-weight:700">-%${a.discount_percent}</span></div>`
    : `<img class="card-img" src="${a.image_url}" alt="${a.title}" onerror="this.src='https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600'">`}
    <div class="card-body">
      <p class="card-tag">${a.category}</p>
      <h3 class="card-title">${a.title}</h3>
      <p class="card-artist">— ${a.artist_name || 'Sanatçı'}</p>
      ${a.average_rating > 0 ? `<div class="rating"><span class="stars">${stars(a.average_rating)}</span><span style="font-size:.75rem;color:var(--text2)">${Number(a.average_rating).toFixed(1)}</span></div>` : ''}
    </div>
    <div class="card-footer">
      <div>${discounted ? `<span class="card-price">${formatPrice(discounted)}</span> <span style="font-size:.8rem;color:var(--text2);text-decoration:line-through">${formatPrice(a.price)}</span>` : `<span class="card-price">${formatPrice(a.price)}</span>`}</div>
      <div class="card-actions">
        <button class="btn-sm" onclick="event.stopPropagation();toggleFav(${a.id},this)">♡</button>
        <button class="btn-sm btn-primary" onclick="event.stopPropagation();addToCart(${a.id})">Sepet</button>
      </div>
    </div>
  </div>`;
}

function eventCard(e) {
  const fillPct = Math.round(e.reserved_count / e.capacity * 100);
  return `<div class="event-card" onclick="navigate(null,'/event/${e.id}')">
    <img class="event-img" src="${e.image_url}" alt="${e.title}" onerror="this.src='https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600'">
    <div class="event-body">
      <span class="level-badge level-${e.level}">${e.level==='beginner'?'Başlangıç':e.level==='intermediate'?'Orta':'İleri'}</span>
      <h3 class="card-title" style="margin-top:.75rem">${e.title}</h3>
      <div class="event-meta">
        <span class="event-meta-item">📅 ${formatDate(e.date)}</span>
        <span class="event-meta-item">⏰ ${e.time}</span>
        <span class="event-meta-item">👤 ${e.instructor}</span>
        <span class="event-meta-item">📍 ${e.location ? e.location.split(',')[0] : 'Online'}</span>
      </div>
      <div style="margin-top:1rem">
        <div style="display:flex;justify-content:space-between;font-size:.75rem;color:var(--text2);margin-bottom:.4rem">
          <span>Kontenjan</span><span>${e.reserved_count}/${e.capacity}</span>
        </div>
        <div class="capacity-bar"><div class="capacity-fill" style="width:${fillPct}%"></div></div>
      </div>
    </div>
    <div class="event-footer">
      <span class="card-price">${formatPrice(e.price)}</span>
      <button class="btn btn-gold btn-sm" onclick="event.stopPropagation();navigate(null,'/event/${e.id}')">${e.is_full ? 'Dolu' : 'Rezervasyon'}</button>
    </div>
  </div>`;
}

async function toggleFav(id, btn) {
  if (!isLoggedIn()) return navigate(null, '/login');
  try {
    const check = await api(`/api/favorites/check/${id}`);
    if (check.is_favorited) {
      await api(`/api/favorites/${id}`, { method: 'DELETE' });
      btn.textContent = '♡'; showToast('Favorilerden kaldırıldı', 'info');
    } else {
      await api(`/api/favorites/${id}`, { method: 'POST' });
      btn.textContent = '♥'; showToast('Favorilere eklendi');
    }
  } catch (e) { showToast(e.message, 'error'); }
}

async function addToCart(id) {
  if (!isLoggedIn()) return navigate(null, '/login');
  try {
    await api('/api/cart', { method: 'POST', body: JSON.stringify({ artwork_id: id, quantity: 1 }) });
    showToast('Sepete eklendi'); updateCartCount();
  } catch (e) { showToast(e.message, 'error'); }
}

window.renderHome = renderHome;
window.artworkCard = artworkCard;
window.eventCard = eventCard;
window.toggleFav = toggleFav;
window.addToCart = addToCart;
