const express = require('express');
const { query } = require('../db');
const { authenticate, requireRole } = require('../auth');

const router = express.Router();

// GET /api/stats — statistik dashboard
// admin: seluruh toko | seller: hanya produk & pesanan miliknya | pembeli: ditolak
router.get('/', authenticate, requireRole('admin', 'seller'), async (req, res) => {
  try {
    const isSeller = req.user.role === 'seller';
    const pid = isSeller ? req.user.id : null;
    const scope = isSeller ? 'WHERE seller_id = :pid' : '';
    const params = pid ? { pid } : {};

    const products = (await query(`SELECT COUNT(*) AS n, COALESCE(SUM(stok),0) AS stok FROM products ${scope}`, params))[0];
    const kategori = (await query(`SELECT COUNT(DISTINCT kategori) AS n FROM products ${scope}`, params))[0];
    const orderScope = isSeller ? 'WHERE seller_id = :pid' : '';
    const orders = (await query(`SELECT COUNT(*) AS n, COALESCE(SUM(total),0) AS omzet FROM orders ${orderScope}`, params))[0];
    const users = (await query("SELECT COUNT(*) AS n FROM users"))[0];
    res.json({
      total_produk: products.n,
      total_stok: products.stok,
      jumlah_kategori: kategori.n,
      total_pesanan: orders.n,
      total_omzet: orders.omzet,
      total_pengguna: users.n, // hanya relevan untuk admin
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal memuat statistik.' });
  }
});

module.exports = router;
