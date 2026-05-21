const express = require('express');
const db = require('../database/init');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/users/profile
router.get('/profile', authenticate, (req, res) => {
  const { password_hash, ...user } = req.user;
  res.json({ success: true, data: user });
});

// PUT /api/users/profile
router.put('/profile', authenticate, (req, res) => {
  const { full_name, phone, address, city, country, avatar } = req.body;
  db.prepare(`
    UPDATE users SET full_name=?, phone=?, address=?, city=?, country=?, avatar=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
  `).run(full_name, phone, address, city, country, avatar, req.user.id);

  const updated = db.prepare('SELECT id, full_name, email, role, phone, avatar, address, city, country, created_at, is_premium FROM users WHERE id = ?').get(req.user.id);
  res.json({ success: true, message: 'Profile updated', data: updated });
});

// POST /api/users/upgrade
router.post('/upgrade', authenticate, (req, res) => {
  db.prepare('UPDATE users SET is_premium = 1 WHERE id = ?').run(req.user.id);
  res.json({ success: true, message: 'Upgraded to premium' });
});

// POST /api/users/cancel-premium
router.post('/cancel-premium', authenticate, (req, res) => {
  db.prepare('UPDATE users SET is_premium = 0 WHERE id = ?').run(req.user.id);
  res.json({ success: true, message: 'Premium cancelled' });
});

// GET /api/users - Admin only
router.get('/', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });

  const { page = 1, limit = 20, search, role } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let conditions = ['1=1'];
  let params = [];

  if (search) { conditions.push('(full_name LIKE ? OR email LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (role) { conditions.push('role = ?'); params.push(role); }

  const where = conditions.join(' AND ');
  const users = db.prepare(`
    SELECT id, full_name, email, role, phone, avatar, created_at, is_premium FROM users WHERE ${where}
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);
  const total = db.prepare(`SELECT COUNT(*) as count FROM users WHERE ${where}`).get(...params).count;

  res.json({ success: true, data: users, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
});

// PUT /api/users/:id - Admin update user
router.put('/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  const { full_name, email, role, phone, avatar, address, city, country } = req.body;
  if (role && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Only admin can change roles' });

  db.prepare(`
    UPDATE users SET full_name=?, email=?, role=?, phone=?, avatar=?, address=?, city=?, country=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
  `).run(full_name, email, role || 'customer', phone, avatar, address, city, country, req.params.id);

  const updated = db.prepare('SELECT id, full_name, email, role, phone, avatar, address, city, country, created_at, is_premium FROM users WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

// DELETE /api/users/:id - Admin delete user
router.delete('/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'User deleted' });
});

module.exports = router;
