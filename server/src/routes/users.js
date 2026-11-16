const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { authenticate, requireRole } = require('../auth');

const router = express.Router();

// GET /api/users — HANYA admin: daftar semua pengguna
router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  res.json(await query('SELECT id, nama, email, role, wa_number, created_at FROM users ORDER BY id ASC'));
});

// PATCH /api/users/:id/role — HANYA admin: ubah role pengguna
router.patch('/:id/role', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.body || {};
    if (!['admin', 'seller', 'pembeli'].includes(role)) return res.status(400).json({ error: 'Role tidak valid.' });
    if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'Tidak dapat mengubah role akun sendiri.' });
    const rows = await query('SELECT id FROM users WHERE id = :id', { id: req.params.id });
    if (!rows.length) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    await query('UPDATE users SET role = :r WHERE id = :id', { r: role, id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal mengubah role.' });
  }
});

// DELETE /api/users/:id — HANYA admin: hapus pengguna (bukan dirinya sendiri)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'Tidak dapat menghapus akun sendiri.' });
    const rows = await query('SELECT id FROM users WHERE id = :id', { id: req.params.id });
    if (!rows.length) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    await query('DELETE FROM users WHERE id = :id', { id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal menghapus pengguna.' });
  }
});

// POST /api/users — HANYA admin: buat akun dengan role apa pun
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { nama, email, password, role, wa_number } = req.body || {};
    if (!nama || nama.trim().length < 3) return res.status(400).json({ error: 'Nama minimal 3 karakter.' });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Format email tidak valid.' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter.' });
    if (!['admin', 'seller', 'pembeli'].includes(role)) return res.status(400).json({ error: 'Role tidak valid.' });
    const exists = await query('SELECT id FROM users WHERE email = :email', { email: email.toLowerCase() });
    if (exists.length) return res.status(409).json({ error: 'Email sudah terdaftar.' });
    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (nama, email, password_hash, role, wa_number) VALUES (:nama, :email, :h, :r, :wa)',
      { nama: nama.trim(), email: email.toLowerCase(), h: hash, r: role, wa: wa_number || null }
    );
    res.status(201).json({ id: result.insertId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal membuat pengguna.' });
  }
});

module.exports = router;
