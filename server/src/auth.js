const jwt = require('jsonwebtoken');
const { query } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-ganti-di-produksi';

// ---------- Middleware autentikasi ----------
async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Belum login. Silakan masuk terlebih dahulu.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const users = await query('SELECT id, nama, email, role, wa_number FROM users WHERE id = :id', { id: payload.sub });
    if (!users.length) return res.status(401).json({ error: 'Akun tidak ditemukan.' });
    req.user = users[0];
    next();
  } catch {
    return res.status(401).json({ error: 'Sesi tidak valid atau kedaluwarsa. Silakan login ulang.' });
  }
}

// ---------- Middleware otorisasi per role ----------
// Pakai: requireRole('admin'), requireRole('admin','seller')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Belum login.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Akses ditolak. Hak akses: ${roles.join(', ')}.` });
    }
    next();
  };
}

module.exports = { authenticate, requireRole, JWT_SECRET };
