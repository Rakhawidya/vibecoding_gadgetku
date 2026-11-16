const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../db');
const { authenticate, JWT_SECRET } = require('../auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}
const publicUser = (u) => ({ id: u.id, nama: u.nama, email: u.email, role: u.role, wa_number: u.wa_number });

// POST /api/auth/register — pendaftaran khusus role pembeli
router.post('/register', async (req, res) => {
  try {
    const { nama, email, password, wa_number } = req.body || {};
    if (!nama || nama.trim().length < 3) return res.status(400).json({ error: 'Nama minimal 3 karakter.' });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Format email tidak valid.' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter.' });

    const exists = await query('SELECT id FROM users WHERE email = :email', { email: email.toLowerCase() });
    if (exists.length) return res.status(409).json({ error: 'Email sudah terdaftar.' });

    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      "INSERT INTO users (nama, email, password_hash, role, wa_number) VALUES (:nama, :email, :hash, 'pembeli', :wa)",
      { nama: nama.trim(), email: email.toLowerCase(), hash, wa: wa_number || null }
    );
    const user = { id: result.insertId, nama: nama.trim(), email: email.toLowerCase(), role: 'pembeli', wa_number: wa_number || null };
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal mendaftarkan akun.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''))) {
      return res.status(400).json({ error: 'Format email tidak valid.' });
    }
    const users = await query('SELECT * FROM users WHERE email = :email', { email: (email || '').toLowerCase() });
    if (!users.length || !(await bcrypt.compare(password || '', users[0].password_hash))) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }
    const u = users[0];
    res.json({ token: signToken(u), user: publicUser(u) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal login.' });
  }
});

// POST /api/auth/guest — masuk sebagai pembeli tanpa email/password.
// Satu perangkat memakai satu akun tamu (device_id disimpan di localStorage).
router.post('/guest', async (req, res) => {
  try {
    const rawDevice = String(req.body?.device_id || '');
    const deviceId = /^[A-Za-z0-9-]{8,80}$/.test(rawDevice) ? rawDevice : crypto.randomUUID();
    const email = `tamu-${deviceId}@gadgetku.local`;

    const existing = await query('SELECT * FROM users WHERE email = :email', { email });
    if (existing.length) {
      const u = existing[0];
      if (u.role !== 'pembeli') return res.status(409).json({ error: 'Akun tamu tidak valid.' });
      return res.json({ token: signToken(u), user: publicUser(u), guest: true });
    }

    const hash = await bcrypt.hash(crypto.randomUUID(), 10);
    const result = await query(
      "INSERT INTO users (nama, email, password_hash, role, wa_number) VALUES (:nama, :email, :hash, 'pembeli', NULL)",
      { nama: 'Pembeli Tamu', email, hash }
    );
    const user = { id: result.insertId, nama: 'Pembeli Tamu', email, role: 'pembeli', wa_number: null };
    res.status(201).json({ token: signToken(user), user: publicUser(user), guest: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal masuk sebagai pembeli.' });
  }
});

// GET /api/auth/me — profil pengguna yang sedang login
router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

// PUT /api/auth/me — perbarui profil sendiri (semua role)
router.put('/me', authenticate, async (req, res) => {
  try {
    const { nama, wa_number, password } = req.body || {};
    if (nama && nama.trim().length < 3) return res.status(400).json({ error: 'Nama minimal 3 karakter.' });
    if (password && password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter.' });
    if (nama) await query('UPDATE users SET nama = :nama WHERE id = :id', { nama: nama.trim(), id: req.user.id });
    if (wa_number !== undefined) await query('UPDATE users SET wa_number = :wa WHERE id = :id', { wa: wa_number || null, id: req.user.id });
    if (password) await query('UPDATE users SET password_hash = :h WHERE id = :id', { h: await bcrypt.hash(password, 10), id: req.user.id });
    const rows = await query('SELECT id, nama, email, role, wa_number FROM users WHERE id = :id', { id: req.user.id });
    res.json({ user: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal memperbarui profil.' });
  }
});

module.exports = router;
