const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : process.env.VERCEL
    ? '/tmp/uploads'
    : path.join(__dirname, '..', '..', 'public', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = MIME_EXT[file.mimetype] || '.jpg';
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!MIME_EXT[file.mimetype]) {
      return cb(new Error('Format gambar tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.'));
    }
    cb(null, true);
  },
});

/** Hapus file upload lama dengan aman (hanya dari folder public/uploads). */
function deleteUploadedFile(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('/uploads/')) return;
  const fileName = path.basename(url);
  const filePath = path.join(UPLOAD_DIR, fileName);
  if (!filePath.startsWith(UPLOAD_DIR + path.sep)) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.warn('Gagal menghapus file upload lama:', fileName, err.message);
  }
}

module.exports = { upload, deleteUploadedFile, UPLOAD_DIR };
