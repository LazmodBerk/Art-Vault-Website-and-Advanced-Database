const express = require('express');
const db = require('../database/init');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/favorites - Get user's favorites
router.get('/', authenticate, (req, res) => {
  const favorites = db.prepare(`
    SELECT f.*, a.title, a.image_url, a.price, a.category, a.average_rating, a.stock,
           ar.name as artist_name
    FROM favorites f
    JOIN artworks a ON f.artwork_id = a.id
    LEFT JOIN artists ar ON a.artist_id = ar.id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `).all(req.user.id);
  res.json({ success: true, data: favorites });
});

// POST /api/favorites/:artwork_id - Add to favorites
router.post('/:artwork_id', authenticate, (req, res) => {
  const artwork = db.prepare('SELECT id FROM artworks WHERE id = ?').get(req.params.artwork_id);
  if (!artwork) return res.status(404).json({ success: false, message: 'Artwork not found' });

  try {
    db.prepare('INSERT INTO favorites (user_id, artwork_id) VALUES (?, ?)').run(req.user.id, req.params.artwork_id);
    res.status(201).json({ success: true, message: 'Added to favorites' });
  } catch (err) {
    res.status(409).json({ success: false, message: 'Already in favorites' });
  }
});

// DELETE /api/favorites/:artwork_id - Remove from favorites
router.delete('/:artwork_id', authenticate, (req, res) => {
  const result = db.prepare('DELETE FROM favorites WHERE user_id = ? AND artwork_id = ?').run(req.user.id, req.params.artwork_id);
  if (result.changes === 0) return res.status(404).json({ success: false, message: 'Not in favorites' });
  res.json({ success: true, message: 'Removed from favorites' });
});

// GET /api/favorites/check/:artwork_id - Check if artwork is favorited
router.get('/check/:artwork_id', authenticate, (req, res) => {
  const fav = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND artwork_id = ?').get(req.user.id, req.params.artwork_id);
  res.json({ success: true, is_favorited: !!fav });
});

module.exports = router;
