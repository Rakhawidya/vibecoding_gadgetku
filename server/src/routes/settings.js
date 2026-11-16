const express = require('express');
const { query } = require('../db');
const { authenticate, requireRole } = require('../auth');

const router = express.Router();

// GET /api/settings — publik (pembeli perlu store_name & whatsapp_number untuk link WA)
router.get('/', async (req, res) => {
  const rows = await query('SELECT setting_key, setting_value FROM settings');
  res.json(Object.fromEntries(rows.map(r => [r.setting_key, r.setting_value])));
});

// PUT /api/settings — admin & seller (normalisasi nomor WA: 0 -> 62, buang non-digit)
router.put('/', authenticate, requireRole('admin', 'seller'), async (req, res) => {
  try {
    const { whatsapp_number, store_name } = req.body || {};
    if (store_name) {
      await query("UPDATE settings SET setting_value = :v WHERE setting_key = 'store_name'", { v: String(store_name).trim().slice(0, 100) });
    }
    if (whatsapp_number !== undefined) {
      let digits = String(whatsapp_number).replace(/\D/g, '');
      if (digits.startsWith('0')) digits = '62' + digits.slice(1);
      if (!/^62\d{8,15}$/.test(digits)) return res.status(400).json({ error: 'Nomor WhatsApp tidak valid (contoh: 081234567890).' });
      await query("UPDATE settings SET setting_value = :v WHERE setting_key = 'whatsapp_number'", { v: digits });
    }
    const rows = await query('SELECT setting_key, setting_value FROM settings');
    res.json(Object.fromEntries(rows.map(r => [r.setting_key, r.setting_value])));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Gagal menyimpan pengaturan.' });
  }
});

module.exports = router;
