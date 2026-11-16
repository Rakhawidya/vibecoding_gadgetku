require('dotenv').config();
const { sqliteFile, dbClient } = require('./db-path');

const client = dbClient();

/**
 * Mode pengembangan tanpa setup: DB_CLIENT=sqlite memakai database file lokal
 * (Node.js >= 22, modul bawaan `node:sqlite`). Mode produksi tetap MySQL.
 */
if (client === 'sqlite') {
  const { DatabaseSync } = require('node:sqlite');
  const dbFile = sqliteFile();

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
} else if (client === 'postgres') {
  /**
   * Mode Vercel Postgres / Neon: DB_CLIENT=postgres dengan DATABASE_URL.
   * meniru antarmuka mysql2 (parameter bernama `:nama`).
   */
  const { Pool } = require('pg');

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
  const pool = new Pool({
    connectionString,
    ssl: isLocal || process.env.PGSSLMODE === 'disable' ? undefined : { rejectUnauthorized: false },
    max: 5,
  });

  /** Konversi `:nama` menjadi `$1, $2, ...` sesuai urutan kemunculan. */
  function toPgSql(sql, params) {
    const keys = [];
    const text = sql.replace(/:(\w+)/g, (match, name, offset) => {
      if (offset > 0 && sql[offset - 1] === ':') return match; // lewati cast `::`
      if (!(name in params)) return match;
      if (!keys.includes(name)) keys.push(name);
      return '$' + (keys.indexOf(name) + 1);
    });
    return { text, values: keys.map((k) => params[k]) };
  }

  async function query(sql, params = {}) {
    const { text, values } = toPgSql(sql, params);
    const cmd = sql.trim().slice(0, 6).toUpperCase();
    const finalText = cmd === 'INSERT' ? `${text} RETURNING id` : text;
    const result = await pool.query(finalText, values);
    if (cmd === 'INSERT') {
      return { insertId: result.rows[0] ? Number(result.rows[0].id) : null, affectedRows: result.rowCount };
    }
    if (cmd === 'UPDATE' || cmd === 'DELETE') {
      return { insertId: null, affectedRows: result.rowCount };
    }
    return result.rows;
  }

  module.exports = { query, pool, client };
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
