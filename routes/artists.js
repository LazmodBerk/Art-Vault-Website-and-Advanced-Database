const express = require('express');
const db = require('../database/init');
const { authenticate, adminOnly } = require('../middleware/auth');
const router = express.Router();

// GET /api/artists
router.get('/', (req, res) => {
  const artists = db.prepare(`
    SELECT ar.*, COUNT(a.id) as artwork_count
    FROM artists ar
    LEFT JOIN artworks a ON ar.id = a.artist_id
    GROUP BY ar.id
    ORDER BY artwork_count DESC
  `).all();
  res.json({ success: true, data: artists });
});

// GET /api/artists/:id
router.get('/:id', (req, res) => {
  const artist = db.prepare('SELECT * FROM artists WHERE id = ?').get(req.params.id);
  if (!artist) return res.status(404).json({ success: false, message: 'Artist not found' });
  const artworks = db.prepare('SELECT * FROM artworks WHERE artist_id = ?').all(req.params.id);
  res.json({ success: true, data: { ...artist, artworks } });
});

// POST /api/artists - Admin only
router.post('/', authenticate, adminOnly, (req, res) => {
  const { name, bio, avatar, country, birth_year, style, website, instagram } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Artist name is required' });
  const result = db.prepare(
    'INSERT INTO artists (name, bio, avatar, country, birth_year, style, website, instagram) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(name, bio, avatar, country, birth_year, style, website, instagram);
  const artist = db.prepare('SELECT * FROM artists WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: artist });
});

// PUT /api/artists/:id - Admin only
router.put('/:id', authenticate, adminOnly, (req, res) => {
  const { name, bio, avatar, country, birth_year, style, website, instagram } = req.body;
  db.prepare(
    'UPDATE artists SET name=?, bio=?, avatar=?, country=?, birth_year=?, style=?, website=?, instagram=? WHERE id=?'
  ).run(name, bio, avatar, country, birth_year, style, website, instagram, req.params.id);
  const artist = db.prepare('SELECT * FROM artists WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: artist });
});

// DELETE /api/artists/:id - Admin only
router.delete('/:id', authenticate, adminOnly, (req, res) => {
  db.prepare('DELETE FROM artists WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Artist deleted' });
});

module.exports = router;
