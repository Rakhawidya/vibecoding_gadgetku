const express = require('express');
const { authenticate, requireRole } = require('../auth');
const { upload } = require('../uploads');

const router = express.Router();

// POST /api/uploads — admin & seller mengunggah gambar produk
router.post('/', authenticate, requireRole('admin', 'seller'), (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Ukuran gambar maksimal 3 MB.'
        : err.message || 'Gagal mengunggah gambar.';
      return res.status(400).json({ error: message });
    }
    if (!req.file) return res.status(400).json({ error: 'File gambar wajib dipilih.' });
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

module.exports = router;
