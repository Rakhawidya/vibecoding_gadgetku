# GadgetKu — Aplikasi Web Etalase Gadget

Aplikasi web etalase digital gadget & aksesori elektronik dengan pemesanan via WhatsApp.
Project ini berisi **Node.js (Express) API + frontend statis** (SPA ringan), dengan dua mode
database: **SQLite untuk development** (tanpa setup) dan **MySQL untuk produksi**.

## ✨ Fitur Utama

- Katalog produk dengan pencarian, filter kategori, sorting, dan tombol pesan WhatsApp.
- Dashboard CRUD produk (tambah, edit, hapus) dengan **upload gambar** (JPG/PNG/WebP/GIF, maks. 3 MB) atau placeholder lokal.
- **Edit nama toko & nomor WhatsApp** langsung dari dashboard (admin dan seller).
- Ringkasan total produk, stok, kategori, pesanan, dan omzet.
- Mode dev SQLite tanpa setup; MySQL untuk produksi.

## 🚀 Cara Menjalankan

Prasyarat: **Node.js 24+** (diuji pada Node 26). Tidak perlu MySQL untuk mode development.

```bash
# dari folder root project
npm install

# siapkan konfigurasi (sekali saja)
copy server\.env.example server\.env   # PowerShell/cmd Windows
# lalu isi SEED_PASSWORD di server\.env

npm run dev
```

Buka **http://localhost:3000**.

`npm run dev` otomatis:
1. membuat database SQLite `server/db/gadgetku.dev.db`,
2. mengisi 3 akun contoh + 8 produk contoh (hanya jika database masih kosong),
3. menjalankan server dengan mode watch.

### Akun contoh

| Env var | Role | Keterangan |
|---|---|---|
| `SEED_ADMIN_EMAIL` | admin | Akses penuh sistem |
| `SEED_SELLER_EMAIL` | seller | Pemilik 8 produk contoh |
| `SEED_PEMBELI_EMAIL` | pembeli | Akun pembeli biasa |

Email dan password ketiga akun diambil dari **`server/.env`**:
- `SEED_ADMIN_EMAIL`, `SEED_SELLER_EMAIL`, `SEED_PEMBELI_EMAIL`
- `SEED_PASSWORD` (minimal 6 karakter)

Nilai tersebut hanya dipakai saat seed. Ubah password setelah login lewat menu Profil bila perlu.

### Perintah lain

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan development server (auto-init database SQLite jika kosong) |
| `npm start` | Jalankan server tanpa watch |
| `npm run db:init` | Seed ulang data contoh (produk direset ke 8 item) |
| `npm run setup` | Install dependency server + seed database |

**Reset total database dev:** hapus `server/db/gadgetku.dev.db`, lalu jalankan `npm run dev`.

### Mode MySQL (produksi)

1. Siapkan MySQL yang berjalan di `localhost:3306`.
2. Ubah `server/.env`:
   ```env
   DB_CLIENT=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=password_mysql_anda
   DB_NAME=gadgetku
   JWT_SECRET=ganti-dengan-string-acak-yang-panjang
   SEED_ADMIN_EMAIL=admin@tokoanda.id
   SEED_SELLER_EMAIL=seller@tokoanda.id
   SEED_PEMBELI_EMAIL=pembeli@contoh.id
   SEED_PASSWORD=password-kuat-anda
   ```
3. Inisialisasi database & jalankan:
   ```bash
   npm run db:init
   npm run dev
   ```

---

## 🔐 Hak Akses per Role

| Fitur | 👑 Admin | 🏪 Seller | 🛒 Pembeli |
|---|:---:|:---:|:---:|
| Lihat katalog, cari, filter, sorting | ✅ | ✅ | ✅ |
| Daftar akun pembeli / login | ✅ | ✅ | ✅ |
| Pesan produk via WhatsApp | ✅* | ✅* | ✅ |
| Lihat riwayat pesanan **sendiri** | ✅ | ✅ | ✅ |
| Lihat pesanan untuk **produk miliknya** | ✅ (semua) | ✅ | ❌ |
| Ubah status pesanan | ✅ (semua) | ✅ (miliknya) | ❌ |
| Tambah / ubah / hapus produk | ✅ (semua) | ✅ (miliknya saja) | ❌ |
| Statistik dashboard toko | ✅ (seluruh toko) | ✅ (toko sendiri) | ❌ |
| Kelola pengguna (lihat, buat, ubah role, hapus) | ✅ | ❌ | ❌ |
| Pengaturan toko (nama toko, nomor WhatsApp) | ✅ | ✅ | ❌ |
| Ubah profil sendiri (nama, WA, password) | ✅ | ✅ | ✅ |

\*) Pemesanan mencatat order di database lalu membuka `wa.me` dengan pesan otomatis.

**Implementasi keamanan:**
- Autentikasi JWT (`Authorization: Bearer <token>`), password di-hash bcrypt.
- Setiap endpoint dilindungi middleware `authenticate` + `requireRole(...)`.
- Seller hanya boleh mengakses produk/pesanan dengan `seller_id` miliknya (dicek di server).
- Data produk/pengguna diambil dari database; localStorage hanya menyimpan token sesi & tema.

## 🗂️ Struktur Proyek

```
GadgetKu/
├── package.json          # Script root: dev, start, db:init, setup
├── server/               # Backend Node.js + Express
│   ├── db/
│   │   ├── schema.sql          # Skema MySQL
│   │   ├── schema.sqlite.sql   # Skema SQLite (dev)
│   │   └── gadgetku.dev.db     # Database dev (dibuat otomatis)
│   ├── src/
│   │   ├── index.js      # Entrypoint server (API + frontend statis)
│   │   ├── db.js         # Koneksi MySQL / SQLite
│   │   ├── auth.js       # Middleware JWT & role
│   │   ├── init-db.js    # Setup + seed database
│   │   └── routes/       # auth, products, orders, users, settings, stats
│   └── .env.example
├── public/               # Frontend SPA (dilayani oleh server Express)
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── uploads/          # Gambar produk hasil upload (dev)
├── prototipe_aplikasi_web_gadgetku (2).html   # Prototipe asli (referensi)
└── spesifikasi_teknis_gadgetku.md             # SPEC MVP (referensi)
```

## 🌐 Ringkasan API

| Method | Endpoint | Akses |
|---|---|---|
| POST | `/api/auth/register` | Publik (menjadi pembeli) |
| POST | `/api/auth/login` | Publik |
| GET/PUT | `/api/auth/me` | Semua yang login |
| POST | `/api/uploads` | admin, seller (upload gambar produk) |
| GET | `/api/products` | Publik |
| POST/PUT/DELETE | `/api/products[/:id]` | admin, seller (miliknya) |
| GET | `/api/products/mine/list` | admin, seller |
| POST | `/api/orders` | semua yang login |
| GET | `/api/orders` | pembeli: miliknya · seller: produknya · admin: semua |
| PUT | `/api/orders/:id/status` | admin, seller (miliknya) |
| GET/POST/DELETE | `/api/users` | **admin saja** |
| PATCH | `/api/users/:id/role` | **admin saja** |
| GET | `/api/settings` | Publik |
| PUT | `/api/settings` | **admin saja** |
| GET | `/api/stats` | admin, seller |
| GET | `/api/health` | Publik (cek server) |
"# vibecoding_gadgetku" 
