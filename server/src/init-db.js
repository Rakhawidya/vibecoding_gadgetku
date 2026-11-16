/**
 * Inisialisasi database GadgetKu:
 * 1. Membuat tabel (MySQL atau SQLite sesuai DB_CLIENT)
 * 2. Mengisi akun contoh + 8 produk contoh + pengaturan toko
 *
 * Jalankan:  npm run db:init
 * Opsi:      node src/init-db.js --if-empty  (hanya seed jika database masih kosong)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { sqliteFile, dbClient } = require('./db-path');

const IF_EMPTY = process.argv.includes('--if-empty');
const CLIENT = dbClient();

const SEED_PRODUCTS = [
  ['Ponsel Pintar 6.5 Inci', 'Ponsel', 2450000, 12, 'Ponsel generik layar 6.5 inci, baterai 5000 mAh, kamera 50 MP.', 'svg:ponsel', 1],
  ['Ponsel Kompak 5.5 Inci', 'Ponsel', 1750000, 8, 'Ponsel ringkas satu tangan, ramah kantong, performa hemat daya.', 'svg:ponsel', 0],
  ['Earphone Kabel Tipe-C', 'Audio', 85000, 15, 'Suara jernih dengan mikrofon bawaan dan konektor Tipe-C.', 'svg:audio', 0],
  ['Speaker Bluetooth Mini', 'Audio', 199000, 10, 'Speaker portabel bass dalam, tahan cipratan air.', 'svg:audio', 1],
  ['Power Bank 10.000 mAh', 'Pengisian Daya', 185000, 20, 'Pengisian cepat 22.5W dengan dua port output.', 'svg:pengisian', 1],
  ['Charger Cepat 33W Tipe-C', 'Pengisian Daya', 95000, 25, 'Adaptor cepat 33W, dilengkapi kabel braid tahan gulat.', 'svg:pengisian', 0],
  ['Smartwatch Layar 1.8 Inci', 'Wearable', 320000, 6, 'Pantau detak jantung, langkah, dan notifikasi ponsel.', 'svg:wearable', 1],
  ['Case Ponsel Anti-Syok', 'Aksesori', 45000, 30, 'Pelindung sudut empuk, tepi tinggi untuk kamera.', 'svg:aksesori', 0],
];

const SEED_SETTINGS = [
  ['store_name', 'GadgetKu'],
  ['whatsapp_number', '6281200000000'],
];

async function getSeedHash() {
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 6) {
    throw new Error('SEED_PASSWORD wajib diisi minimal 6 karakter di server/.env untuk membuat akun contoh.');
  }
  return bcrypt.hash(password, 10);
}

function getSeedUsers() {
  const users = [
    { nama: 'Admin GadgetKu', env: 'SEED_ADMIN_EMAIL', email: process.env.SEED_ADMIN_EMAIL, role: 'admin', wa: '6281200000001' },
    { nama: 'Toko Berkah', env: 'SEED_SELLER_EMAIL', email: process.env.SEED_SELLER_EMAIL, role: 'seller', wa: '6281200000000' },
    { nama: 'Budi Pembeli', env: 'SEED_PEMBELI_EMAIL', email: process.env.SEED_PEMBELI_EMAIL, role: 'pembeli', wa: null },
  ];

  for (const u of users) {
    if (!u.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email)) {
      throw new Error(`${u.env} wajib diisi dengan format email yang valid di server/.env.`);
    }
    u.email = u.email.trim().toLowerCase();
  }

  const emails = users.map((u) => u.email);
  if (new Set(emails).size !== emails.length) {
    throw new Error('SEED_ADMIN_EMAIL, SEED_SELLER_EMAIL, dan SEED_PEMBELI_EMAIL harus berbeda.');
  }
  return users;
}

async function initSqlite(ifEmpty = IF_EMPTY) {
  const { DatabaseSync } = require('node:sqlite');
  const dbFile = sqliteFile();

  const db = new DatabaseSync(dbFile);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sqlite.sql'), 'utf8'));

  const products = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
  const users = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (ifEmpty && products > 0 && users > 0) {
    console.log(`Database SQLite sudah berisi data (${products} produk). Seed dilewati.`);
    db.close();
    return;
  }

  const seedUsers = getSeedUsers();
  const hash = await getSeedHash();
  const upsertUser = db.prepare(`
    INSERT INTO users (nama, email, password_hash, role, wa_number)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      nama = excluded.nama,
      password_hash = excluded.password_hash,
      role = excluded.role,
      wa_number = excluded.wa_number
  `);
  for (const u of seedUsers) upsertUser.run(u.nama, u.email, hash, u.role, u.wa);

  const sellerEmail = seedUsers.find((u) => u.role === 'seller').email;
  const seller = db.prepare('SELECT id FROM users WHERE email = ?').get(sellerEmail);
  const sellerId = seller.id;

  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)');
  for (const [key, value] of SEED_SETTINGS) insertSetting.run(key, value);

  db.exec('DELETE FROM products');
  const insertProduct = db.prepare(`
    INSERT INTO products (seller_id, nama, kategori, harga, stok, deskripsi, image_url, unggulan)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const p of SEED_PRODUCTS) insertProduct.run(sellerId, ...p);

  db.close();
  console.log(`Database SQLite siap: ${dbFile}`);
  console.log(`Seed: ${seedUsers.length} pengguna, ${SEED_PRODUCTS.length} produk.`);
}

async function initMysql(ifEmpty = IF_EMPTY) {
  const mysql = require('mysql2/promise');
  const dbName = process.env.DB_NAME || 'gadgetku';

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const schema = fs
    .readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8')
    .replace(/CREATE DATABASE IF NOT EXISTS gadgetku/g, `CREATE DATABASE IF NOT EXISTS \`${dbName}\``)
    .replace(/USE gadgetku;/g, `USE \`${dbName}\`;`);

  console.log('Menjalankan schema.sql ...');
  await conn.query(schema);

  const [[{ n: products }]] = await conn.query('SELECT COUNT(*) AS n FROM products');
  const [[{ n: users }]] = await conn.query('SELECT COUNT(*) AS n FROM users');
  if (ifEmpty && products > 0 && users > 0) {
    console.log(`Database MySQL sudah berisi data (${products} produk). Seed dilewati.`);
    await conn.end();
    return;
  }

  const seedUsers = getSeedUsers();
  const hash = await getSeedHash();
  console.log('Mengisi akun contoh ...');
  for (const u of seedUsers) {
    await conn.query(
      `INSERT INTO users (nama, email, password_hash, role, wa_number) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nama = VALUES(nama),
         password_hash = VALUES(password_hash),
         role = VALUES(role),
         wa_number = VALUES(wa_number)`,
      [u.nama, u.email, hash, u.role, u.wa]
    );
  }
  const sellerEmail = seedUsers.find((u) => u.role === 'seller').email;
  const [sellerRows] = await conn.query('SELECT id FROM users WHERE email = ?', [sellerEmail]);
  const sellerId = sellerRows[0].id;

  await conn.query('INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ?', [SEED_SETTINGS]);

  console.log('Mengisi produk contoh ...');
  await conn.query('DELETE FROM products');
  for (const p of SEED_PRODUCTS) {
    await conn.query(
      'INSERT INTO products (seller_id, nama, kategori, harga, stok, deskripsi, image_url, unggulan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [sellerId, ...p]
    );
  }

  await conn.end();
  console.log('Selesai. Database MySQL siap digunakan.');
}

async function initDatabase({ ifEmpty = IF_EMPTY, client = CLIENT } = {}) {
  if (client === 'sqlite') return initSqlite(ifEmpty);
  return initMysql(ifEmpty);
}

module.exports = { initDatabase, SEED_PRODUCTS, SEED_SETTINGS };

if (require.main === module) {
  initDatabase()
    .then(() => {})
    .catch((e) => {
      console.error('Gagal inisialisasi database:', e.message);
      if (CLIENT === 'mysql' && /Access denied/i.test(e.message)) {
        console.error('Periksa DB_USER/DB_PASSWORD di server/.env, atau jalankan mode dev tanpa MySQL dengan DB_CLIENT=sqlite.');
      }
      process.exit(1);
    });
}
