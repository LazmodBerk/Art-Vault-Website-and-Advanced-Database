const express = require('express');
const db = require('../database/init');
const { authenticate, adminOnly } = require('../middleware/auth');
const router = express.Router();

function getBotResponse(msg) {
  const lower = msg.toLocaleLowerCase('tr-TR');
  if (lower.includes('merhaba') || lower.includes('selam')) return 'Merhaba! ArtVault Canlı Destek asistanıyım. Size nasıl yardımcı olabilirim?';
  if (lower.includes('fiyat') || lower.includes('ücret')) return 'Eser ve atölye fiyatlarımız detay sayfalarında belirtilmiştir. Premium üye olarak tüm indirimli ürünlerde ekstra %10 indirimden faydalanabilirsiniz.';
  if (lower.includes('iptal') || lower.includes('iade')) return 'ArtVault üzerinden satın aldığınız sanat eserleri ve etkinlik biletleri için iptal ve iade koşullarımız müşteri memnuniyetini en üst düzeyde tutacak şekilde hazırlanmıştır. Herhangi bir etkinlik rezervasyonunu iptal etmek isterseniz, etkinliğin başlangıç tarihine kadar olan 1 günlük (24 saatlik) süre zarfında kesintisiz iptal hakkınız bulunmaktadır. Fiziksel bir sanat eseri siparişi verdiyseniz ve bu siparişi iade etmek isterseniz, ürünün size teslim edildiği günden itibaren tam 30 gün boyunca koşulsuz şartsız iade hakkınız mevcuttur. İade ve iptal işlemlerini Siparişlerim veya Rezervasyonlarım sekmesinden tek tıkla kolayca gerçekleştirebilirsiniz.';
  if (lower.includes('kargo')) return 'Siparişleriniz özenle paketlenip İstanbul içi 1-2, Türkiye geneli 3-5 iş günü içinde teslim edilmektedir.';
  if (lower.includes('premium') || lower.includes('üyelik')) return 'Premium üyelik size özel indirimler ve ayrıcalıklar sunar. "Fırsatlar" veya "Profilim" sayfasından hemen Premium olabilirsiniz!';
  if (lower.includes('iletişim') || lower.includes('adres')) return 'Bizimle info@artvault.com adresi üzerinden veya +90 212 000 0000 numaralı telefondan iletişime geçebilirsiniz. Galerimiz İstanbul, Türkiye dedir.';
  if (lower.includes('şifre')) return 'Şifrenizi unuttuysanız giriş sayfasındaki "Şifremi Unuttum" bağlantısını kullanabilir veya Profilim > Güvenlik sekmesinden şifrenizi güncelleyebilirsiniz.';
  if (lower.includes('ödeme') || lower.includes('taksit')) return 'Kredi kartı, banka kartı ve havale yöntemleriyle güvenli şekilde ödeme yapabilirsiniz. Taksit seçenekleri ödeme adımında bankanıza göre sunulmaktadır.';
  return 'Mesajınızı aldım. İlgili temsilcimiz en kısa sürede size dönecektir. Başka bir sorunuz varsa yazmaya devam edebilirsiniz.';
}


// GET /api/support - Get user's tickets (admin gets all)
router.get('/', authenticate, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const query = isAdmin
    ? `SELECT t.*, u.full_name, u.email FROM support_tickets t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC`
    : `SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC`;
  const tickets = isAdmin ? db.prepare(query).all() : db.prepare(query).all(req.user.id);

  const enriched = tickets.map(t => {
    const replies = db.prepare(`
      SELECT tr.*, u.full_name, u.role FROM ticket_replies tr
      JOIN users u ON tr.user_id = u.id
      WHERE tr.ticket_id = ? ORDER BY tr.created_at ASC
    `).all(t.id);
    return { ...t, replies };
  });

  res.json({ success: true, data: enriched });
});

// GET /api/support/:id
router.get('/:id', authenticate, (req, res) => {
  const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
  if (ticket.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  const replies = db.prepare(`
    SELECT tr.*, u.full_name, u.role, u.avatar FROM ticket_replies tr
    JOIN users u ON tr.user_id = u.id
    WHERE tr.ticket_id = ? ORDER BY tr.created_at ASC
  `).all(ticket.id);
  res.json({ success: true, data: { ...ticket, replies } });
});

// POST /api/support - Create ticket
router.post('/', authenticate, (req, res) => {
  const { subject, message, priority } = req.body;
  if (!subject || !message) return res.status(400).json({ success: false, message: 'Subject and message required' });

  const result = db.prepare(`
    INSERT INTO support_tickets (user_id, subject, message, priority) VALUES (?, ?, ?, ?)
  `).run(req.user.id, subject, message, priority || 'normal');

  const ticketId = result.lastInsertRowid;

  if (subject === 'Canlı Destek') {
    const adminUser = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
    const adminId = adminUser ? adminUser.id : req.user.id;
    db.prepare('INSERT INTO ticket_replies (ticket_id, user_id, message, is_admin) VALUES (?, ?, ?, 1)').run(ticketId, adminId, getBotResponse(message));
  }

  const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId);
  res.status(201).json({ success: true, message: 'Ticket created', data: ticket });
});

// POST /api/support/:id/reply - Reply to ticket
router.post('/:id/reply', authenticate, (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message required' });

  const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
  if (ticket.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const isAdmin = req.user.role === 'admin';
  db.prepare('INSERT INTO ticket_replies (ticket_id, user_id, message, is_admin) VALUES (?, ?, ?, ?)').run(req.params.id, req.user.id, message, isAdmin ? 1 : 0);

  if (isAdmin && ticket.status === 'open') {
    db.prepare("UPDATE support_tickets SET status='in_progress', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(req.params.id);
  }

  if (!isAdmin && ticket.subject === 'Canlı Destek') {
    const adminUser = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
    const adminId = adminUser ? adminUser.id : req.user.id;
    setTimeout(() => {
      try {
        db.prepare('INSERT INTO ticket_replies (ticket_id, user_id, message, is_admin) VALUES (?, ?, ?, 1)').run(req.params.id, adminId, getBotResponse(message));
      } catch (e) { console.error('Bot reply error', e); }
    }, 1000); // 1 second delay for realism
  }

  res.status(201).json({ success: true, message: 'Reply sent' });
});

// PUT /api/support/:id/status - Admin or User update status
router.put('/:id/status', authenticate, (req, res) => {
  const { status } = req.body;
  const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
  
  if (req.user.role !== 'admin' && ticket.user_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  // Users can only close their tickets. Admins can do anything.
  if (req.user.role !== 'admin' && status !== 'closed') {
    return res.status(403).json({ success: false, message: 'Users can only close tickets' });
  }

  db.prepare("UPDATE support_tickets SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(status, req.params.id);
  res.json({ success: true, message: 'Ticket status updated' });
});

// DELETE /api/support/:id - Admin delete
router.delete('/:id', authenticate, adminOnly, (req, res) => {
  db.prepare('DELETE FROM support_tickets WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Ticket deleted' });
});

module.exports = router;
