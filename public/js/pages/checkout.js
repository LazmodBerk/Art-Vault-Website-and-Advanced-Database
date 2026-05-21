async function renderCheckout() {
  if (!isLoggedIn()) return navigate(null, '/login');
  setContent('<div class="spinner-container"><div class="spinner"></div></div>');
  const res = await api('/api/cart');
  const { items, total } = res.data;
  if (!items.length) return navigate(null, '/cart');
  const coupon = localStorage.getItem('applied_coupon') || '';
  document.title = 'Ödeme – ArtVault';
  setContent(`
  <div class="container" style="padding-top:2rem;padding-bottom:4rem">
    <div class="page-header"><h1>Ödeme</h1></div>
    <div style="display:grid;grid-template-columns:1fr 360px;gap:2rem;align-items:start">
      <div>
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:4px;padding:2rem;margin-bottom:1.5rem">
          <h3 style="margin-bottom:1.5rem">Teslimat Adresi</h3>
          <div class="form-group"><label>Tam Adres</label><textarea class="form-control" id="shipping-address" rows="3" placeholder="Mahalle, cadde, sokak, bina no..."></textarea></div>
        </div>
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:4px;padding:2rem;margin-bottom:1.5rem">
          <h3 style="margin-bottom:1.5rem">Ödeme Yöntemi</h3>
          <div style="display:flex;flex-direction:column;gap:.75rem">
            ${[['credit_card','💳 Kredi Kartı'],['paypal','🅿 PayPal'],['bank_transfer','🏦 Banka Havalesi']].map(([val,label])=>`
            <label style="display:flex;align-items:center;gap:.75rem;padding:1rem;background:var(--bg);border:1px solid var(--border);border-radius:4px;cursor:pointer">
              <input type="radio" name="payment" value="${val}" ${val==='credit_card'?'checked':''}>
              <span>${label}</span>
            </label>`).join('')}
          </div>
        </div>
        <div id="card-fields" style="background:var(--bg2);border:1px solid var(--border);border-radius:4px;padding:2rem">
          <h3 style="margin-bottom:1.5rem">Kart Bilgileri</h3>
          <div class="form-group"><label>Kart Numarası</label><input class="form-control" id="card-num" placeholder="•••• •••• •••• ••••" maxlength="19"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div class="form-group"><label>Son Kullanma</label><input class="form-control" id="card-exp" placeholder="AA/YY" maxlength="5"></div>
            <div class="form-group"><label>CVV</label><input class="form-control" id="card-cvv" placeholder="•••" maxlength="4"></div>
          </div>
        </div>
      </div>
      <div style="background:var(--bg2);border:1px solid var(--border);border-radius:4px;padding:2rem;position:sticky;top:90px">
        <h3 style="margin-bottom:1.5rem">Sipariş Özeti</h3>
        ${items.map(i=>`
        <div style="display:flex;gap:.75rem;margin-bottom:1rem;align-items:center">
          <img src="${i.image_url}" style="width:50px;height:40px;object-fit:cover;border-radius:2px" onerror="this.style.display='none'">
          <div style="flex:1"><div style="font-size:.85rem">${i.title}</div><div style="font-size:.75rem;color:var(--text2)">x${i.quantity}</div></div>
          <span style="font-size:.9rem;font-weight:600">${formatPrice(i.price * (1-(i.discount_percent||0)/100) * i.quantity)}</span>
        </div>`).join('')}
        <div style="border-top:1px solid var(--border);padding-top:1rem;margin-top:1rem">
          ${coupon?`<div style="display:flex;justify-content:space-between;margin-bottom:.5rem"><span style="color:var(--text2)">Kupon (${coupon})</span><span style="color:#4ade80">Uygulandı ✓</span></div>`:''}
          <div style="display:flex;justify-content:space-between;font-size:1.1rem;font-weight:600">
            <span>Toplam</span><span style="color:var(--gold)">${formatPrice(total)}</span>
          </div>
        </div>
        <button class="btn btn-gold" style="width:100%;margin-top:1.5rem" onclick="placeOrder()">Siparişi Onayla</button>
        <p style="font-size:.75rem;color:var(--text2);text-align:center;margin-top:1rem">🔒 256-bit SSL ile güvenli ödeme</p>
      </div>
    </div>
  </div>`);

  document.querySelectorAll('input[name="payment"]').forEach(r => {
    r.addEventListener('change', () => {
      document.getElementById('card-fields').style.display = r.value === 'credit_card' ? 'block' : 'none';
    });
  });
}

async function placeOrder() {
  const payment_method = document.querySelector('input[name="payment"]:checked')?.value || 'credit_card';
  const shipping_address = document.getElementById('shipping-address')?.value?.trim();
  const coupon_code = localStorage.getItem('applied_coupon') || undefined;
  if (!shipping_address) return showToast('Teslimat adresi gerekli', 'error');
  try {
    const btn = document.querySelector('.btn-gold');
    btn.textContent = 'İşleniyor...'; btn.disabled = true;
    const res = await api('/api/orders', { method: 'POST', body: JSON.stringify({ payment_method, shipping_address, coupon_code }) });
    localStorage.removeItem('applied_coupon');
    showToast('Siparişiniz alındı! 🎉');
    updateCartCount();
    setTimeout(() => navigate(null, '/orders'), 1500);
  } catch (e) { showToast(e.message, 'error'); const btn = document.querySelector('.btn-gold'); if(btn){btn.textContent='Siparişi Onayla';btn.disabled=false;} }
}

window.renderCheckout = renderCheckout;
window.placeOrder = placeOrder;
