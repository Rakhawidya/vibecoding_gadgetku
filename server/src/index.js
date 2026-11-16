require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const { authenticate } = require('./auth');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const statsRoutes = require('./routes/stats');
const uploadRoutes = require('./routes/uploads');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ---------- API ----------
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/uploads', uploadRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true, name: 'GadgetKu API' }));

// ---------- Frontend statis ----------
app.use(express.static(path.join(__dirname, '..', '..', 'public')));
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
});

// ---------- Error handler ----------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`GadgetKu API berjalan di http://localhost:${PORT}`);
  const demoEmails = ['SEED_ADMIN_EMAIL', 'SEED_SELLER_EMAIL', 'SEED_PEMBELI_EMAIL']
    .map((key) => process.env[key])
    .filter(Boolean);
  if (demoEmails.length) console.log(`Akun contoh: ${demoEmails.join(' | ')}`);
  console.log('Password akun contoh mengikuti SEED_PASSWORD di server/.env');
});
