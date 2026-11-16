const path = require('path');

/**
 * Menentukan lokasi file SQLite.
 * - SQLITE_FILE bisa diisi path relatif/absolut (opsional).
 * - Di Vercel filesystem hanya writable di /tmp (ephemeral per instance).
 */
function sqliteFile() {
  if (process.env.SQLITE_FILE) {
    return path.resolve(__dirname, '..', process.env.SQLITE_FILE);
  }
  if (process.env.VERCEL) return '/tmp/gadgetku.db';
  return path.join(__dirname, '..', 'db', 'gadgetku.dev.db');
}

/** Klien database aktif: sqlite di dev/Vercel demo, mysql di produksi. */
function dbClient() {
  const fallback = process.env.VERCEL ? 'sqlite' : 'mysql';
  return String(process.env.DB_CLIENT || fallback).toLowerCase();
}

module.exports = { sqliteFile, dbClient };
