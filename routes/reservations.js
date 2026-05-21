const express = require('express');
const db = require('../database/init');
const { authenticate, adminOnly } = require('../middleware/auth');
const router = express.Router();

// GET /api/reservations - Get user's reservations
router.get('/', authenticate, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const query = isAdmin
    ? `SELECT r.*, e.title as event_title, e.date, e.time, e.location, e.image_url as event_image,
              u.full_name as user_name, u.email as user_email
       FROM reservations r
       JOIN events e ON r.event_id = e.id
       JOIN users u ON r.user_id = u.id
       ORDER BY r.created_at DESC`
    : `SELECT r.*, e.title as event_title, e.date, e.time, e.location, e.image_url as event_image, e.instructor
       FROM reservations r
       JOIN events e ON r.event_id = e.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`;

  const reservations = isAdmin ? db.prepare(query).all() : db.prepare(query).all(req.user.id);
  res.json({ success: true, data: reservations });
});

// POST /api/reservations - Create reservation
router.post('/', authenticate, (req, res) => {
  const { event_id, participant_count = 1, reservation_date, reservation_time, notes } = req.body;
  if (!event_id) return res.status(400).json({ success: false, message: 'event_id is required' });

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(event_id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  const available = event.capacity - event.reserved_count;
  if (participant_count > available) {
    return res.status(400).json({ success: false, message: `Only ${available} spots available` });
  }

  const total_price = event.price * participant_count;
  const result = db.prepare(`
    INSERT INTO reservations (user_id, event_id, participant_count, reservation_date, reservation_time, status, total_price, notes)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(req.user.id, event_id, participant_count, reservation_date || event.date, reservation_time || event.time, total_price, notes || null);

  db.prepare('UPDATE events SET reserved_count = reserved_count + ? WHERE id = ?').run(participant_count, event_id);

  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, message: 'Reservation created', data: reservation });
});

// PUT /api/reservations/:id - Update reservation
router.put('/:id', authenticate, (req, res) => {
  const { participant_count, reservation_date, reservation_time, notes } = req.body;
  const res_record = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  if (!res_record) return res.status(404).json({ success: false, message: 'Reservation not found' });
  if (res_record.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (res_record.status === 'cancelled') {
    return res.status(400).json({ success: false, message: 'Cannot update a cancelled reservation' });
  }

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(res_record.event_id);
  const diff = participant_count - res_record.participant_count;
  const available = event.capacity - event.reserved_count;
  if (diff > available) {
    return res.status(400).json({ success: false, message: `Only ${available} additional spots available` });
  }

  const total_price = event.price * participant_count;
  db.prepare(`UPDATE reservations SET participant_count=?, reservation_date=?, reservation_time=?, total_price=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
    .run(participant_count, reservation_date || res_record.reservation_date, reservation_time || res_record.reservation_time, total_price, notes, req.params.id);

  if (diff !== 0) {
    db.prepare('UPDATE events SET reserved_count = reserved_count + ? WHERE id = ?').run(diff, event.id);
  }

  const updated = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

// DELETE /api/reservations/:id - Cancel reservation
router.delete('/:id', authenticate, (req, res) => {
  const res_record = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  if (!res_record) return res.status(404).json({ success: false, message: 'Reservation not found' });
  if (res_record.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (res_record.status === 'cancelled') {
    return res.status(400).json({ success: false, message: 'Already cancelled' });
  }

  db.prepare("UPDATE reservations SET status='cancelled', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(req.params.id);
  db.prepare('UPDATE events SET reserved_count = MAX(0, reserved_count - ?) WHERE id = ?').run(res_record.participant_count, res_record.event_id);
  res.json({ success: true, message: 'Reservation cancelled' });
});

// PUT /api/reservations/:id/confirm - Admin confirm
router.put('/:id/confirm', authenticate, adminOnly, (req, res) => {
  db.prepare("UPDATE reservations SET status='confirmed', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(req.params.id);
  res.json({ success: true, message: 'Reservation confirmed' });
});

module.exports = router;
