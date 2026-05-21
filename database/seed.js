const db = require('./init');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🌱 Starting database seed...');

  // Hash passwords
  const adminPass = bcrypt.hashSync('admin123', 10);
  const userPass = bcrypt.hashSync('user123', 10);

  // Seed Users
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (full_name, email, password_hash, role, phone, avatar)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('Admin User', 'admin@artgallery.com', adminPass, 'admin', '+90 555 001 0001', '/images/avatars/admin.jpg');
  insertUser.run('Ahmet Yılmaz', 'ahmet@example.com', userPass, 'customer', '+90 555 123 4567', '/images/avatars/user1.jpg');
  insertUser.run('Elif Kaya', 'elif@example.com', userPass, 'customer', '+90 555 234 5678', '/images/avatars/user2.jpg');
  insertUser.run('Mehmet Demir', 'mehmet@example.com', userPass, 'customer', '+90 555 345 6789', '/images/avatars/user3.jpg');
  insertUser.run('Zeynep Arslan', 'zeynep@example.com', userPass, 'customer', '+90 555 456 7890', '/images/avatars/user4.jpg');
  console.log('✅ Users seeded');

  // Seed Artists
  const insertArtist = db.prepare(`
    INSERT OR IGNORE INTO artists (name, bio, avatar, country, birth_year, style, website, instagram)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertArtist.run('Ayla Çelik', 'Contemporary Turkish artist known for abstract expressionism and bold color usage. Her works explore themes of identity and cultural heritage.', '/images/artists/artist1.jpg', 'Turkey', 1985, 'Abstract Expressionism', 'https://aylacelk.art', '@aylacelk_art');
  insertArtist.run('Marco Rossi', 'Italian master of realism, specializing in portrait and landscape paintings. Winner of multiple European art prizes.', '/images/artists/artist2.jpg', 'Italy', 1972, 'Classical Realism', 'https://marcorossi.it', '@marcorossi_art');
  insertArtist.run('Yuki Tanaka', 'Japanese minimalist artist whose work bridges traditional ink painting with modern digital concepts.', '/images/artists/artist3.jpg', 'Japan', 1990, 'Minimalism', 'https://yukitanaka.jp', '@yuki_tanaka_art');
  insertArtist.run('Sofia Andreeva', 'Russian avant-garde sculptor and mixed media artist exploring the intersection of nature and technology.', '/images/artists/artist4.jpg', 'Russia', 1988, 'Avant-Garde', 'https://sofiaandreeva.ru', '@sofia_art_studio');
  insertArtist.run('Carlos Mendez', 'Mexican muralist and oil painter celebrated for vibrant cultural narratives and political commentary.', '/images/artists/artist5.jpg', 'Mexico', 1979, 'Muralism', 'https://carlosmendez.mx', '@carlos_mendez_mx');
  insertArtist.run('Emma Laurent', 'French impressionist painter with a romantic, dreamy style inspired by Provence landscapes.', '/images/artists/artist6.jpg', 'France', 1983, 'Impressionism', 'https://emmalaurent.fr', '@emma_laurent_art');
  console.log('✅ Artists seeded');

  // Seed Artworks
  const insertArtwork = db.prepare(`
    INSERT OR IGNORE INTO artworks (title, description, category, artist_id, price, stock, image_url, view_count, average_rating, is_featured, discount_percent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const artworks = [
    ['Rüyalar Arasında', 'Ayla Çelik\'in sembol haline gelen bu eseri, bilinçaltını ve hayalleri soyut formlarla anlatıyor. Altın ve siyah renklerin dansı izleyiciyi derinliklere çekiyor.', 'Abstract', 1, 12500, 1, 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800', 342, 4.8, 1, 0],
    ['Mavi Sessizlik', 'Derin mavi tonları ve beyazın harmonisi ile oluşturulan bu eser, huzur ve sonsuzluk duygusunu yansıtıyor.', 'Abstract', 1, 8900, 2, 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=800', 217, 4.6, 0, 10],
    ['Floransa Günbatımı', 'Marco Rossi\'nin Floransa sokaklarındaki günbatımını yakaladığı bu realist şaheser, şehrin ruhunu tuvaline taşıyor.', 'Landscape', 2, 25000, 1, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800', 521, 4.9, 1, 0],
    ['Portofino Masalı', 'İtalyan Rivierası\'nın büyüleyici atmosferini yansıtan bu tablo, ışık ve gölge oyunlarıyla hayata geçirilmiş.', 'Landscape', 2, 19500, 1, 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800', 298, 4.7, 0, 15],
    ['Boşluğun Şiiri', 'Yuki Tanaka\'nın minimalist yaklaşımıyla oluşturduğu bu eser, her baktığınızda farklı bir anlam taşıyor.', 'Minimalist', 3, 7800, 3, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800', 189, 4.5, 0, 0],
    ['Siyah Bambular', 'Geleneksel Japon mürekkep sanatını çağdaş yorumla buluşturan bu eser, sanatçının imza tarzını yansıtıyor.', 'Minimalist', 3, 6500, 2, 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=800', 156, 4.4, 0, 20],
    ['Metal ve Doğa', 'Sofia Andreeva\'nın paslanmaz çelik ve organik elementleri birleştirdiği heykel, endüstri ile doğanın diyaloğunu kuruyor.', 'Sculpture', 4, 35000, 1, 'https://images.unsplash.com/photo-1604076913837-52ab5629fde9?w=800', 412, 4.8, 1, 0],
    ['Kaya Ruhu', 'Doğal taşlar ve metal alaşımlardan oluşan bu heykel, yer çekimini ve denge kavramını sorguluyor.', 'Sculpture', 4, 28000, 1, 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800', 234, 4.6, 0, 0],
    ['Zaferin Renkleri', 'Carlos Mendez\'in Meksika kültürünü onurlandırdığı bu devasa tuval, canlı renkleriyle nefes kesiyor.', 'Cultural', 5, 45000, 1, 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=800', 678, 4.9, 1, 0],
    ['Pazar Sabahı', 'Renkli bir Meksika pazarının enerjisini yakalayan bu yağlıboya, izleyiciyi o kalabalığın içine çekiyor.', 'Cultural', 5, 15000, 2, 'https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?w=800', 345, 4.7, 0, 0],
    ['Lavanta Rüyası', 'Emma Laurent\'ın Provence tarlalarını empresyonist teknikle yorumladığı bu eser, sıcaklık ve huzur yayıyor.', 'Impressionist', 6, 22000, 1, 'https://images.unsplash.com/photo-1541698444083-023c97d3f4b6?w=800', 389, 4.8, 1, 0],
    ['Yağmur Sonrası Paris', 'Yağmurdan sonra ışıl ışıl parlayan Paris sokaklarını anlatan bu eser, romantizmin doruk noktasını yansıtıyor.', 'Impressionist', 6, 18500, 1, 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=800', 267, 4.6, 0, 5],
  ];

  for (const artwork of artworks) {
    insertArtwork.run(...artwork);
  }
  console.log('✅ Artworks seeded');

  // Seed Events
  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO events (title, description, date, time, capacity, reserved_count, price, instructor, image_url, location, category, duration_hours, level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const events = [
    ['Suluboya Başlangıç Atölyesi', 'Suluboya tekniklerini sıfırdan öğrenin. Su kontrolü, renk karıştırma ve temel teknikler bu atölyede ele alınacak.', '2026-06-15', '10:00', 15, 8, 850, 'Ayla Çelik', 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?w=800', 'Karaköy Sanat Merkezi, İstanbul', 'workshop', 3, 'beginner'],
    ['Yağlıboya Portre Teknikleri', 'Yağlıboya ile portre çiziminin inceliklerini öğrenin. Işık-gölge, ten renkleri ve yüz anatomisi işlenecek.', '2026-06-20', '14:00', 12, 5, 1200, 'Marco Rossi', 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800', 'Beyoğlu Sanat Galerisi, İstanbul', 'workshop', 4, 'intermediate'],
    ['Japon Mürekkep Sanatı', 'Geleneksel Japon sumi-e mürekkep tekniklerini öğrenin. Bambu, çiçek ve manzara çalışmaları yapılacak.', '2026-06-25', '11:00', 10, 10, 950, 'Yuki Tanaka', 'https://images.unsplash.com/photo-1593073862407-a3ce22748763?w=800', 'Galata Kültür Merkezi, İstanbul', 'workshop', 3, 'beginner'],
    ['Heykel ve Seramik Atölyesi', 'Kil ve seramik malzemeleriyle üç boyutlu form oluşturmayı öğrenin. Fırın pişirme süreci dahildir.', '2026-07-05', '10:00', 8, 3, 1500, 'Sofia Andreeva', 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800', 'Kadıköy Sanat Evi, İstanbul', 'workshop', 5, 'beginner'],
    ['Empresyonizm Masterclass', 'Fransız empresyonizm geleneğini modern bir bakış açısıyla keşfedin. Açık hava boyama egzersizleri yapılacak.', '2026-07-10', '09:00', 15, 6, 1800, 'Emma Laurent', 'https://images.unsplash.com/photo-1500462918081-acca4aa596b0?w=800', 'Büyükada, İstanbul', 'masterclass', 6, 'intermediate'],
    ['Dijital Sanat ve Fotoğrafçılık', 'Dijital araçlarla sanatsal fotoğrafçılık ve post-processing tekniklerini öğrenin.', '2026-07-15', '13:00', 20, 12, 750, 'Admin User', 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800', 'Online - Zoom', 'workshop', 2, 'beginner'],
    ['Meksika Sanat ve Kültür Atölyesi', 'Meksika geleneksel sanatını ve renkli kültürünü tuvalinize yansıtın. Carlos Mendez rehberliğinde eşsiz bir deneyim.', '2026-07-20', '10:00', 15, 7, 1100, 'Carlos Mendez', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 'Nişantaşı Kültür Merkezi, İstanbul', 'workshop', 4, 'beginner'],
    ['İleri Seviye Soyut Sanat', 'Kendi sanatsal sesinizi bulun. Deneysel teknikler ve materyal araştırmaları bu masterclass\'ın odağında.', '2026-07-25', '11:00', 10, 4, 2200, 'Ayla Çelik', 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=800', 'Levent Sanat Galerisi, İstanbul', 'masterclass', 6, 'advanced'],
  ];

  for (const event of events) {
    insertEvent.run(...event);
  }
  console.log('✅ Events seeded');

  // Seed Coupons
  const insertCoupon = db.prepare(`
    INSERT OR IGNORE INTO coupons (code, discount_percent, expiration_date, usage_limit, is_active, min_order_amount)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertCoupon.run('WELCOME20', 20, '2026-12-31', 500, 1, 0);
  insertCoupon.run('SANAT15', 15, '2026-08-31', 200, 1, 5000);
  insertCoupon.run('VIP30', 30, '2026-06-30', 50, 1, 10000);
  insertCoupon.run('SUMMER10', 10, '2026-09-01', 300, 1, 0);
  insertCoupon.run('ATOLYE25', 25, '2026-07-31', 100, 1, 500);
  console.log('✅ Coupons seeded');

  // Seed some comments
  const insertComment = db.prepare(`
    INSERT OR IGNORE INTO comments (user_id, artwork_id, rating, comment, is_verified)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertComment.run(2, 1, 5, 'Muhteşem bir eser! Renklerin uyumu büyüleyici, odamın en değerli parçası oldu.', 1);
  insertComment.run(3, 1, 4, 'Gerçekten etkileyici bir çalışma. Kare fotoğraftan çok daha güzel göründü fiziksel olarak.', 0);
  insertComment.run(4, 3, 5, 'Marco Rossi\'nin en iyi işlerinden biri. Floransa\'nın ruhunu tam yakalamış.', 1);
  insertComment.run(2, 7, 5, 'Heykel inanılmaz! Boyutları ve ağırlığı beklentilerimin üzerindeydi. Süper paketleme.', 1);
  insertComment.run(5, 11, 4, 'Lavanta tarlasının kokusu bile var gibi. Çok canlı ve huzur verici.', 0);
  insertComment.run(3, 9, 5, 'Zaferin Renkleri gerçekten görülesi bir eser. Her detay mükemmel işlenmiş.', 1);
  console.log('✅ Comments seeded');

  // Seed some orders and reservations
  const insertOrder = db.prepare(`
    INSERT OR IGNORE INTO orders (user_id, total_amount, payment_method, payment_status, order_status)
    VALUES (?, ?, ?, ?, ?)
  `);

  const orderId1 = insertOrder.run(2, 12500, 'credit_card', 'paid', 'delivered').lastInsertRowid;
  const orderId2 = insertOrder.run(3, 34500, 'paypal', 'paid', 'confirmed').lastInsertRowid;
  const orderId3 = insertOrder.run(4, 7800, 'bank_transfer', 'pending', 'processing').lastInsertRowid;

  const insertOrderItem = db.prepare(`
    INSERT OR IGNORE INTO order_items (order_id, artwork_id, quantity, price)
    VALUES (?, ?, ?, ?)
  `);
  insertOrderItem.run(orderId1, 1, 1, 12500);
  insertOrderItem.run(orderId2, 3, 1, 25000);
  insertOrderItem.run(orderId2, 11, 1, 9500);
  insertOrderItem.run(orderId3, 5, 1, 7800);
  console.log('✅ Orders seeded');

  const insertReservation = db.prepare(`
    INSERT OR IGNORE INTO reservations (user_id, event_id, participant_count, reservation_date, status, total_price)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertReservation.run(2, 1, 2, '2026-06-15', 'confirmed', 1700);
  insertReservation.run(3, 2, 1, '2026-06-20', 'confirmed', 1200);
  insertReservation.run(4, 4, 1, '2026-07-05', 'pending', 1500);
  insertReservation.run(5, 5, 2, '2026-07-10', 'confirmed', 3600);
  console.log('✅ Reservations seeded');

  // Seed support tickets
  const insertTicket = db.prepare(`
    INSERT OR IGNORE INTO support_tickets (user_id, subject, message, status)
    VALUES (?, ?, ?, ?)
  `);
  insertTicket.run(2, 'Kargom nerede?', 'Sipariş #1 için kargo takip bilgisi almak istiyorum. 3 gün geçti haber yok.', 'resolved');
  insertTicket.run(3, 'Rezervasyon değişikliği', 'Atölye rezervasyonumu bir hafta ileriye almak istiyorum mümkün mü?', 'in_progress');
  insertTicket.run(4, 'İade talebi', 'Aldığım eserin fotoğraftakinden farklı göründüğünü düşünüyorum, iade mümkün mü?', 'open');
  console.log('✅ Support tickets seeded');

  console.log('\n🎉 Database seeded successfully!');
  console.log('📧 Admin: admin@artgallery.com / admin123');
  console.log('📧 User: ahmet@example.com / user123');
}

seed().catch(console.error);
