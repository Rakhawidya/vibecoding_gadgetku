const express = require('express');
const { query } = require('../db');
const { authenticate, requireRole } = require('../auth');

const router = express.Router();
const STATUS = ['baru', 'diproses', 'dikirim', 'selesai', 'batal'];

// POST /api/orders — pembeli membuat order (1 produk, qty) & mencatat tujuan WA
router.post('/', authenticate, requireRole('pembeli', 'admin', 'seller'), async (req, res) => {
  try {
    const { product_id, qty } = req.body || {};
    const quantity = Number(qty) || 1;
    if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ error: 'Jumlah (qty) tidak valid.' });
    const rows = await query('SELECT * FROM products WHERE id = :id', { id: product_id });
    if (!rows.length) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    const p = rows[0];
    if (p.stok < quantity) return res.status(400).json({ error: 'Stok tidak mencukupi.' });
    const wa = (await query("SELECT setting_value FROM settings WHERE setting_key = 'whatsapp_number'"))[0]?.setting_value || '';
    const result = await query(
      'INSERT INTO orders (user_id, product_id, seller_id, qty, total, wa_number) VALUES (:uid, :pid, :sid, :qty, :total, :wa)',
      { uid: req.user.id, pid: p.id, sid: p.seller_id, qty: quantity, total: Number(p.harga) * quantity, wa }
    );
    res.status(201).json({
      ok: true,
      order_id: result.insertId,
      wa_link: `https://wa.me/${wa}?text=${encodeURIComponent(`Halo, saya ingin memesan ${quantity}x ${p.nama} (total Rp ${Number(p.harga) * quantity}).`)}`,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal membuat pesanan.' });
  }
});

// GET /api/orders — riwayat pesanan
// pembeli: hanya pesanannya sendiri | seller: pesanan produk miliknya | admin: semua
router.get('/', authenticate, async (req, res) => {
  try {
    let where = '1=1';
    const params = {};
    if (req.user.role === 'pembeli') { where = 'o.user_id = :uid'; params.uid = req.user.id; }
    else if (req.user.role === 'seller') { where = 'o.seller_id = :sid'; params.sid = req.user.id; }
    const rows = await query(
      `SELECT o.*, p.nama AS product_nama, u.nama AS pembeli_nama, u.wa_number AS pembeli_wa
       FROM orders o JOIN products p ON p.id = o.product_id JOIN users u ON u.id = o.user_id
       WHERE ${where} ORDER BY o.id DESC`, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal memuat pesanan.' });
  }
});

// PUT /api/orders/:id/status — admin (semua) atau seller (pesanan produk miliknya)
router.put('/:id/status', authenticate, requireRole('admin', 'seller'), async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!STATUS.includes(status)) return res.status(400).json({ error: 'Status tidak valid.' });
    const rows = await query('SELECT * FROM orders WHERE id = :id', { id: req.params.id });
    if (!rows.length) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    if (req.user.role === 'seller' && rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Anda hanya boleh mengelola pesanan produk Anda sendiri.' });
    }
    await query('UPDATE orders SET status = :s WHERE id = :id', { s: status, id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal mengubah status pesanan.' });
  }
});

module.exports = router;
