async function renderOrders() {
  if (!isLoggedIn()) return navigate(null, '/login');
  setContent('<div class="spinner-container"><div class="spinner"></div></div>');
  document.title = 'Siparişlerim – ArtVault';
  try {
    const res = await api('/api/orders');
    const orders = res.data;
    if (!orders.length) {
      setContent(`<div class="container" style="padding-top:2rem"><div class="page-header"><h1>Siparişlerim</h1></div><div class="empty-state"><div class="empty-icon">📦</div><h3>Henüz Sipariş Yok</h3><button class="btn btn-gold" onclick="navigate(null,'/gallery')" style="margin-top:1.5rem">Alışverişe Başla</button></div></div>`);
      return;
    }
    setContent(`
    <div class="container" style="padding-top:2rem;padding-bottom:4rem">
      <div class="page-header"><h1>Siparişlerim</h1><p style="color:var(--text2);margin-top:.5rem">${orders.length} sipariş</p></div>
      ${orders.map(o => `
      <div style="background:var(--bg2);border:1px solid var(--border);border-radius:4px;margin-bottom:1.5rem;overflow:hidden">
        <div style="padding:1.5rem;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:1rem">
          <div>
            <div style="font-size:.75rem;color:var(--text2);letter-spacing:1px;text-transform:uppercase">Sipariş #${o.id}</div>
            <div style="font-size:.85rem;color:var(--text2);margin-top:.25rem">${formatDate(o.created_at)}</div>
          </div>
          <div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap">
            <span class="status-badge status-${o.order_status}">${{processing:'İşleniyor',confirmed:'Onaylandı',shipped:'Kargoda',delivered:'Teslim Edildi',cancelled:'İptal'}[o.order_status]||o.order_status}</span>
            <span class="status-badge status-${o.payment_status}">${{pending:'Ödeme Bekliyor',paid:'Ödendi',failed:'Başarısız',refunded:'İade'}[o.payment_status]||o.payment_status}</span>
            <span style="color:var(--gold);font-weight:700;font-size:1.1rem">${formatPrice(o.total_amount)}</span>
          </div>
        </div>
        <div style="padding:1.5rem">
          <div style="display:flex;gap:1rem;flex-wrap:wrap">
            ${(o.items||[]).map(item=>`
            <div style="display:flex;gap:.75rem;align-items:center">
              <img src="${item.image_url}" style="width:60px;height:50px;object-fit:cover;border-radius:2px" onerror="this.style.display='none'">
              <div><div style="font-size:.85rem;font-weight:500">${item.title}</div><div style="font-size:.75rem;color:var(--text2)">x${item.quantity} – ${formatPrice(item.price)}</div></div>
            </div>`).join('')}
          </div>
          ${o.order_status!=='shipped'&&o.order_status!=='delivered'&&o.order_status!=='cancelled'?`
          <div style="margin-top:1rem;text-align:right">
            <button class="btn btn-sm" onclick="cancelOrder(${o.id})" style="color:#f87171;border-color:#f87171">Siparişi İptal Et</button>
          </div>`:''}
        </div>
      </div>`).join('')}
    </div>`);
  } catch(e) { setContent(`<div class="empty-state"><h3>Hata</h3><p>${e.message}</p></div>`); }
}

async function cancelOrder(id) {
  if (!confirm('Bu siparişi iptal etmek istediğinize emin misiniz?')) return;
  try {
    await api(`/api/orders/${id}`, { method: 'DELETE' });
    showToast('Sipariş iptal edildi', 'info'); renderOrders();
  } catch (e) { showToast(e.message, 'error'); }
}

window.renderOrders = renderOrders;
window.cancelOrder = cancelOrder;
