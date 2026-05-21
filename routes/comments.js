const express = require('express');
const db = require('../database/init');
const { authenticate, adminOnly } = require('../middleware/auth');
const router = express.Router();

// GET /api/comments?artwork_id=&event_id=&sort=newest
router.get('/', (req, res) => {
  const { artwork_id, event_id, sort = 'newest', page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let conditions = ['c.is_approved = 1'];
  let params = [];
  if (artwork_id) { conditions.push('c.artwork_id = ?'); params.push(artwork_id); }
  if (event_id) { conditions.push('c.event_id = ?'); params.push(event_id); }

  const sortMap = { 
    newest: 'c.created_at DESC', 
    highest: 'c.rating DESC', 
    helpful: 'c.helpful_count DESC' 
  };
  const orderBy = sortMap[sort] || 'c.created_at DESC';

  const where = conditions.join(' AND ');
  const comments = db.prepare(`
    SELECT c.*, u.full_name, u.avatar,
           (SELECT reply FROM comment_replies WHERE comment_id = c.id LIMIT 1) as admin_reply,
           (SELECT created_at FROM comment_replies WHERE comment_id = c.id LIMIT 1) as reply_date,
           IFNULL(c.score, c.helpful_count) as score
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM comments c WHERE ${where}`).get(...params).count;
  const avgRating = db.prepare(`SELECT AVG(rating) as avg FROM comments c WHERE ${where} AND rating IS NOT NULL`).get(...params);

  res.json({ success: true, data: comments, total, average_rating: avgRating?.avg?.toFixed(1) || null, pages: Math.ceil(total / limit) });
});

// POST /api/comments
router.post('/', authenticate, (req, res) => {
  const { artwork_id, event_id, rating, comment } = req.body;
  if (!comment) return res.status(400).json({ success: false, message: 'Comment text is required' });
  if (!artwork_id && !event_id) return res.status(400).json({ success: false, message: 'artwork_id or event_id required' });

  // Check verified purchase
  let is_verified = 0;
  if (artwork_id) {
    const purchased = db.prepare(`
      SELECT oi.id FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = ? AND oi.artwork_id = ? AND o.payment_status = 'paid'
    `).get(req.user.id, artwork_id);
    if (purchased) {
      is_verified = 1;
    }
  }
  if (event_id) {
    const attended = db.prepare(`
      SELECT id FROM reservations WHERE user_id = ? AND event_id = ? AND status = 'confirmed'
    `).get(req.user.id, event_id);
    if (attended) {
      is_verified = 1;
    } else {
      return res.status(403).json({ success: false, message: 'Etkinliğe yorum yapabilmek için katılmış olmalısınız' });
    }
  }

  const result = db.prepare(`
    INSERT INTO comments (user_id, artwork_id, event_id, rating, comment, is_verified)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.user.id, artwork_id || null, event_id || null, rating || null, comment, is_verified);

  // Update artwork average rating
  if (artwork_id) {
    const avg = db.prepare('SELECT AVG(rating) as avg FROM comments WHERE artwork_id = ? AND rating IS NOT NULL').get(artwork_id);
    db.prepare('UPDATE artworks SET average_rating = ? WHERE id = ?').run(avg.avg || 0, artwork_id);
  }

  const newComment = db.prepare('SELECT c.*, u.full_name, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: newComment });
});

// POST /api/comments/:id/helpful - Mark helpful (Legacy)
router.post('/:id/helpful', authenticate, (req, res) => {
  const existing = db.prepare('SELECT id FROM comment_votes WHERE user_id = ? AND comment_id = ?').get(req.user.id, req.params.id);
  if (existing) return res.status(400).json({ success: false, message: 'Bu yorumu zaten faydalı olarak işaretlediniz' });

  db.prepare('INSERT INTO comment_votes (user_id, comment_id, vote_value) VALUES (?, ?, 1)').run(req.user.id, req.params.id);
  db.prepare('UPDATE comments SET helpful_count = helpful_count + 1, score = score + 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Marked as helpful' });
});

// POST /api/comments/:id/vote - Upvote/Downvote comment
router.post('/:id/vote', authenticate, (req, res) => {
  const { vote } = req.body; // 1 or -1
  const voteValue = parseInt(vote) === 1 ? 1 : -1;
  const existing = db.prepare('SELECT id, vote_value FROM comment_votes WHERE user_id = ? AND comment_id = ?').get(req.user.id, req.params.id);

  if (existing) {
    if (existing.vote_value === voteValue) {
      // Remove vote
      db.prepare('DELETE FROM comment_votes WHERE id = ?').run(existing.id);
      db.prepare('UPDATE comments SET score = score - ? WHERE id = ?').run(voteValue, req.params.id);
      return res.json({ success: true, message: 'Vote removed' });
    } else {
      // Change vote
      db.prepare('UPDATE comment_votes SET vote_value = ? WHERE id = ?').run(voteValue, existing.id);
      db.prepare('UPDATE comments SET score = score + ? WHERE id = ?').run(voteValue * 2, req.params.id);
      return res.json({ success: true, message: 'Vote updated' });
    }
  }

  // New vote
  db.prepare('INSERT INTO comment_votes (user_id, comment_id, vote_value) VALUES (?, ?, ?)').run(req.user.id, req.params.id, voteValue);
  db.prepare('UPDATE comments SET score = score + ? WHERE id = ?').run(voteValue, req.params.id);
  res.json({ success: true, message: 'Vote added' });
});

// POST /api/comments/:id/reply - Admin reply
router.post('/:id/reply', authenticate, adminOnly, (req, res) => {
  const { reply } = req.body;
  if (!reply) return res.status(400).json({ success: false, message: 'Reply text required' });
  const comment = db.prepare('SELECT id FROM comments WHERE id = ?').get(req.params.id);
  if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

  db.prepare('INSERT INTO comment_replies (comment_id, admin_id, reply) VALUES (?, ?, ?)').run(req.params.id, req.user.id, reply);
  res.status(201).json({ success: true, message: 'Reply added' });
});

// DELETE /api/comments/:id - Admin or owner
router.delete('/:id', authenticate, (req, res) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
  if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
  if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);

  if (comment.artwork_id) {
    const avg = db.prepare('SELECT AVG(rating) as avg FROM comments WHERE artwork_id = ? AND rating IS NOT NULL').get(comment.artwork_id);
    db.prepare('UPDATE artworks SET average_rating = ? WHERE id = ?').run(avg.avg || 0, comment.artwork_id);
  }
  res.json({ success: true, message: 'Comment deleted' });
});

// PUT /api/comments/:id/approve - Admin approve/disapprove
router.put('/:id/approve', authenticate, adminOnly, (req, res) => {
  const { is_approved } = req.body;
  db.prepare('UPDATE comments SET is_approved = ? WHERE id = ?').run(is_approved ? 1 : 0, req.params.id);
  res.json({ success: true, message: `Comment ${is_approved ? 'approved' : 'hidden'}` });
});

module.exports = router;
