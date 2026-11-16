/**
 * Entry point serverless Vercel.
 * Semua request (API + frontend) ditangani Express lewat satu function.
 * Database diinisialisasi sekali per instance (cold start).
 */
const { app } = require('../server/src/app');
const { initDatabase } = require('../server/src/init-db');

let ready = null;

function ensureDatabase() {
  if (!ready) {
    ready = initDatabase({ ifEmpty: true }).catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}

module.exports = async (req, res) => {
  try {
    await ensureDatabase();
  } catch (err) {
    console.error('Database belum siap:', err.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Database belum siap. Cek konfigurasi environment.' }));
    return;
  }
  return app(req, res);
};
