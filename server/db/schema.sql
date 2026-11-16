-- =====================================================
-- GadgetKu - Skema Database MySQL (tanpa seed)
-- Seed data dijalankan oleh: npm run db:init
-- =====================================================
CREATE DATABASE IF NOT EXISTS gadgetku
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gadgetku;

-- ---------- USERS (admin / seller / pembeli) ----------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nama          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('admin','seller','pembeli') NOT NULL DEFAULT 'pembeli',
  wa_number     VARCHAR(20)   DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- PRODUCTS ----------
CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  seller_id   INT          NOT NULL,
  nama        VARCHAR(150) NOT NULL,
  kategori    ENUM('Ponsel','Aksesori','Audio','Pengisian Daya','Wearable') NOT NULL,
  harga       DECIMAL(12,0) NOT NULL DEFAULT 0,
  stok        INT          NOT NULL DEFAULT 0,
  deskripsi   TEXT,
  image_url   VARCHAR(500) DEFAULT 'svg:umum',
  unggulan    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_kategori (kategori),
  INDEX idx_unggulan (unggulan)
);

-- ---------- ORDERS (pemesanan via WhatsApp) ----------
CREATE TABLE IF NOT EXISTS orders (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          NOT NULL,
  product_id  INT          NOT NULL,
  seller_id   INT          NOT NULL,
  qty         INT          NOT NULL DEFAULT 1,
  total       DECIMAL(12,0) NOT NULL,
  status      ENUM('baru','diproses','dikirim','selesai','batal') NOT NULL DEFAULT 'baru',
  wa_number   VARCHAR(20)  NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id)  REFERENCES users(id) ON DELETE CASCADE
);

-- ---------- SETTINGS (key-value) ----------
CREATE TABLE IF NOT EXISTS settings (
  setting_key   VARCHAR(50) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL
);
