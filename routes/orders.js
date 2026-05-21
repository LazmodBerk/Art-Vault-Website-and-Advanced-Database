const express = require('express');
const db = require('../database/init');
const { authenticate, adminOnly } = require('../middleware/auth');
const router = express.Router();

// GET /api/orders - User's orders (admin gets all)
router.get('/', authenticate, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const query = isAdmin
    ? `SELECT o.*, u.full_name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC`
    : `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`;

  const orders = isAdmin ? db.prepare(query).all() : db.prepare(query).all(req.user.id);

  const enriched = orders.map(order => {
    const items = db.prepare(`
      SELECT oi.*, a.title, a.image_url FROM order_items oi
      JOIN artworks a ON oi.artwork_id = a.id
      WHERE oi.order_id = ?
    `).all(order.id);
    return { ...order, items };
  });

  res.json({ success: true, data: enriched });
});

// GET /api/orders/:id
router.get('/:id', authenticate, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (order.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  const items = db.prepare(`
    SELECT oi.*, a.title, a.image_url, a.category, ar.name as artist_name
    FROM order_items oi
    JOIN artworks a ON oi.artwork_id = a.id
    LEFT JOIN artists ar ON a.artist_id = ar.id
    WHERE oi.order_id = ?
  `).all(order.id);
  res.json({ success: true, data: { ...order, items } });
});

// POST /api/orders - Checkout
router.post('/', authenticate, (req, res) => {
  const { payment_method, coupon_code, shipping_address, notes } = req.body;

  // Get cart items
  const cartItems = db.prepare(`
    SELECT ci.*, a.price, a.stock, a.discount_percent, a.title
    FROM cart_items ci
    JOIN artworks a ON ci.artwork_id = a.id
    WHERE ci.user_id = ?
  `).all(req.user.id);

  if (cartItems.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  // Validate stock
  for (const item of cartItems) {
    if (item.quantity > item.stock) {
      return res.status(400).json({ success: false, message: `"${item.title}" has insufficient stock` });
    }
  }

  // Calculate total
  let subtotal = cartItems.reduce((sum, item) => {
    const discounted = item.price * (1 - (item.discount_percent || 0) / 100);
    return sum + discounted * item.quantity;
  }, 0);

  // Apply coupon
  let discountAmount = 0;
  let appliedCoupon = null;
  if (coupon_code) {
    const coupon = db.prepare(`
      SELECT * FROM coupons WHERE code = ? AND is_active = 1 
      AND expiration_date >= date('now') AND usage_count < usage_limit
    `).get(coupon_code);
    if (coupon && subtotal >= coupon.min_order_amount) {
      discountAmount = subtotal * coupon.discount_percent / 100;
      appliedCoupon = coupon;
    }
  }

  const total_amount = Math.max(0, subtotal - discountAmount);

  // Create order in transaction
  const createOrder = db.transaction(() => {
    const orderResult = db.prepare(`
      INSERT INTO orders (user_id, total_amount, payment_method, payment_status, order_status, coupon_code, discount_amount, shipping_address, notes)
      VALUES (?, ?, ?, 'pending', 'processing', ?, ?, ?, ?)
    `).run(req.user.id, total_amount, payment_method || 'credit_card', coupon_code || null, discountAmount, shipping_address, notes);

    const orderId = orderResult.lastInsertRowid;

    for (const item of cartItems) {
      const price = item.price * (1 - (item.discount_percent || 0) / 100);
      db.prepare('INSERT INTO order_items (order_id, artwork_id, quantity, price) VALUES (?, ?, ?, ?)').run(orderId, item.artwork_id, item.quantity, price);
      db.prepare('UPDATE artworks SET stock = stock - ? WHERE id = ?').run(item.quantity, item.artwork_id);
    }

    if (appliedCoupon) {
      db.prepare('UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?').run(appliedCoupon.id);
    }

    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    return orderId;
  });

  const orderId = createOrder();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  res.status(201).json({ success: true, message: 'Order placed successfully', data: order });
});

// PUT /api/orders/:id/status - Admin update status
router.put('/:id/status', authenticate, adminOnly, (req, res) => {
  const { order_status, payment_status } = req.body;
  const order = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  db.prepare('UPDATE orders SET order_status=?, payment_status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .run(order_status, payment_status, req.params.id);
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

// DELETE /api/orders/:id - Cancel order
router.delete('/:id', authenticate, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (order.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (order.order_status === 'shipped' || order.order_status === 'delivered') {
    return res.status(400).json({ success: false, message: 'Cannot cancel shipped/delivered orders' });
  }

  const cancelOrder = db.transaction(() => {
    db.prepare("UPDATE orders SET order_status='cancelled', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(order.id);
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    for (const item of items) {
      db.prepare('UPDATE artworks SET stock = stock + ? WHERE id = ?').run(item.quantity, item.artwork_id);
    }
  });
  cancelOrder();
  res.json({ success: true, message: 'Order cancelled' });
});

module.exports = router;
