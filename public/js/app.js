function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

function toggleMobileMenu() {
  const el = document.getElementById('nav-links');
  if (el) el.classList.toggle('open');
}

function toggleUserMenu() {
  const el = document.getElementById('user-dropdown');
  if (el) el.classList.toggle('open');
}

function updateNavAuth() {
  const user = getUser();
  const authDiv = document.getElementById('nav-auth');
  const userDiv = document.getElementById('nav-user');
  
  if (user) {
    if (authDiv) authDiv.style.display = 'none';
    if (userDiv) userDiv.style.display = 'block';
    
    const avatar = document.getElementById('nav-avatar');
    if (avatar) avatar.src = user.avatar || '/images/default-avatar.png';
    
    const adminLink = document.getElementById('admin-link');
    if (adminLink) adminLink.style.display = user.role === 'admin' ? 'block' : 'none';
  } else {
    if (authDiv) authDiv.style.display = 'block';
    if (userDiv) userDiv.style.display = 'none';
  }
}

async function updateCartCount() {
  if (!isLoggedIn()) {
    document.getElementById('cart-count').textContent = '0';
    return;
  }
  try {
    const res = await api('/api/cart');
    document.getElementById('cart-count').textContent = res.data.count || 0;
  } catch (e) {
    console.error('Cart fetch failed', e);
  }
}

function logout() {
  removeToken();
  removeUser();
  updateNavAuth();
  updateCartCount();
  navigate(null, '/login');
  showToast('Çıkış yapıldı', 'info');
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }
  
  updateNavAuth();
  updateCartCount();
  renderPage(location.pathname);
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-menu')) {
    const dd = document.getElementById('user-dropdown');
    if (dd) dd.classList.remove('open');
  }
});

// --- Live Chat Logic ---
let liveChatTicketId = null;
let chatPollInterval = null;

function toggleChatWindow() {
  if (!isLoggedIn()) {
    showToast('Canlı destek için giriş yapmalısınız', 'error');
    navigate(null, '/login');
    return;
  }
  const chatWindow = document.getElementById('chat-window');
  if (chatWindow.style.display === 'none') {
    chatWindow.style.display = 'flex';
    document.getElementById('chat-toggle-btn').style.display = 'none';
    initChat();
  } else {
    chatWindow.style.display = 'none';
    document.getElementById('chat-toggle-btn').style.display = 'flex';
    clearInterval(chatPollInterval);
  }
}

async function initChat() {
  const messagesContainer = document.getElementById('chat-messages');
  messagesContainer.innerHTML = '<div class="spinner"></div>';
  try {
    const res = await api('/api/support');
    const tickets = res.data;
    
    const sessionId = sessionStorage.getItem('liveChatTicketId');
    let activeChat = null;
    if (sessionId) {
      activeChat = tickets.find(t => t.id == sessionId && t.status !== 'closed');
    }

    if (activeChat) {
      liveChatTicketId = activeChat.id;
      renderChatMessages(activeChat);
    } else {
      liveChatTicketId = null;
      sessionStorage.removeItem('liveChatTicketId');
      messagesContainer.innerHTML = '<div style="text-align:center;color:var(--text2);margin-top:20px;">Size nasıl yardımcı olabiliriz?</div>';
    }
    clearInterval(chatPollInterval);
    chatPollInterval = setInterval(pollChat, 3000);
  } catch (e) {
    messagesContainer.innerHTML = '<div style="color:#f87171;text-align:center">Bağlantı hatası</div>';
  }
}

async function pollChat() {
  if (!liveChatTicketId) return;
  try {
    const res = await api('/api/support/' + liveChatTicketId);
    renderChatMessages(res.data);
  } catch (e) { console.error('Chat poll failed', e); }
}

function renderChatMessages(ticket) {
  const container = document.getElementById('chat-messages');
  let html = `<div class="message message-user" style="align-self:flex-end;background:var(--bg);padding:8px 12px;border-radius:8px;max-width:80%;">${ticket.message}</div>`;
  (ticket.replies || []).forEach(r => {
    const isMe = r.user_id === getUser().id;
    html += `<div class="message ${isMe?'message-user':'message-admin'}" style="align-self:${isMe?'flex-end':'flex-start'};background:${isMe?'var(--bg)':'var(--gold)'};color:${isMe?'var(--text)':'#000'};padding:8px 12px;border-radius:8px;max-width:80%;margin-top:5px;">${r.message}</div>`;
  });
  const isAtBottom = container.scrollHeight - container.scrollTop === container.clientHeight;
  container.innerHTML = html;
  if (isAtBottom) container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  try {
    if (!liveChatTicketId) {
      const res = await api('/api/support', { method: 'POST', body: JSON.stringify({ subject: 'Canlı Destek', message: msg, priority: 'normal' }) });
      liveChatTicketId = res.data.id;
      sessionStorage.setItem('liveChatTicketId', liveChatTicketId);
      initChat();
    } else {
      await api(`/api/support/${liveChatTicketId}/reply`, { method: 'POST', body: JSON.stringify({ message: msg }) });
      pollChat();
    }
  } catch (e) { showToast('Mesaj gönderilemedi', 'error'); }
}

async function endChat() {
  if (!liveChatTicketId) return toggleChatWindow();
  if (!confirm('Canlı destek görüşmesini sonlandırmak istediğinize emin misiniz?')) return;
  try {
    await api(`/api/support/${liveChatTicketId}/status`, { method: 'PUT', body: JSON.stringify({ status: 'closed' }) });
    liveChatTicketId = null;
    sessionStorage.removeItem('liveChatTicketId');
    clearInterval(chatPollInterval);
    document.getElementById('chat-messages').innerHTML = '<div style="text-align:center;color:var(--text2);margin-top:20px;">Görüşme sonlandırıldı. Tekrar bağlanmak için mesaj yazabilirsiniz.</div>';
    showToast('Görüşme başarıyla sonlandırıldı', 'info');
  } catch (e) {
    showToast('Görüşme sonlandırılamadı', 'error');
  }
}

window.endChat = endChat;

function sendQuickReply(msg) {
  const input = document.getElementById('chat-input');
  if (input) {
    input.value = msg;
    sendChatMessage();
  }
}
