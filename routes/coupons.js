const express = require('express');
const db = require('../database/init');
const { authenticate, adminOnly } = require('../middleware/auth');
const router = express.Router();

// POST /api/coupons/validate
router.post('/validate', authenticate, (req, res) => {
  const { code, amount } = req.body;
  const coupon = db.prepare(`
    SELECT * FROM coupons WHERE code = ? AND is_active = 1 
    AND expiration_date >= date('now') AND usage_count < usage_limit
  `).get(code);

  if (!coupon) return res.status(404).json({ success: false, message: 'Invalid or expired coupon' });
  if (amount < coupon.min_order_amount) {
    return res.status(400).json({ success: false, message: `Minimum order amount is ₺${coupon.min_order_amount}` });
  }

  const discount = amount * coupon.discount_percent / 100;
  res.json({ success: true, coupon, discount: Math.round(discount * 100) / 100, final_amount: Math.round((amount - discount) * 100) / 100 });
});

// GET /api/coupons - Admin only
router.get('/', authenticate, adminOnly, (req, res) => {
  const coupons = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
  res.json({ success: true, data: coupons });
});

// POST /api/coupons - Admin create coupon
router.post('/', authenticate, adminOnly, (req, res) => {
  const { code, discount_percent, expiration_date, usage_limit, min_order_amount } = req.body;
  if (!code || !discount_percent || !expiration_date) {
    return res.status(400).json({ success: false, message: 'code, discount_percent, expiration_date required' });
  }
  try {
    const result = db.prepare(`
      INSERT INTO coupons (code, discount_percent, expiration_date, usage_limit, min_order_amount)
      VALUES (?, ?, ?, ?, ?)
    `).run(code.toUpperCase(), discount_percent, expiration_date, usage_limit || 100, min_order_amount || 0);
    const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: coupon });
  } catch {
    res.status(409).json({ success: false, message: 'Coupon code already exists' });
  }
});

// PUT /api/coupons/:id - Admin update
router.put('/:id', authenticate, adminOnly, (req, res) => {
  const { discount_percent, expiration_date, usage_limit, is_active, min_order_amount } = req.body;
  db.prepare(`UPDATE coupons SET discount_percent=?, expiration_date=?, usage_limit=?, is_active=?, min_order_amount=? WHERE id=?`)
    .run(discount_percent, expiration_date, usage_limit, is_active ? 1 : 0, min_order_amount, req.params.id);
  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: coupon });
});

// DELETE /api/coupons/:id - Admin delete
router.delete('/:id', authenticate, adminOnly, (req, res) => {
  db.prepare('DELETE FROM coupons WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Coupon deleted' });
});

module.exports = router;
