// seed.js — bersihkan & isi ulang database dengan data awal
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'invito_db',
  password: 'lupasandi1224',
  port: 5432,
});

async function run() {
  // ✅ 1) Bersihkan semua tabel sekaligus (CASCADE = aman untuk foreign key)
  await pool.query(`
    TRUNCATE TABLE
      notifications, activity_logs, custom_domains, digital_envelopes,
      rsvps, guests, transactions, invitations, packages, admins, users
    RESTART IDENTITY CASCADE
  `);
  console.log('✅ Semua tabel dibersihkan.');

  // ✅ 2) Akun admin utama (password: password123)
  const hash = await bcrypt.hash('password123', 10);
  const userRes = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4) RETURNING id, name, email, role`,
    ['Anisa Rahmawati', 'anisa@email.com', hash, 'Admin Utama'],
  );
  const userId = userRes.rows[0].id;
  console.log('✅ Akun admin dibuat:', userRes.rows[0]);

  // ✅ 3) Paket
  const pkgRes = await pool.query(
    `INSERT INTO packages (code, name, subtitle, price, original_price, is_popular)
     VALUES
       ('basic',    'Basic',    'Untuk pasangan yang ingin memulai',   99000,  NULL,   false),
       ('standard', 'Standard', 'Paling populer untuk pasangan',      199000, 299000, true),
       ('premium',  'Premium',  'Pengalaman undangan paling lengkap', 349000, 499000, false)
     RETURNING id`,
  );
  const basicId = pkgRes.rows[0].id;
  const standardId = pkgRes.rows[1].id;
  console.log('✅ 3 paket dibuat.');

  // ✅ 4) Undangan contoh
  const invRes = await pool.query(
    `INSERT INTO invitations
       (user_id, package_id, invoice_number, couple_name, bride_name, groom_name, wedding_date, theme, status, visits, is_active)
     VALUES
       ($1, $2, 'INV-20250112-001', 'Anisa & Raka', 'Anisa Rahmawati', 'Raka Pratama', '2025-01-12', 'Elegant', 'Published', 2847, true),
       ($1, $3, 'INV-20250115-002', 'Putri & Dimas', 'Putri Ayu', 'Dimas Putra', '2025-01-15', 'Floral', 'Draft', 0, false)
     RETURNING id`,
    [userId, standardId, basicId],
  );
  const inv1 = invRes.rows[0].id;
  console.log('✅ 2 undangan dibuat.');

  // ✅ 5) Tamu contoh
  const guestRes = await pool.query(
    `INSERT INTO guests (invitation_id, name, whatsapp, table_number, category, check_in_status, rsvp_status)
     VALUES
       ($1, 'Budi Santoso',   '081234567890', 'Meja 1', 'Regular', 'Sudah Check-In',  'Hadir'),
       ($1, 'Siti Aminah',    '089876543210', 'Meja 1', 'Regular', 'Belum Check-In', 'Tidak Hadir'),
       ($1, 'Andi Pratama',   '085678901234', 'Meja 2', 'Regular', 'Sudah Check-In',  'Hadir'),
       ($1, 'Dewi Lestari',   '081122334455', 'Meja 2', 'VIP',     'Belum Check-In', 'Hadir'),
       ($1, 'Rizky Ramadhan', '087788990011', 'Meja 3', 'Regular', 'Belum Check-In', 'Masih Ragu')
     RETURNING id`,
    [inv1],
  );
  const g = guestRes.rows.map((r) => r.id);
  console.log('✅ 5 tamu dibuat.');

  // ✅ 6) RSVP contoh
  await pool.query(
    `INSERT INTO rsvps (invitation_id, guest_id, name, message, attendance_status, number_of_guests)
     VALUES
       ($1, $2, 'Budi Santoso',   'Selamat menempuh hidup baru! Semoga sakinah, mawaddah, warahmah.', 'Hadir', 2),
       ($1, $3, 'Siti Aminah',    'Mohon maaf tidak bisa hadir. Doa terbaik untuk kalian!',          'Tidak Hadir', 0),
       ($1, $4, 'Andi Pratama',   'Happy wedding! Ditunggu traktirannya.',                           'Hadir', 1),
       ($1, $5, 'Dewi Lestari',   'Selamat ya! Cantik banget undangannya.',                          'Hadir', 3),
       ($1, $6, 'Rizky Ramadhan', 'Insya Allah hadir, lagi konfirmasi jadwal.',                      'Masih Ragu', 1)`,
    [inv1, g[0], g[1], g[2], g[3], g[4]],
  );
  console.log('✅ 5 RSVP dibuat.');

  // ✅ 7) Amplop digital contoh (total Rp 2.200.000)
  await pool.query(
    `INSERT INTO digital_envelopes (invitation_id, guest_id, sender_name, amount, message, payment_method, withdrawal_status)
     VALUES
       ($1, $2, 'Budi Santoso',   500000,  'Selamat menempuh hidup baru!', 'QRIS',          'Ditarik'),
       ($1, $3, 'Siti Aminah',    250000,  'Mohon maaf tidak bisa hadir.',  'Transfer Bank', 'Ditarik'),
       ($1, $4, 'Andi Pratama',   1000000, 'Happy wedding bro!',              'QRIS',          'Belum Ditarik'),
       ($1, $5, 'Dewi Lestari',   300000,  'Selamat ya Dew!',                 'E-Wallet',      'Ditarik'),
       ($1, $6, 'Rizky Ramadhan', 150000,  'Semoga sakinah mawaddah warahmah.', 'QRIS',        'Belum Ditarik')`,
    [inv1, g[0], g[1], g[2], g[3], g[4]],
  );
  console.log('✅ 5 amplop digital dibuat.');

  console.log('🎉 Seed selesai! Database terisi data awal.');
  process.exit(0);
}

run().catch((e) => {
  console.error('❌ Seed gagal:', e.message);
  process.exit(1);
});