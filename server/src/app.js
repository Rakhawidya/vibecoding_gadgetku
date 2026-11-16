require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const statsRoutes = require('./routes/stats');
const uploadRoutes = require('./routes/uploads');
const { UPLOAD_DIR } = require('./uploads');

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');

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
app.use('/uploads', express.static(UPLOAD_DIR, { fallthrough: true }));
app.use(express.static(PUBLIC_DIR));
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// ---------- Error handler ----------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});

module.exports = { app, PUBLIC_DIR };
