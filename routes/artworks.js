const express = require('express');
const db = require('../database/init');
const { authenticate, optionalAuth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/artworks - List with filtering, sorting, pagination
router.get('/', optionalAuth, (req, res) => {
  const { 
    page = 1, limit = 12, category, artist_id, 
    min_price, max_price, sort = 'created_at', order = 'DESC',
    search, featured, discounted 
  } = req.query;
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let conditions = ['1=1'];
  let params = [];

  if (category) { conditions.push('a.category = ?'); params.push(category); }
  if (artist_id) { conditions.push('a.artist_id = ?'); params.push(artist_id); }
  if (min_price) { conditions.push('a.price >= ?'); params.push(min_price); }
  if (max_price) { conditions.push('a.price <= ?'); params.push(max_price); }
  if (featured) { conditions.push('a.is_featured = 1'); }
  if (discounted) { conditions.push('a.discount_percent > 0'); }
  if (search) { 
    conditions.push('(a.title LIKE ? OR a.description LIKE ? OR ar.name LIKE ?)'); 
    params.push(`%${search}%`, `%${search}%`, `%${search}%`); 
  }

  const allowedSorts = ['created_at', 'price', 'view_count', 'average_rating', 'title'];
  const sortCol = allowedSorts.includes(sort) ? sort : 'created_at';
  const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

  const where = conditions.join(' AND ');
  const query = `
    SELECT a.*, ar.name as artist_name, ar.avatar as artist_avatar, ar.country as artist_country
    FROM artworks a
    LEFT JOIN artists ar ON a.artist_id = ar.id
    WHERE ${where}
    ORDER BY a.${sortCol} ${sortOrder}
    LIMIT ? OFFSET ?
  `;

  const artworks = db.prepare(query).all(...params, parseInt(limit), offset);
  const total = db.prepare(`SELECT COUNT(*) as count FROM artworks a LEFT JOIN artists ar ON a.artist_id = ar.id WHERE ${where}`).get(...params).count;

  res.json({
    success: true,
    data: artworks,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
  });
});

// GET /api/artworks/categories - Get all categories
router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category, COUNT(*) as count FROM artworks GROUP BY category').all();
  res.json({ success: true, data: categories });
});

// GET /api/artworks/:id
router.get('/:id', optionalAuth, (req, res) => {
  const artwork = db.prepare(`
    SELECT a.*, ar.name as artist_name, ar.bio as artist_bio, ar.avatar as artist_avatar, 
           ar.country as artist_country, ar.style as artist_style, ar.website as artist_website,
           ar.instagram as artist_instagram, ar.birth_year as artist_birth_year
    FROM artworks a
    LEFT JOIN artists ar ON a.artist_id = ar.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!artwork) return res.status(404).json({ success: false, message: 'Artwork not found' });

  // Increment view count
  db.prepare('UPDATE artworks SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);

  // Check if favorited by current user
  if (req.user) {
    const fav = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND artwork_id = ?').get(req.user.id, artwork.id);
    artwork.is_favorited = !!fav;
  }

  // Get related artworks
  const related = db.prepare(`
    SELECT a.*, ar.name as artist_name FROM artworks a
    LEFT JOIN artists ar ON a.artist_id = ar.id
    WHERE (a.category = ? OR a.artist_id = ?) AND a.id != ?
    LIMIT 4
  `).all(artwork.category, artwork.artist_id, artwork.id);

  res.json({ success: true, data: { ...artwork, related } });
});

// POST /api/artworks - Admin only
router.post('/', authenticate, adminOnly, (req, res) => {
  const { title, description, category, artist_id, price, stock, image_url, is_featured, discount_percent } = req.body;
  if (!title || !category || !artist_id || price === undefined) {
    return res.status(400).json({ success: false, message: 'Title, category, artist_id and price are required' });
  }
  const result = db.prepare(`
    INSERT INTO artworks (title, description, category, artist_id, price, stock, image_url, is_featured, discount_percent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, description, category, artist_id, price, stock || 1, image_url, is_featured ? 1 : 0, discount_percent || 0);

  const artwork = db.prepare('SELECT * FROM artworks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, message: 'Artwork created', data: artwork });
});

// PUT /api/artworks/:id - Admin only
router.put('/:id', authenticate, adminOnly, (req, res) => {
  const { title, description, category, artist_id, price, stock, image_url, is_featured, discount_percent } = req.body;
  const artwork = db.prepare('SELECT id FROM artworks WHERE id = ?').get(req.params.id);
  if (!artwork) return res.status(404).json({ success: false, message: 'Artwork not found' });

  db.prepare(`
    UPDATE artworks SET title=?, description=?, category=?, artist_id=?, price=?, stock=?, 
    image_url=?, is_featured=?, discount_percent=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
  `).run(title, description, category, artist_id, price, stock, image_url, is_featured ? 1 : 0, discount_percent || 0, req.params.id);

  const updated = db.prepare('SELECT * FROM artworks WHERE id = ?').get(req.params.id);
  res.json({ success: true, message: 'Artwork updated', data: updated });
});

// DELETE /api/artworks/:id - Admin only
router.delete('/:id', authenticate, adminOnly, (req, res) => {
  const artwork = db.prepare('SELECT id FROM artworks WHERE id = ?').get(req.params.id);
  if (!artwork) return res.status(404).json({ success: false, message: 'Artwork not found' });
  db.prepare('DELETE FROM artworks WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Artwork deleted' });
});

module.exports = router;
