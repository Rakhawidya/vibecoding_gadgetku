require('dotenv').config();
const path = require('path');

const client = String(process.env.DB_CLIENT || 'mysql').toLowerCase();

/**
 * Mode pengembangan tanpa setup: DB_CLIENT=sqlite memakai database file lokal
 * (Node.js >= 22, modul bawaan `node:sqlite`). Mode produksi tetap MySQL.
 */
if (client === 'sqlite') {
  const { DatabaseSync } = require('node:sqlite');
  const dbFile = process.env.SQLITE_FILE
    ? path.resolve(__dirname, '..', process.env.SQLITE_FILE)
    : path.join(__dirname, '..', 'db', 'gadgetku.dev.db');

  const db = new DatabaseSync(dbFile);
  db.exec('PRAGMA foreign_keys = ON');

  /**
   * Menjalankan SQL dengan parameter bernama (`:nama`), meniru perilaku
   * mysql2 yang dipakai seluruh route.
   */
  async function query(sql, params = {}) {
    const statement = db.prepare(sql);
    if (/^\s*(insert|update|delete|replace)\b/i.test(sql)) {
      const info = statement.run(params);
      return { insertId: Number(info.lastInsertRowid), affectedRows: Number(info.changes) };
    }
    return statement.all(params);
  }

  module.exports = { query, pool: null, db, client, dbFile };
} else {
  const mysql = require('mysql2/promise');

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gadgetku',
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
  });

  /** Jalankan query berparameter (named placeholders `:nama`). */
  async function query(sql, params = {}) {
    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  module.exports = { query, pool, client };
}
