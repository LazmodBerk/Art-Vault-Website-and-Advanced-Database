async function renderSupport() {
  if (!isLoggedIn()) return navigate(null, '/login');
  setContent('<div class="spinner-container"><div class="spinner"></div></div>');
  document.title = 'Destek Merkezi – ArtVault';
  try {
    const res = await api('/api/support');
    const tickets = res.data;
    setContent(`
    <div class="container" style="padding-top:2rem;padding-bottom:4rem">
      <div class="page-header"><h1>Destek Merkezi</h1><p style="color:var(--text2);margin-top:.5rem">Sorularınız için buradayız</p></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-bottom:3rem">
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:4px;padding:2rem">
          <h3 style="margin-bottom:1.5rem">Yeni Destek Talebi</h3>
          <form onsubmit="createTicket(event)">
            <div class="form-group"><label>Konu</label><input class="form-control" id="ticket-subject" placeholder="Sorununuzu özetleyin" required></div>
            <div class="form-group">
              <label>Öncelik</label>
              <select class="form-select" id="ticket-priority">
                <option value="low">Düşük</option><option value="normal" selected>Normal</option><option value="high">Yüksek</option><option value="urgent">Acil</option>
              </select>
            </div>
            <div class="form-group"><label>Mesaj</label><textarea class="form-control" id="ticket-message" rows="5" placeholder="Probleminizi detaylıca anlatın..." required></textarea></div>
            <button type="submit" class="btn btn-gold">Talep Oluştur</button>
          </form>
        </div>
        <div>
          <div style="background:var(--bg2);border:1px solid var(--border);border-radius:4px;padding:2rem;margin-bottom:2rem">
            <h3 style="margin-bottom:1.5rem">İletişim Bilgilerimiz</h3>
            <p style="color:var(--text2);font-size:0.9rem;margin-bottom:0.75rem">Sorularınız, görüşleriniz veya özel talepleriniz için bize ulaşabilirsiniz. Ekibimiz size en kısa sürede dönüş yapacaktır.</p>
            <p style="color:var(--text2);margin-bottom:.5rem;font-size:0.9rem">📧 <strong>Email:</strong> destek@artvault.com</p>
            <p style="color:var(--text2);margin-bottom:.5rem;font-size:0.9rem">📞 <strong>Telefon:</strong> +90 462 000 0000</p>
            <p style="color:var(--text2);margin-bottom:1.5rem;font-size:0.9rem">📍 <strong>Adres:</strong> Trabzon Merkez, Trabzon, Türkiye</p>
            <div style="display:flex;gap:1rem;font-size:1.5rem">
              <a href="javascript:void(0)" class="btn-icon" title="Instagram">📸</a>
              <a href="javascript:void(0)" class="btn-icon" title="Facebook">📘</a>
              <a href="javascript:void(0)" class="btn-icon" title="LinkedIn">💼</a>
              <a href="javascript:void(0)" class="btn-icon" title="Telefon">📞</a>
            </div>
          </div>
          <h3 style="margin-bottom:1.5rem">Sık Sorulan Sorular</h3>
          ${[['Eser iade politikası nedir?','Teslim tarihinden itibaren 14 gün içinde iade talebinde bulunabilirsiniz.'],
             ['Kargo süresi ne kadardır?','İstanbul içi 1-2 iş günü, Türkiye geneli 3-5 iş günü.'],
             ['Atölye rezervasyonunu iptal edebilir miyim?','Etkinlikten 48 saat öncesine kadar ücretsiz iptal hakkınız bulunmaktadır.'],
             ['Ödeme yöntemleri nelerdir?','Kredi kartı, PayPal ve banka havalesi ile ödeme yapabilirsiniz.']
          ].map(([q,a])=>`
          <details style="border:1px solid var(--border);border-radius:4px;padding:1rem;margin-bottom:.75rem;cursor:pointer">
            <summary style="font-weight:500;list-style:none">${q}</summary>
            <p style="color:var(--text2);font-size:.875rem;margin-top:.75rem;line-height:1.6">${a}</p>
          </details>`).join('')}
        </div>
      </div>
      <div>
        <h3 style="margin-bottom:1.5rem">Taleplerim</h3>
        ${!tickets.length ? `<div class="empty-state" style="padding:2rem"><p>Henüz destek talebiniz yok</p></div>` :
        tickets.map(t=>`
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:4px;margin-bottom:1rem;overflow:hidden">
          <div style="padding:1.25rem 1.5rem;display:flex;justify-content:space-between;align-items:center;cursor:pointer;border-bottom:1px solid var(--border)" onclick="toggleTicket('t-${t.id}')">
            <div>
              <div style="font-weight:500">${t.subject}</div>
              <div style="font-size:.75rem;color:var(--text2);margin-top:.25rem">${formatDate(t.created_at)}</div>
            </div>
            <div style="display:flex;gap:.75rem;align-items:center">
              <span class="status-badge status-${t.status==='open'?'open':t.status==='resolved'?'confirmed':'processing'}">${{open:'Açık',in_progress:'İşlemde',resolved:'Çözüldü',closed:'Kapalı'}[t.status]}</span>
              <span>▼</span>
            </div>
          </div>
          <div id="t-${t.id}" style="display:none;padding:1.5rem">
            <div class="support-chat">
              <div class="message message-user"><div>${t.message}</div><div class="message-meta">${formatDate(t.created_at)}</div></div>
              ${(t.replies||[]).map(r=>`
              <div class="message ${r.is_admin?'message-admin':'message-user'}">
                <div><strong>${r.is_admin?'✦ ArtVault Destek':r.full_name}</strong>: ${r.message}</div>
                <div class="message-meta">${formatDate(r.created_at)}</div>
              </div>`).join('')}
            </div>
            ${t.status!=='closed'?`
            <div style="display:flex;gap:.75rem;margin-top:1rem">
              <input class="form-control" id="reply-${t.id}" placeholder="Yanıtınızı yazın...">
              <button class="btn btn-gold" onclick="replyTicket(${t.id})">Gönder</button>
            </div>`:''}
          </div>
        </div>`).join('')}
      </div>
    </div>`);
  } catch(e) { setContent(`<div class="empty-state"><h3>Hata</h3><p>${e.message}</p></div>`); }
}

function toggleTicket(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

async function createTicket(e) {
  e.preventDefault();
  try {
    await api('/api/support', { method: 'POST', body: JSON.stringify({
      subject: document.getElementById('ticket-subject').value,
      message: document.getElementById('ticket-message').value,
      priority: document.getElementById('ticket-priority').value
    })});
    showToast('Destek talebiniz oluşturuldu'); renderSupport();
  } catch (err) { showToast(err.message, 'error'); }
}

async function replyTicket(id) {
  const msg = document.getElementById(`reply-${id}`)?.value?.trim();
  if (!msg) return;
  try {
    await api(`/api/support/${id}/reply`, { method: 'POST', body: JSON.stringify({ message: msg }) });
    showToast('Yanıtınız gönderildi'); renderSupport();
  } catch (e) { showToast(e.message, 'error'); }
}

window.renderSupport = renderSupport;
window.toggleTicket = toggleTicket;
window.createTicket = createTicket;
window.replyTicket = replyTicket;
