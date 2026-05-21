# 🎨 ArtVault — Online Art Gallery & Workshop Reservation System

ArtVault is a full-stack web application for browsing and purchasing original artworks, reserving artist-led workshops, and managing an online gallery experience — built on a rich relational SQLite database with **better-sqlite3**.

---

## 🗄️ Database Architecture

The heart of ArtVault is its SQLite database (`artgallery.db`), designed with 17 normalized tables, foreign key constraints, WAL mode for performance, and carefully placed indexes.

### Schema Overview

```
users          → artists         → artworks
    ↓                                  ↓
orders ──── order_items          favorites
    ↓                                  ↓
coupons                          comments ──── comment_replies
                                              └─ comment_votes
events
    ↓
reservations

cart_items
support_tickets ──── ticket_replies
password_resets
comparisons
```

### Tables

| Table | Description |
|---|---|
| `users` | Customers and admins with role-based access (`admin` / `customer`) |
| `artists` | Artist profiles with bio, style, social links |
| `artworks` | Artworks with category, price, stock, ratings, featured flag, discounts |
| `events` | Workshops and masterclasses with capacity, level, instructor |
| `reservations` | Event bookings linked to users, with status tracking |
| `orders` | Purchase orders with payment method and order status |
| `order_items` | Line items per order (artwork + quantity + price) |
| `cart_items` | Persistent shopping cart per user |
| `favorites` | User–artwork save list (unique pair constraint) |
| `comments` | Ratings and reviews for artworks or events |
| `comment_replies` | Admin replies to comments |
| `comment_votes` | Helpful votes per comment (one vote per user per comment) |
| `coupons` | Discount codes with usage limits, expiry, and minimum order amount |
| `support_tickets` | Customer support requests with priority and status |
| `ticket_replies` | Thread replies for each support ticket |
| `comparisons` | Saved item comparison sessions |
| `password_resets` | Tokenized password reset flow with expiry |

### Key Design Decisions

- **WAL mode** (`PRAGMA journal_mode = WAL`) for concurrent read performance
- **Foreign keys enabled** (`PRAGMA foreign_keys = ON`) with `ON DELETE CASCADE` on all child tables
- **Indexes** on every high-traffic lookup column (email, category, artist, user, status, date)
- **CHECK constraints** enforce valid enums inline (roles, statuses, payment methods, levels)
- **UNIQUE constraints** prevent duplicate favorites, cart items, and votes without application-layer checks

---

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (synchronous, zero-config)
- **Auth**: JWT (`jsonwebtoken`) + bcrypt password hashing
- **File Uploads**: Multer
- **CORS**: enabled for API access

---

## 📁 Project Structure

```
artgallery-system/
├── server.js              # Express app entry point
├── database/
│   ├── init.js            # Schema creation + DB connection
│   └── seed.js            # Sample data (artists, artworks, events, users)
├── routes/
│   ├── auth.js
│   ├── artworks.js
│   ├── artists.js
│   ├── events.js
│   ├── reservations.js
│   ├── orders.js
│   ├── cart.js
│   ├── favorites.js
│   ├── comments.js
│   ├── coupons.js
│   ├── support.js
│   ├── users.js
│   └── admin.js
├── middleware/
│   └── auth.js            # JWT authenticate, optionalAuth, adminOnly
├── public/                # Frontend static files
└── uploads/               # User-uploaded images
```

---

## ⚙️ Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/artvault.git
cd artvault

# Install Node.js dependencies
npm install

# Initialize database schema
npm run init-db

# Seed with sample data
npm run seed

# Start development server
npm run dev
```

Server runs at `http://localhost:3000`  
Admin dashboard at `http://localhost:3000/admin.html`

### Default credentials (after seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@artgallery.com | admin123 |
| Customer | ahmet@example.com | user123 |

---

## 🔐 Auth & Roles

JWT-based authentication with three middleware levels:

- `authenticate` — requires valid token
- `optionalAuth` — proceeds with or without token
- `adminOnly` — restricts to `role = 'admin'`

Tokens are signed with `JWT_SECRET` from `.env` and expire after 7 days.

---

## 📦 Environment Variables

```env
PORT=3000
JWT_SECRET=your_secret_here
NODE_ENV=development
```

---

## 📄 License

MIT
