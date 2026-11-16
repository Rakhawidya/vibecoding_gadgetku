const express = require('express');
const { query } = require('../db');
const { authenticate, requireRole } = require('../auth');
const { deleteUploadedFile } = require('../uploads');

const router = express.Router();
const KATEGORI = ['Ponsel', 'Aksesori', 'Audio', 'Pengisian Daya', 'Wearable'];
const SVG_KEYS = ['svg:ponsel', 'svg:aksesori', 'svg:audio', 'svg:pengisian', 'svg:wearable', 'svg:umum'];
const IMAGE_UPLOAD_RE = /^\/uploads\/[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp|gif)$/;

function normalizeImage(value) {
  if (SVG_KEYS.includes(value)) return value;
  if (typeof value === 'string' && IMAGE_UPLOAD_RE.test(value)) return value;
  return 'svg:umum';
}

/** Hapus file upload lama jika tidak lagi dipakai produk mana pun. */
async function cleanupUpload(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  const rows = await query('SELECT COUNT(*) AS n FROM products WHERE image_url = :url', { url });
  if (!Number(rows[0]?.n)) deleteUploadedFile(url);
}

function validateProduct(body) {
  const { nama, kategori, harga, stok } = body || {};
  if (!nama || nama.trim().length < 3) return 'Nama produk minimal 3 karakter.';
  if (!KATEGORI.includes(kategori)) return 'Kategori tidak valid.';
  const h = Number(harga), s = Number(stok);
  if (!Number.isFinite(h) || h < 0) return 'Harga tidak boleh negatif.';
  if (!Number.isInteger(s) || s < 0) return 'Stok harus bilangan bulat >= 0.';
  return null;
}

// GET /api/products — publik (pembeli & tamu): daftar katalog dengan pencarian/filter/sort
router.get('/', async (req, res) => {
  try {
    const { search = '', kategori = '', sort = 'unggulan' } = req.query;
    let sql = `SELECT p.*, u.nama AS seller_nama FROM products p JOIN users u ON u.id = p.seller_id WHERE 1=1`;
    const params = {};
    if (search) { sql += ' AND (p.nama LIKE :s OR p.deskripsi LIKE :s)'; params.s = `%${search}%`; }
    if (kategori && KATEGORI.includes(kategori)) { sql += ' AND p.kategori = :k'; params.k = kategori; }
    const orders = {
      unggulan: 'p.unggulan DESC, p.id ASC',
      harga_asc: 'p.harga ASC',
      harga_desc: 'p.harga DESC',
      nama: 'p.nama ASC',
    };
    sql += ` ORDER BY ${orders[sort] || orders.unggulan}`;
    res.json(await query(sql, params));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal memuat produk.' });
  }
});

// GET /api/products/:id — publik
router.get('/:id', async (req, res) => {
  const rows = await query(
    'SELECT p.*, u.nama AS seller_nama FROM products p JOIN users u ON u.id = p.seller_id WHERE p.id = :id',
    { id: req.params.id }
  );
  if (!rows.length) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
  res.json(rows[0]);
});

// POST /api/products — admin & seller (seller otomatis pemilik produknya)
router.post('/', authenticate, requireRole('admin', 'seller'), async (req, res) => {
  try {
    const err = validateProduct(req.body);
    if (err) return res.status(400).json({ error: err });
    const b = req.body;
    const image = normalizeImage(b.image_url);
    const result = await query(
      'INSERT INTO products (seller_id, nama, kategori, harga, stok, deskripsi, image_url, unggulan) VALUES (:sid, :nama, :k, :h, :s, :d, :img, :u)',
      { sid: req.user.id, nama: b.nama.trim(), k: b.kategori, h: Number(b.harga), s: Number(b.stok), d: b.deskripsi || '', img: image, u: b.unggulan ? 1 : 0 }
    );
    res.status(201).json((await query('SELECT * FROM products WHERE id = :id', { id: result.insertId }))[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal menambah produk.' });
  }
});

// PUT /api/products/:id — admin (semua produk) atau seller (hanya produk miliknya)
router.put('/:id', authenticate, requireRole('admin', 'seller'), async (req, res) => {
  try {
    const rows = await query('SELECT * FROM products WHERE id = :id', { id: req.params.id });
    if (!rows.length) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    const p = rows[0];
    if (req.user.role === 'seller' && p.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Anda hanya boleh mengubah produk milik Anda sendiri.' });
    }
    const err = validateProduct(req.body);
    if (err) return res.status(400).json({ error: err });
    const b = req.body;
    const image = normalizeImage(b.image_url);
    await query(
      'UPDATE products SET nama = :nama, kategori = :k, harga = :h, stok = :s, deskripsi = :d, image_url = :img, unggulan = :u WHERE id = :id',
      { nama: b.nama.trim(), k: b.kategori, h: Number(b.harga), s: Number(b.stok), d: b.deskripsi || '', img: image, u: b.unggulan ? 1 : 0, id: req.params.id }
    );
    if (p.image_url !== image) await cleanupUpload(p.image_url);
    res.json((await query('SELECT * FROM products WHERE id = :id', { id: req.params.id }))[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal mengubah produk.' });
  }
});

// DELETE /api/products/:id — admin (semua) atau seller (miliknya sendiri)
router.delete('/:id', authenticate, requireRole('admin', 'seller'), async (req, res) => {
  try {
    const rows = await query('SELECT * FROM products WHERE id = :id', { id: req.params.id });
    if (!rows.length) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    if (req.user.role === 'seller' && rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Anda hanya boleh menghapus produk milik Anda sendiri.' });
    }
    const image = rows[0].image_url;
    await query('DELETE FROM products WHERE id = :id', { id: req.params.id });
    await cleanupUpload(image);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal menghapus produk.' });
  }
});

// GET /api/products/mine/list — produk milik seller yang login (admin: semua)
router.get('/mine/list', authenticate, requireRole('admin', 'seller'), async (req, res) => {
  const where = req.user.role === 'admin' ? '1=1' : 'p.seller_id = :sid';
  const rows = await query(
    `SELECT p.*, u.nama AS seller_nama FROM products p JOIN users u ON u.id = p.seller_id WHERE ${where} ORDER BY p.id DESC`,
    req.user.role === 'admin' ? {} : { sid: req.user.id }
  );
  res.json(rows);
});

module.exports = router;
