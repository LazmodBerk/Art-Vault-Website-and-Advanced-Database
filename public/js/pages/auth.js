function renderLogin() {
  document.title = 'Giriş – ArtVault';
  setContent(`
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">Hoş Geldiniz</h1>
      <p class="auth-subtitle">Hesabınıza giriş yapın</p>
      <form onsubmit="doLogin(event)">
        <div class="form-group">
          <label>E-posta</label>
          <input class="form-control" id="login-email" type="email" placeholder="ornek@email.com" required>
        </div>
        <div class="form-group">
          <label>Şifre</label>
          <input class="form-control" id="login-pass" type="password" placeholder="••••••••" required>
        </div>
        <div style="text-align:right;margin-bottom:1.5rem">
          <a onclick="renderForgotPass()" style="color:var(--gold);font-size:.85rem;cursor:pointer">Şifremi Unuttum</a>
        </div>
        <button type="submit" class="btn btn-gold" style="width:100%" id="login-btn">Giriş Yap</button>
      </form>
      <p class="auth-footer">Hesabınız yok mu? <a onclick="navigate(null,'/register')" style="cursor:pointer">Kayıt Olun</a></p>
      <div style="margin-top:1.5rem;padding:1rem;background:var(--bg);border:1px solid var(--border);border-radius:4px;font-size:.8rem;color:var(--text2)">
        <strong>Demo Hesaplar:</strong><br>
        Admin: admin@artgallery.com / admin123<br>
        Kullanıcı: ahmet@example.com / user123
      </div>
    </div>
  </div>`);
}

async function doLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-pass').value;
  const btn = document.getElementById('login-btn');
  btn.textContent = 'Giriş yapılıyor...'; btn.disabled = true;
  try {
    const res = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(res.token); setUser(res.user);
    updateNavAuth(); updateCartCount();
    showToast(`Hoş geldiniz, ${res.user.full_name}!`);
    navigate(null, res.user.role === 'admin' ? '/admin' : '/');
  } catch (err) {
    showToast(err.message, 'error');
    btn.textContent = 'Giriş Yap'; btn.disabled = false;
  }
}

function renderRegister() {
  document.title = 'Kayıt – ArtVault';
  setContent(`
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">Hesap Oluştur</h1>
      <p class="auth-subtitle">ArtVault ailesine katılın</p>
      <form onsubmit="doRegister(event)">
        <div class="form-group">
          <label>Ad Soyad</label>
          <input class="form-control" id="reg-name" type="text" placeholder="Ad Soyad" required>
        </div>
        <div class="form-group">
          <label>E-posta</label>
          <input class="form-control" id="reg-email" type="email" placeholder="ornek@email.com" required>
        </div>
        <div class="form-group">
          <label>Telefon</label>
          <input class="form-control" id="reg-phone" type="tel" placeholder="+90 555 000 0000">
        </div>
        <div class="form-group">
          <label>Şifre</label>
          <input class="form-control" id="reg-pass" type="password" placeholder="En az 6 karakter" required minlength="6">
        </div>
        <button type="submit" class="btn btn-gold" style="width:100%" id="reg-btn">Kayıt Ol</button>
      </form>
      <p class="auth-footer">Zaten hesabınız var mı? <a onclick="navigate(null,'/login')" style="cursor:pointer">Giriş Yapın</a></p>
    </div>
  </div>`);
}

async function doRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('reg-btn');
  btn.textContent = 'Kaydediliyor...'; btn.disabled = true;
  try {
    const res = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({
      full_name: document.getElementById('reg-name').value,
      email: document.getElementById('reg-email').value,
      phone: document.getElementById('reg-phone').value,
      password: document.getElementById('reg-pass').value
    })});
    setToken(res.token); setUser(res.user);
    updateNavAuth(); updateCartCount();
    showToast('Kayıt başarılı! Hoş geldiniz!');
    navigate(null, '/');
  } catch (err) {
    showToast(err.message, 'error');
    btn.textContent = 'Kayıt Ol'; btn.disabled = false;
  }
}

function renderForgotPass() {
  setContent(`
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">Şifremi Unuttum</h1>
      <p class="auth-subtitle">E-postanızı girin, reset linki gönderelim</p>
      <form onsubmit="doForgotPass(event)">
        <div class="form-group"><label>E-posta</label><input class="form-control" id="fp-email" type="email" required placeholder="ornek@email.com"></div>
        <button type="submit" class="btn btn-gold" style="width:100%">Gönder</button>
      </form>
      <p class="auth-footer"><a onclick="navigate(null,'/login')" style="cursor:pointer">← Giriş Sayfasına Dön</a></p>
    </div>
  </div>`);
}

async function doForgotPass(e) {
  e.preventDefault();
  try {
    const res = await api('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: document.getElementById('fp-email').value }) });
    showToast(res.message);
  } catch (err) { showToast(err.message, 'error'); }
}

window.renderLogin = renderLogin;
window.renderRegister = renderRegister;
window.renderForgotPass = renderForgotPass;
window.doLogin = doLogin;
window.doRegister = doRegister;
window.doForgotPass = doForgotPass;
