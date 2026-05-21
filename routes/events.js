const express = require('express');
const db = require('../database/init');
const { authenticate, optionalAuth, adminOnly } = require('../middleware/auth');
const router = express.Router();

// GET /api/events
router.get('/', (req, res) => {
  const { page = 1, limit = 9, category, level, search, sort = 'date', order = 'ASC', discounted } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let conditions = ['is_active = 1'];
  let params = [];

  if (category) { conditions.push('category = ?'); params.push(category); }
  if (level) { conditions.push('level = ?'); params.push(level); }
  if (discounted) { conditions.push('discount_percent > 0'); }
  if (search) { conditions.push('(title LIKE ? OR instructor LIKE ? OR description LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

  const where = conditions.join(' AND ');
  const allowedSorts = ['date', 'price', 'capacity', 'reserved_count', 'title'];
  const sortCol = allowedSorts.includes(sort) ? sort : 'date';

  const events = db.prepare(`SELECT * FROM events WHERE ${where} ORDER BY ${sortCol} ${order === 'ASC' ? 'ASC' : 'DESC'} LIMIT ? OFFSET ?`).all(...params, parseInt(limit), offset);
  const total = db.prepare(`SELECT COUNT(*) as count FROM events WHERE ${where}`).get(...params).count;

  // Add availability info
  const enriched = events.map(e => ({
    ...e,
    available_spots: e.capacity - e.reserved_count,
    is_full: e.reserved_count >= e.capacity
  }));

  res.json({ success: true, data: enriched, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
});

// GET /api/events/:id
router.get('/:id', optionalAuth, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  // Get comments for this event
  const comments = db.prepare(`
    SELECT c.*, u.full_name, u.avatar FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.event_id = ? AND c.is_approved = 1
    ORDER BY c.created_at DESC
  `).all(event.id);

  res.json({
    success: true,
    data: {
      ...event,
      available_spots: event.capacity - event.reserved_count,
      is_full: event.reserved_count >= event.capacity,
      comments
    }
  });
});

// POST /api/events - Admin only
router.post('/', authenticate, adminOnly, (req, res) => {
  const { title, description, date, time, capacity, price, instructor, image_url, location, category, duration_hours, level } = req.body;
  if (!title || !date || !time || !instructor) {
    return res.status(400).json({ success: false, message: 'Title, date, time and instructor are required' });
  }
  const result = db.prepare(`
    INSERT INTO events (title, description, date, time, capacity, price, instructor, image_url, location, category, duration_hours, level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, description, date, time, capacity || 20, price || 0, instructor, image_url, location, category || 'workshop', duration_hours || 2, level || 'beginner');
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: event });
});

// PUT /api/events/:id - Admin only
router.put('/:id', authenticate, adminOnly, (req, res) => {
  const { title, description, date, time, capacity, price, instructor, image_url, location, category, duration_hours, level, is_active } = req.body;
  db.prepare(`
    UPDATE events SET title=?, description=?, date=?, time=?, capacity=?, price=?, instructor=?, 
    image_url=?, location=?, category=?, duration_hours=?, level=?, is_active=? WHERE id=?
  `).run(title, description, date, time, capacity, price, instructor, image_url, location, category, duration_hours, level, is_active ? 1 : 0, req.params.id);
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: event });
});

// DELETE /api/events/:id - Admin only
router.delete('/:id', authenticate, adminOnly, (req, res) => {
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Event deleted' });
});

module.exports = router;
