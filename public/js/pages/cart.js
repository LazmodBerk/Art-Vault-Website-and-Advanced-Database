async function renderCart() {
  if (!isLoggedIn()) return navigate(null, '/login');
  setContent('<div class="spinner-container"><div class="spinner"></div></div>');
  try {
    const res = await api('/api/cart');
    const { items, total } = res.data;
    document.title = 'Sepetim – ArtVault';
    if (!items.length) {
      setContent(`<div class="container" style="padding-top:2rem"><div class="page-header"><h1>Sepetim</h1></div><div class="empty-state"><div class="empty-icon">🛒</div><h3>Sepetiniz Boş</h3><p>Galeriyi keşfederek eserleri sepetinize ekleyin</p><button class="btn btn-gold" onclick="navigate(null,'/gallery')" style="margin-top:1.5rem">Galeriyi Keşfet</button></div></div>`);
      return;
    }
    setContent(`
    <div class="container" style="padding-top:2rem;padding-bottom:4rem">
      <div class="page-header"><h1>Sepetim</h1></div>
      <div style="display:grid;grid-template-columns:1fr 340px;gap:2rem;align-items:start">
        <div>
          ${items.map(item => {
            const price = item.price * (1 - (item.discount_percent || 0) / 100);
            return `<div class="card" style="display:grid;grid-template-columns:120px 1fr;gap:1.5rem;margin-bottom:1rem;padding:1.5rem;border-radius:4px" id="cart-item-${item.artwork_id}">
              <img src="${item.image_url}" style="width:120px;height:90px;object-fit:cover;border-radius:4px;cursor:pointer" onclick="navigate(null,'/artwork/${item.artwork_id}')" onerror="this.src='https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400'">
              <div>
                <h4 style="cursor:pointer" onclick="navigate(null,'/artwork/${item.artwork_id}')">${item.title}</h4>
                <p style="color:var(--text2);font-size:.85rem">— ${item.artist_name}</p>
                <div style="display:flex;align-items:center;gap:1rem;margin-top:.75rem">
                  <div style="display:flex;align-items:center;gap:.5rem">
                    <button class="btn-sm" onclick="updateQty(${item.artwork_id},${item.quantity - 1})">−</button>
                    <span style="min-width:24px;text-align:center">${item.quantity}</span>
                    <button class="btn-sm" onclick="updateQty(${item.artwork_id},${item.quantity + 1})">+</button>
                  </div>
                  <span style="color:var(--gold);font-weight:600">${formatPrice(price * item.quantity)}</span>
                  <button class="btn-sm" onclick="removeFromCart(${item.artwork_id})" style="margin-left:auto;color:#f87171;border-color:#f87171">Kaldır</button>
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:4px;padding:2rem;position:sticky;top:90px">
          <h3 style="margin-bottom:1.5rem">Sipariş Özeti</h3>
          <div style="margin-bottom:1rem">
            <div class="form-group">
              <label>Kupon Kodu</label>
              <div style="display:flex;gap:.5rem">
                <input class="form-control" id="coupon-input" placeholder="WELCOME20">
                <button class="btn btn-outline" onclick="applyCoupon(${total})">Uygula</button>
              </div>
            </div>
          </div>
          <div id="cart-summary">
            <div style="display:flex;justify-content:space-between;margin-bottom:.75rem"><span style="color:var(--text2)">Ara Toplam</span><span>${formatPrice(total)}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:.75rem"><span style="color:var(--text2)">Kargo</span><span style="color:#4ade80">Ücretsiz</span></div>
            <div style="border-top:1px solid var(--border);padding-top:1rem;display:flex;justify-content:space-between">
              <span style="font-weight:600">Toplam</span><span style="color:var(--gold);font-size:1.2rem;font-weight:700">${formatPrice(total)}</span>
            </div>
          </div>
          <button class="btn btn-gold" style="width:100%;margin-top:1.5rem" onclick="navigate(null,'/checkout')">Ödemeye Geç</button>
          <button class="btn btn-outline" style="width:100%;margin-top:.75rem" onclick="navigate(null,'/gallery')">Alışverişe Devam</button>
        </div>
      </div>
    </div>`);
  } catch (e) { setContent(`<div class="empty-state"><h3>Hata</h3><p>${e.message}</p></div>`); }
}

async function updateQty(id, qty) {
  if (qty < 1) return removeFromCart(id);
  try {
    await api(`/api/cart/${id}`, { method: 'PUT', body: JSON.stringify({ quantity: qty }) });
    renderCart(); updateCartCount();
  } catch (e) { showToast(e.message, 'error'); }
}

async function removeFromCart(id) {
  try {
    await api(`/api/cart/${id}`, { method: 'DELETE' });
    showToast('Ürün sepetten kaldırıldı', 'info');
    renderCart(); updateCartCount();
  } catch (e) { showToast(e.message, 'error'); }
}

async function applyCoupon(amount) {
  const code = document.getElementById('coupon-input')?.value?.trim();
  if (!code) return showToast('Kupon kodu girin', 'warning');
  try {
    const res = await api('/api/coupons/validate', { method: 'POST', body: JSON.stringify({ code, amount }) });
    localStorage.setItem('applied_coupon', code);
    showToast(`%${res.coupon.discount_percent} indirim uygulandı!`);
    document.getElementById('cart-summary').innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:.75rem"><span style="color:var(--text2)">Ara Toplam</span><span>${formatPrice(amount)}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:.75rem"><span style="color:var(--gold)">İndirim (${code})</span><span style="color:#4ade80">-${formatPrice(res.discount)}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:.75rem"><span style="color:var(--text2)">Kargo</span><span style="color:#4ade80">Ücretsiz</span></div>
      <div style="border-top:1px solid var(--border);padding-top:1rem;display:flex;justify-content:space-between">
        <span style="font-weight:600">Toplam</span><span style="color:var(--gold);font-size:1.2rem;font-weight:700">${formatPrice(res.final_amount)}</span>
      </div>`;
  } catch (e) { showToast(e.message, 'error'); }
}

window.renderCart = renderCart;
window.updateQty = updateQty;
window.removeFromCart = removeFromCart;
window.applyCoupon = applyCoupon;
