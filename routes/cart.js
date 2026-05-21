const express = require('express');
const db = require('../database/init');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/cart
router.get('/', authenticate, (req, res) => {
  const items = db.prepare(`
    SELECT ci.*, a.title, a.image_url, a.price, a.stock, a.discount_percent,
           ar.name as artist_name
    FROM cart_items ci
    JOIN artworks a ON ci.artwork_id = a.id
    LEFT JOIN artists ar ON a.artist_id = ar.id
    WHERE ci.user_id = ?
    ORDER BY ci.added_at DESC
  `).all(req.user.id);

  const total = items.reduce((sum, item) => {
    const discounted = item.price * (1 - (item.discount_percent || 0) / 100);
    return sum + discounted * item.quantity;
  }, 0);

  res.json({ success: true, data: { items, total: Math.round(total * 100) / 100, count: items.length } });
});

// POST /api/cart - Add item
router.post('/', authenticate, (req, res) => {
  const { artwork_id, quantity = 1 } = req.body;
  if (!artwork_id) return res.status(400).json({ success: false, message: 'artwork_id required' });

  const artwork = db.prepare('SELECT * FROM artworks WHERE id = ?').get(artwork_id);
  if (!artwork) return res.status(404).json({ success: false, message: 'Artwork not found' });
  if (artwork.stock < 1) return res.status(400).json({ success: false, message: 'Out of stock' });

  const existing = db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND artwork_id = ?').get(req.user.id, artwork_id);
  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > artwork.stock) return res.status(400).json({ success: false, message: 'Not enough stock' });
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (user_id, artwork_id, quantity) VALUES (?, ?, ?)').run(req.user.id, artwork_id, quantity);
  }
  res.status(201).json({ success: true, message: 'Added to cart' });
});

// PUT /api/cart/:artwork_id - Update quantity
router.put('/:artwork_id', authenticate, (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ success: false, message: 'Valid quantity required' });

  const artwork = db.prepare('SELECT stock FROM artworks WHERE id = ?').get(req.params.artwork_id);
  if (!artwork) return res.status(404).json({ success: false, message: 'Artwork not found' });
  if (quantity > artwork.stock) return res.status(400).json({ success: false, message: 'Not enough stock' });

  db.prepare('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND artwork_id = ?').run(quantity, req.user.id, req.params.artwork_id);
  res.json({ success: true, message: 'Cart updated' });
});

// DELETE /api/cart/:artwork_id - Remove item
router.delete('/:artwork_id', authenticate, (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE user_id = ? AND artwork_id = ?').run(req.user.id, req.params.artwork_id);
  res.json({ success: true, message: 'Item removed' });
});

// DELETE /api/cart - Clear cart
router.delete('/', authenticate, (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
  res.json({ success: true, message: 'Cart cleared' });
});

module.exports = router;
