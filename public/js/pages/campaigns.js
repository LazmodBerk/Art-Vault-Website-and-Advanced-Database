async function renderCampaigns() {
  document.title = 'Fırsatlar – ArtVault';
  setContent(`
  <div class="container" style="padding-top:2rem;padding-bottom:4rem">
    <div class="page-header">
      <h1 style="font-family:'Cormorant Garamond',serif;font-size:3rem;color:var(--gold)">Özel Fırsatlar</h1>
      <p style="color:var(--text2);margin-top:.5rem">İndirimli sanat eserleri ve atölyeler. Premium üyeler için ekstra %10 indirim uygulanır!</p>
    </div>
    <div id="campaign-content"><div class="spinner-container"><div class="spinner"></div></div></div>
  </div>`);

  try {
    const [artRes, evRes] = await Promise.all([
      api('/api/artworks?discounted=1&limit=10'),
      api('/api/events?discounted=1&limit=10')
    ]);

    const artworks = artRes.data || [];
    const events = evRes.data || [];
    const isPremium = getUser()?.is_premium;

    if (!artworks.length && !events.length) {
      document.getElementById('campaign-content').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎁</div>
          <h3>Şu an aktif fırsat bulunmamaktadır</h3>
          <p>Daha sonra tekrar kontrol edebilirsiniz.</p>
        </div>`;
      return;
    }

    let html = '';

    if (artworks.length) {
      html += `
      <section class="section">
        <h2 style="margin-bottom:2rem;font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:400">İndirimli Eserler</h2>
        <div class="grid grid-3">
          ${artworks.map(a => {
            const currentDiscount = a.discount_percent;
            const finalDiscount = isPremium ? currentDiscount + 10 : currentDiscount;
            const finalPrice = a.price * (1 - finalDiscount / 100);
            return `
            <div class="card" onclick="navigate(null,'/artwork/${a.id}')">
              <div style="position:relative">
                <img class="card-img" src="${a.image_url}" alt="${a.title}" onerror="this.src='https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600'">
                <span style="position:absolute;top:.75rem;right:.75rem;background:#f87171;color:#fff;padding:.3rem .6rem;font-size:.8rem;border-radius:2px;font-weight:700">%${finalDiscount} İndirim${isPremium ? ' (Premium)' : ''}</span>
              </div>
              <div class="card-body">
                <p class="card-tag">${a.category}</p>
                <h3 class="card-title">${a.title}</h3>
                <p class="card-artist">— ${a.artist_name || 'Sanatçı'}</p>
              </div>
              <div class="card-footer">
                <div>
                  <span class="card-price" style="color:var(--gold)">${formatPrice(finalPrice)}</span> 
                  <span style="font-size:.8rem;color:var(--text2);text-decoration:line-through">${formatPrice(a.price)}</span>
                </div>
                <div class="card-actions">
                  <button class="btn-sm btn-primary" onclick="event.stopPropagation();addToCart(${a.id})">Sepet</button>
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </section>`;
    }

    if (events.length) {
      html += `
      <section class="section" style="margin-top:2rem">
        <h2 style="margin-bottom:2rem;font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:400">İndirimli Etkinlikler</h2>
        <div class="grid grid-3">
          ${events.map(e => {
            const currentDiscount = e.discount_percent;
            const finalDiscount = isPremium ? currentDiscount + 10 : currentDiscount;
            const finalPrice = e.price * (1 - finalDiscount / 100);
            return `
            <div class="event-card" onclick="navigate(null,'/event/${e.id}')">
              <div style="position:relative">
                <img class="event-img" src="${e.image_url}" alt="${e.title}" onerror="this.src='https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600'">
                <span style="position:absolute;top:.75rem;right:.75rem;background:#f87171;color:#fff;padding:.3rem .6rem;font-size:.8rem;border-radius:2px;font-weight:700">%${finalDiscount} İndirim${isPremium ? ' (Premium)' : ''}</span>
              </div>
              <div class="event-body">
                <span class="level-badge level-${e.level}">${e.level==='beginner'?'Başlangıç':e.level==='intermediate'?'Orta':'İleri'}</span>
                <h3 class="card-title" style="margin-top:.75rem">${e.title}</h3>
                <div class="event-meta">
                  <span class="event-meta-item">📅 ${formatDate(e.date)}</span>
                  <span class="event-meta-item">⏰ ${e.time}</span>
                </div>
              </div>
              <div class="event-footer">
                <div>
                  <span class="card-price" style="color:var(--gold)">${formatPrice(finalPrice)}</span> 
                  <span style="font-size:.8rem;color:var(--text2);text-decoration:line-through">${formatPrice(e.price)}</span>
                </div>
                <button class="btn btn-gold btn-sm" onclick="event.stopPropagation();navigate(null,'/event/${e.id}')">${e.is_full ? 'Dolu' : 'İncele'}</button>
              </div>
            </div>`;
          }).join('')}
        </div>
      </section>`;
    }

    if (!isPremium && isLoggedIn()) {
      html += `
      <div style="margin-top:4rem;padding:3rem;background:linear-gradient(45deg, #1a1a1a, #2a2a2a);border:1px solid var(--gold);border-radius:8px;text-align:center">
        <h2 style="color:var(--gold);font-family:'Cormorant Garamond',serif;font-size:2.5rem;margin-bottom:1rem">ArtVault Premium'a Geçin</h2>
        <p style="color:var(--text2);font-size:1.1rem;margin-bottom:2rem;max-width:600px;margin-inline:auto">Tüm indirimli eserlerde ve atölyelerde <strong>ekstra %10 indirim</strong> kazanmak, yeni eklenen eserlere erken erişim sağlamak için Premium üye olun.</p>
        <button class="btn btn-gold" onclick="upgradeToPremium()" style="font-size:1.1rem;padding:1rem 3rem">Hemen Premium Ol</button>
      </div>`;
    }

    document.getElementById('campaign-content').innerHTML = html;

  } catch (err) {
    document.getElementById('campaign-content').innerHTML = `<div class="empty-state"><h3>Hata</h3><p>${err.message}</p></div>`;
  }
}

async function upgradeToPremium() {
  try {
    await api('/api/users/upgrade', { method: 'POST' });
    const user = getUser();
    if (user) {
      user.is_premium = 1;
      localStorage.setItem('user', JSON.stringify(user));
    }
    showToast('Tebrikler! Artık Premium üyesiniz.');
    renderCampaigns();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

window.renderCampaigns = renderCampaigns;
window.upgradeToPremium = upgradeToPremium;
