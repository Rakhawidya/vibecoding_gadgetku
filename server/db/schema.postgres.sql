-- =====================================================
-- GadgetKu - Skema Database PostgreSQL (Vercel Postgres / Neon)
-- Seed data dijalankan oleh: npm run db:init
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  nama          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'pembeli' CHECK (role IN ('admin','seller','pembeli')),
  wa_number     TEXT DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  seller_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nama        TEXT NOT NULL,
  kategori    TEXT NOT NULL CHECK (kategori IN ('Ponsel','Aksesori','Audio','Pengisian Daya','Wearable')),
  harga       INTEGER NOT NULL DEFAULT 0 CHECK (harga >= 0),
  stok        INTEGER NOT NULL DEFAULT 0 CHECK (stok >= 0),
  deskripsi   TEXT,
  image_url   TEXT DEFAULT 'svg:umum',
  unggulan    SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_kategori ON products(kategori);
CREATE INDEX IF NOT EXISTS idx_products_unggulan ON products(unggulan);

CREATE TABLE IF NOT EXISTS orders (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qty         INTEGER NOT NULL DEFAULT 1,
  total       INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru','diproses','dikirim','selesai','batal')),
  wa_number   TEXT NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  setting_key   TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL
);
