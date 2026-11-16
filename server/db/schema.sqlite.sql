-- =====================================================
-- GadgetKu - Skema Database SQLite (mode dev tanpa setup)
-- Seed data dijalankan oleh: npm run db:init
-- =====================================================
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nama          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'pembeli' CHECK (role IN ('admin','seller','pembeli')),
  wa_number     TEXT DEFAULT NULL,
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id   INTEGER NOT NULL,
  nama        TEXT NOT NULL,
  kategori    TEXT NOT NULL CHECK (kategori IN ('Ponsel','Aksesori','Audio','Pengisian Daya','Wearable')),
  harga       INTEGER NOT NULL DEFAULT 0 CHECK (harga >= 0),
  stok        INTEGER NOT NULL DEFAULT 0 CHECK (stok >= 0),
  deskripsi   TEXT,
  image_url   TEXT DEFAULT 'svg:umum',
  unggulan    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_products_kategori ON products(kategori);
CREATE INDEX IF NOT EXISTS idx_products_unggulan ON products(unggulan);

CREATE TABLE IF NOT EXISTS orders (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  product_id  INTEGER NOT NULL,
  seller_id   INTEGER NOT NULL,
  qty         INTEGER NOT NULL DEFAULT 1,
  total       INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru','diproses','dikirim','selesai','batal')),
  wa_number   TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id)  REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  setting_key   TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL
);
