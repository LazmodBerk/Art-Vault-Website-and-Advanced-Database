const express = require('express');
const db = require('../database/init');
const { authenticate, adminOnly } = require('../middleware/auth');
const router = express.Router();

// GET /api/admin/dashboard - Stats overview
router.get('/dashboard', authenticate, adminOnly, (req, res) => {
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role='customer'").get().count;
  const totalOrders = db.prepare("SELECT COUNT(*) as count FROM orders").get().count;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status='paid'").get().total;
  const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status='processing'").get().count;
  const totalArtworks = db.prepare("SELECT COUNT(*) as count FROM artworks").get().count;
  const totalEvents = db.prepare("SELECT COUNT(*) as count FROM events").get().count;
  const totalReservations = db.prepare("SELECT COUNT(*) as count FROM reservations WHERE status='confirmed'").get().count;
  const openTickets = db.prepare("SELECT COUNT(*) as count FROM support_tickets WHERE status IN ('open','in_progress')").get().count;

  // Top artworks by view count
  const topArtworks = db.prepare(`
    SELECT a.id, a.title, a.image_url, a.view_count, a.average_rating, a.price, ar.name as artist_name,
           (SELECT COUNT(*) FROM favorites f WHERE f.artwork_id = a.id) as likes_count,
           (SELECT COUNT(*) FROM comments c WHERE c.artwork_id = a.id) as comments_count
    FROM artworks a LEFT JOIN artists ar ON a.artist_id = ar.id
    ORDER BY a.view_count DESC LIMIT 5
  `).all();

  // Top events by reservations
  const topEvents = db.prepare(`
    SELECT e.id, e.title, e.reserved_count, e.capacity, e.price,
           ROUND(CAST(e.reserved_count AS FLOAT) / NULLIF(e.capacity, 0) * 100, 1) as fill_rate,
           (SELECT COUNT(*) FROM comments c WHERE c.event_id = e.id) as comments_count
    FROM events e ORDER BY e.reserved_count DESC LIMIT 5
  `).all();

  // Revenue by month (last 6 months)
  const revenueByMonth = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, 
           SUM(total_amount) as revenue, COUNT(*) as order_count
    FROM orders WHERE payment_status='paid'
    AND created_at >= date('now', '-6 months')
    GROUP BY month ORDER BY month ASC
  `).all();

  // Order status distribution
  const orderStatusDist = db.prepare(`
    SELECT order_status, COUNT(*) as count FROM orders GROUP BY order_status
  `).all();

  // Recent orders
  const recentOrders = db.prepare(`
    SELECT o.*, u.full_name, u.email FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC LIMIT 5
  `).all();

  // Category distribution
  const categoryDist = db.prepare(`
    SELECT category, COUNT(*) as count, AVG(price) as avg_price FROM artworks GROUP BY category
  `).all();

  res.json({
    success: true,
    data: {
      stats: { totalUsers, totalOrders, totalRevenue, pendingOrders, totalArtworks, totalEvents, totalReservations, openTickets },
      topArtworks,
      topEvents,
      revenueByMonth,
      orderStatusDist,
      recentOrders,
      categoryDist
    }
  });
});

// GET /api/admin/reports/sales
router.get('/reports/sales', authenticate, adminOnly, (req, res) => {
  const { period = '30' } = req.query;
  const sales = db.prepare(`
    SELECT strftime('%Y-%m-%d', o.created_at) as date,
           COUNT(o.id) as orders, SUM(o.total_amount) as revenue
    FROM orders o
    WHERE o.payment_status = 'paid' AND o.created_at >= date('now', ? || ' days')
    GROUP BY date ORDER BY date ASC
  `).all(`-${period}`);

  const topProducts = db.prepare(`
    SELECT a.title, a.image_url, SUM(oi.quantity) as total_sold, SUM(oi.price * oi.quantity) as total_revenue
    FROM order_items oi
    JOIN artworks a ON oi.artwork_id = a.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.payment_status = 'paid'
    GROUP BY oi.artwork_id ORDER BY total_sold DESC LIMIT 10
  `).all();

  res.json({ success: true, data: { sales, topProducts } });
});

// GET /api/admin/reports/users
router.get('/reports/users', authenticate, adminOnly, (req, res) => {
  const userGrowth = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as new_users
    FROM users WHERE role = 'customer'
    GROUP BY month ORDER BY month DESC LIMIT 12
  `).all();

  const topSpenders = db.prepare(`
    SELECT u.id, u.full_name, u.email, u.avatar,
           COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent
    FROM users u JOIN orders o ON u.id = o.user_id
    WHERE o.payment_status = 'paid'
    GROUP BY u.id ORDER BY total_spent DESC LIMIT 10
  `).all();

  res.json({ success: true, data: { userGrowth, topSpenders } });
});

module.exports = router;
