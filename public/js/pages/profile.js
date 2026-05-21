async function renderProfile() {
  if (!isLoggedIn()) return navigate(null, '/login');
  const user = getUser();
  document.title = 'Profilim – ArtVault';
  setContent(`
  <div class="container" style="padding-top:2rem;padding-bottom:4rem;max-width:800px">
    <div class="page-header"><h1>Profilim</h1></div>
    
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:4px;padding:2.5rem;margin-bottom:2rem">
      <div style="display:flex;align-items:center;gap:2rem;margin-bottom:2rem;padding-bottom:2rem;border-bottom:1px solid var(--border)">
        <div style="position:relative; width:80px; height:80px; border-radius:50%; cursor:pointer;" onclick="document.getElementById('avatar-upload').click()">
          <img id="profile-avatar-preview" src="${user.avatar||'/images/default-avatar.png'}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--gold)" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=c9a84c&color=000&size=80'">
          <div style="position:absolute;bottom:-4px;right:-4px;background:var(--gold);color:#000;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 5px rgba(0,0,0,0.5);border:2px solid var(--bg2);">✎</div>
          <input type="file" id="avatar-upload" accept="image/*" style="display:none" onchange="handleAvatarUpload(event)">
        </div>
        <div>
          <h2>${user.full_name}</h2>
          <p style="color:var(--gold);font-size:.85rem;text-transform:uppercase;letter-spacing:1px">${user.role==='admin'?'Yönetici':'Koleksiyoner'}</p>
          <p style="color:var(--text2);font-size:.85rem;margin-top:.25rem">${user.email}</p>
          <div style="margin-top:1rem">
            ${user.is_premium ? '<span class="verified-badge" style="background:var(--gold);color:#000;padding:4px 8px;border-radius:4px">★ Premium Üye</span>' : '<span style="background:var(--bg);padding:4px 8px;border-radius:4px;font-size:.8rem;color:var(--text2)">Standart Üye</span>'}
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display:flex;gap:1.5rem;border-bottom:1px solid var(--border);margin-bottom:2rem;">
        <button id="tab-btn-info" class="tab-btn active" onclick="switchProfileTab('info')" style="background:none;border:none;padding-bottom:10px;font-size:1.1rem;color:var(--gold);border-bottom:2px solid var(--gold);cursor:pointer;">Kişisel Bilgiler</button>
        <button id="tab-btn-security" class="tab-btn" onclick="switchProfileTab('security')" style="background:none;border:none;padding-bottom:10px;font-size:1.1rem;color:var(--text2);cursor:pointer;">Güvenlik</button>
        <button id="tab-btn-premium" class="tab-btn" onclick="switchProfileTab('premium')" style="background:none;border:none;padding-bottom:10px;font-size:1.1rem;color:var(--text2);cursor:pointer;">Premium Üyelik</button>
      </div>

      <!-- Tab Content: Info -->
      <div id="tab-content-info">
        <form onsubmit="saveProfile(event)">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
            <div class="form-group"><label>Ad Soyad</label><input class="form-control" id="p-name" value="${user.full_name||''}"></div>
            <div class="form-group"><label>E-posta</label><input class="form-control" value="${user.email}" disabled style="opacity:.6"></div>
            <div class="form-group"><label>Telefon</label><input class="form-control" id="p-phone" value="${user.phone||''}"></div>
            <div class="form-group"><label>Şehir</label><input class="form-control" id="p-city" value="${user.city||''}"></div>
          </div>
          <input type="hidden" id="p-avatar" value="${user.avatar||''}">
          <div class="form-group"><label>Adres</label><textarea class="form-control" id="p-address" rows="3">${user.address||''}</textarea></div>
          <button type="submit" class="btn btn-gold">Kaydet</button>
        </form>
      </div>

      <!-- Tab Content: Security -->
      <div id="tab-content-security" style="display:none;">
        <h3 style="margin-bottom:1.5rem">Şifre Değiştir</h3>
        <form onsubmit="changePassword(event)">
          <div class="form-group"><label>Mevcut Şifre</label><input class="form-control" id="curr-pass" type="password" required></div>
          <div class="form-group"><label>Yeni Şifre</label><input class="form-control" id="new-pass" type="password" required minlength="6"></div>
          <button type="submit" class="btn btn-outline">Şifreyi Güncelle</button>
        </form>
      </div>

      <!-- Tab Content: Premium -->
      <div id="tab-content-premium" style="display:none;">
        ${!user.is_premium ? `
        <div style="background:linear-gradient(45deg, #1a1a1a, #2a2a2a);border:1px solid var(--gold);border-radius:4px;padding:2.5rem;text-align:center;">
          <h2 style="color:var(--gold);margin-bottom:1rem;font-size:2rem;">Premium Üyeliğe Geçin</h2>
          <p style="color:var(--text2);font-size:1.1rem;max-width:500px;margin:0 auto 2rem;">Premium üyeler tüm kampanyalı eserlerde ve etkinliklerde ekstra %10 indirim kazanır. Özel avantajları kaçırmayın!</p>
          <button class="btn btn-gold" style="font-size:1.1rem;padding:1rem 2rem;" onclick="upgradePremiumProfile()">Aylık Sadece ₺99 - Hemen Başla</button>
        </div>` : `
        <div style="background:var(--bg);border:1px solid var(--gold);border-radius:4px;padding:2.5rem;">
          <h2 style="color:var(--gold);margin-bottom:1rem;font-size:1.8rem;">★ Premium Üyelik Aktif</h2>
          <p style="color:var(--text2);font-size:1rem;margin-bottom:1.5rem;">ArtVault Premium ayrıcalıklarından yararlanıyorsunuz. Satın alımlarınızda ekstra %10 indirim uygulanmaktadır.</p>
          <div style="display:flex;gap:1rem;">
            <button class="btn btn-gold" onclick="navigate(null,'/campaigns')">Fırsatları İncele</button>
            <button class="btn btn-outline" style="color:#f87171;border-color:#f87171;" onclick="cancelPremiumProfile()">Üyeliği İptal Et</button>
          </div>
        </div>`}
      </div>
    </div>
  </div>`);
}

function switchProfileTab(tabId) {
  // Update Buttons
  ['info', 'security', 'premium'].forEach(id => {
    const btn = document.getElementById('tab-btn-' + id);
    if (id === tabId) {
      btn.style.color = 'var(--gold)';
      btn.style.borderBottom = '2px solid var(--gold)';
    } else {
      btn.style.color = 'var(--text2)';
      btn.style.borderBottom = 'none';
    }
  });

  // Update Content Views
  ['info', 'security', 'premium'].forEach(id => {
    document.getElementById('tab-content-' + id).style.display = (id === tabId) ? 'block' : 'none';
  });
}

async function saveProfile(e) {
  e.preventDefault();
  try {
    const res = await api('/api/users/profile', { method: 'PUT', body: JSON.stringify({
      full_name: document.getElementById('p-name').value,
      phone: document.getElementById('p-phone').value,
      city: document.getElementById('p-city').value,
      address: document.getElementById('p-address').value,
      avatar: document.getElementById('p-avatar').value
    })});
    setUser(res.data);
    document.getElementById('nav-avatar').src = res.data.avatar || '/images/default-avatar.png';
    showToast('Profil güncellendi');
  } catch (err) { showToast(err.message, 'error'); }
}

async function changePassword(e) {
  e.preventDefault();
  try {
    await api('/api/auth/change-password', { method: 'PUT', body: JSON.stringify({
      currentPassword: document.getElementById('curr-pass').value,
      newPassword: document.getElementById('new-pass').value
    })});
    showToast('Şifre değiştirildi'); e.target.reset();
  } catch (err) { showToast(err.message, 'error'); }
}

async function upgradePremiumProfile() {
  try {
    await api('/api/users/upgrade', { method: 'POST' });
    const user = getUser();
    if (user) {
      user.is_premium = 1;
      localStorage.setItem('user', JSON.stringify(user));
    }
    showToast('Tebrikler! Artık Premium üyesiniz.');
    renderProfile();
    switchProfileTab('premium');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function cancelPremiumProfile() {
  if (!confirm('Premium üyeliğinizi iptal etmek istediğinize emin misiniz? Tüm avantajlarınızı kaybedeceksiniz.')) return;
  try {
    await api('/api/users/cancel-premium', { method: 'POST' });
    const user = getUser();
    if (user) {
      user.is_premium = 0;
      localStorage.setItem('user', JSON.stringify(user));
    }
    showToast('Premium üyeliğiniz iptal edildi.', 'info');
    renderProfile();
    switchProfileTab('premium');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  if (file.size > 2 * 1024 * 1024) {
    return showToast("Resim boyutu 2MB'dan küçük olmalıdır", "error");
  }

  const reader = new FileReader();
  reader.onload = async function(event) {
    const base64String = event.target.result;
    document.getElementById('profile-avatar-preview').src = base64String;
    document.getElementById('p-avatar').value = base64String;
    
    try {
      const res = await api('/api/users/profile', { method: 'PUT', body: JSON.stringify({
        full_name: document.getElementById('p-name').value,
        phone: document.getElementById('p-phone').value,
        city: document.getElementById('p-city').value,
        address: document.getElementById('p-address').value,
        avatar: base64String
      })});
      setUser(res.data);
      document.getElementById('nav-avatar').src = res.data.avatar || '/images/default-avatar.png';
      showToast('Profil resmi başarıyla güncellendi');
    } catch (err) { 
      showToast(err.message, 'error'); 
    }
  };
  reader.readAsDataURL(file);
}

window.renderProfile = renderProfile;
window.saveProfile = saveProfile;
window.changePassword = changePassword;
window.upgradePremiumProfile = upgradePremiumProfile;
window.cancelPremiumProfile = cancelPremiumProfile;
window.switchProfileTab = switchProfileTab;
window.handleAvatarUpload = handleAvatarUpload;
