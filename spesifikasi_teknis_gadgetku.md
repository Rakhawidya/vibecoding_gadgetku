# Spesifikasi Teknis (SPEC.md): GadgetKu

**Judul proyek:** Pengembangan Etalase Digital Gadget dan Aksesori Elektronik Berbasis Web dengan Tautan Pemesanan WhatsApp
**Versi dokumen:** 1.1 (MVP)
**Tech stack:** Vite + JavaScript vanilla (ES6+), HTML5, CSS3, `localStorage`, Web Crypto API
**Arsitektur:** aplikasi statis sisi klien, tanpa backend, satu perangkat

---

## 1. Tujuan

1. Menyediakan etalase digital yang ringan dan responsif untuk menampilkan gadget dan aksesori elektronik skala kecil.
2. Memudahkan calon pembeli mencari, menyaring, dan memesan produk lewat tautan WhatsApp (`wa.me`) tanpa registrasi dan tanpa keranjang.
3. Menyediakan dashboard pengelolaan produk (CRUD, upload gambar, pengaturan nomor WhatsApp) yang hanya dapat dibuka oleh **admin** setelah memasukkan kata sandi lokal.
4. Menyimpan semua data di perangkat (`localStorage`) tanpa server.

---

## 2. Pengguna dan Peran

| Peran | Cara masuk | Hak akses |
| :--- | :--- | :--- |
| **Pembeli** | Tanpa login (peran bawaan) | Melihat katalog, mencari, memfilter, mengurutkan, memesan via WhatsApp, mengganti tema |
| **Admin** | Memasukkan kata sandi admin | Semua hak Pembeli, ditambah dashboard: ringkasan, CRUD produk, upload gambar, ganti nomor WhatsApp, ganti kata sandi, reset data contoh |

### Catatan jujur tentang keamanan peran admin
Aplikasi tidak memiliki server, sehingga kata sandi admin **hanya menjadi pembatas antarmuka (kunci lokal)**, bukan autentikasi yang aman. Siapa pun yang menguasai perangkat dan mengerti DevTools dapat membaca atau mengubah `localStorage`. Karena itu:

- Antarmuka memakai label **"Mode Admin (kunci lokal)"**, bukan "login aman".
- Kata sandi tidak boleh sama dengan kata sandi akun lain. Aplikasi menampilkan peringatan ini saat pembuatan kata sandi.
- Tidak ada data sensitif (nomor pribadi, kredensial, API key) yang boleh disimpan di aplikasi.

---

## 3. Daftar Fitur MVP

### A. Etalase Pembeli (publik)

| ID | Fitur | Deskripsi |
| :--- | :--- | :--- |
| FR-01 | Katalog data contoh | 8 produk generik tanpa merek dimuat saat penggunaan pertama (lihat bagian 5.5) |
| FR-02 | Gambar produk | Menampilkan gambar hasil upload; jika kosong, memakai placeholder SVG lokal sesuai kategori |
| FR-03 | Kartu produk | Gambar, kategori, lencana "Unggulan", nama, deskripsi singkat, harga (`Rp185.000`), stok dalam `unit` |
| FR-04 | Pencarian | Real-time, tidak peka huruf besar/kecil, pada nama dan deskripsi |
| FR-05 | Filter kategori | Semua, atau satu dari 5 kategori baku |
| FR-06 | Sorting | Unggulan dulu (bawaan), Harga terendah, Harga tertinggi, Nama A-Z |
| FR-07 | Pesan WhatsApp | Tombol membuka tab baru ke `https://wa.me/<nomor>?text=<pesan>`; pesan memuat nama produk dan harga; nonaktif jika stok `0` |
| FR-08 | Status kosong | Pesan jelas bila hasil pencarian/filter kosong |
| FR-09 | Ganti tema | Pilihan Terang, Gelap, Ikuti sistem; tersimpan; diterapkan sebelum render pertama; transisi warna halus |

### B. Mode Admin

| ID | Fitur | Deskripsi |
| :--- | :--- | :--- |
| FR-10 | Pembuatan kata sandi admin | Saat pertama kali membuka mode admin, pengguna membuat kata sandi (minimal 8 karakter, ada kolom konfirmasi) |
| FR-11 | Masuk admin | Form kata sandi; 5 kali gagal berturut-turut mengunci form selama 60 detik |
| FR-12 | Keluar dan sesi | Tombol "Keluar"; sesi berakhir otomatis setelah 15 menit tanpa aktivitas dan saat tab ditutup |
| FR-13 | Ganti kata sandi | Memerlukan kata sandi lama |
| FR-14 | Lupa kata sandi | Opsi "Reset total" yang menghapus semua data (produk, pengaturan, kata sandi) setelah konfirmasi dua langkah; tidak ada pemulihan lain karena tidak ada server |
| FR-15 | Ringkasan toko | Total produk, total stok (unit), jumlah kategori aktif; dihitung dinamis |
| FR-16 | CRUD produk | Tambah, lihat (tabel), ubah, hapus dengan konfirmasi dua langkah |
| FR-17 | Upload gambar | Pilih berkas JPG/PNG/WebP, pratinjau, hapus gambar, fallback placeholder (aturan di bagian 6.3) |
| FR-18 | Ganti nomor WhatsApp | Input dinormalisasi dan divalidasi; berlaku langsung pada semua tombol pesan tanpa muat ulang |
| FR-19 | Reset data contoh | Mengembalikan 8 produk contoh; tidak menghapus kata sandi, nomor WhatsApp, maupun tema |
| FR-20 | Penyimpanan | Produk, pengaturan, kredensial admin, dan preferensi tema disimpan di `localStorage` dengan penanganan error |

### C. Alur Akses Admin

```
Buka #admin
  ├─ Belum ada kata sandi tersimpan → layar "Buat kata sandi admin" → masuk dashboard
  ├─ Ada kata sandi, belum ada sesi  → layar "Masuk admin"          → masuk dashboard
  └─ Sesi aktif                      → dashboard

Pembeli membuka #admin tanpa sesi → tidak pernah melihat isi dashboard
Sesi berakhir (idle 15 menit / Keluar / tab ditutup) → kembali ke #katalog
```

---

## 4. Navigasi

| Rute (hash) | Tampilan | Akses |
| :--- | :--- | :--- |
| `#katalog` (bawaan) | Etalase | Semua |
| `#admin` | Layar masuk/buat kata sandi, atau dashboard bila sesi aktif | Semua (isi dashboard hanya untuk admin) |

Header memuat: nama aplikasi, pemilih tema, dan tombol "Masuk Admin" (pembeli) atau "Dashboard" dan "Keluar" (admin).

---

## 5. Data Model

### 5.1 Entitas `Product`
Array objek pada key `gadgetku_products`.

| Properti | Tipe | Aturan | Contoh |
| :--- | :--- | :--- | :--- |
| `id` | string | Unik, dibuat otomatis (mis. `prod-` + timestamp + angka acak) | `"prod-1731700000000-48"` |
| `nama` | string | Wajib, 3-60 karakter setelah di-trim | `"Earphone Kabel Tipe-C"` |
| `kategori` | string | Salah satu dari 5 kategori baku | `"Audio"` |
| `harga` | number | Angka hingga, ≥ 0, maksimum 1.000.000.000 | `45000` |
| `stok` | integer | Bilangan bulat, ≥ 0, maksimum 100.000 | `35` |
| `deskripsi` | string | Opsional, maksimum 200 karakter | `"Suara jernih dengan mikrofon."` |
| `imageUrl` | string | Kosong `""` (pakai placeholder) atau data URL gambar hasil upload berformat `data:image/(jpeg\|webp);base64,...` | `""` |
| `unggulan` | boolean | `true` atau `false` | `true` |

### 5.2 Entitas `StoreSettings`
Objek pada key `gadgetku_settings`.

| Properti | Tipe | Aturan | Contoh |
| :--- | :--- | :--- | :--- |
| `whatsappNumber` | string | Hanya digit, diawali `62`, total 10-15 digit | `"6281200000000"` |

Nilai bawaan `6281200000000` adalah nomor contoh dan bukan nomor pribadi.

### 5.3 Entitas `AdminCredential`
Objek pada key `gadgetku_admin`. Tidak ada kata sandi bawaan di kode sumber.

| Properti | Tipe | Keterangan |
| :--- | :--- | :--- |
| `salt` | string | 16 byte acak, base64 |
| `hash` | string | PBKDF2-SHA256, 100.000 iterasi, base64 |
| `failedCount` | integer | Jumlah gagal berturut-turut |
| `lockUntil` | number | Timestamp (ms) akhir penguncian, `0` jika tidak terkunci |

### 5.4 Entitas lain

| Key | Isi | Penyimpanan |
| :--- | :--- | :--- |
| `gadgetku_prefs` | `{ "theme": "light" \| "dark" \| "system" }`, bawaan `system` | `localStorage` |
| `gadgetku_session` | `{ "expiresAt": <timestamp ms> }`, diperpanjang tiap aktivitas | `sessionStorage` |
| `gadgetku_schema` | `"1"` untuk versi skema data | `localStorage` |

### 5.5 Kategori baku dan data contoh

Kategori: `Ponsel`, `Aksesori`, `Audio`, `Pengisian Daya`, `Wearable`.

| No | Nama | Kategori | Harga (Rp) | Stok | Unggulan |
| :--- | :--- | :--- | ---: | ---: | :--- |
| 1 | Earphone Kabel Tipe-C | Audio | 45.000 | 35 | Ya |
| 2 | Headset Nirkabel Lipat | Audio | 150.000 | 14 | Tidak |
| 3 | Charger Dinding 20W | Pengisian Daya | 65.000 | 40 | Ya |
| 4 | Power Bank 10.000 mAh | Pengisian Daya | 185.000 | 18 | Ya |
| 5 | Kabel Data Tipe-C 1 m | Aksesori | 25.000 | 60 | Tidak |
| 6 | Holder Ponsel Lipat | Aksesori | 30.000 | 0 | Tidak |
| 7 | Ponsel Pintar Entry-Level 4/64 GB | Ponsel | 1.450.000 | 6 | Tidak |
| 8 | Jam Pintar Layar Sentuh | Wearable | 275.000 | 9 | Tidak |

Ringkasan yang diharapkan dari data contoh: **8 produk, total stok 182 unit, 5 kategori**. Produk nomor 6 sengaja bersetok 0 untuk menguji tombol nonaktif.

---

## 6. Aturan Bisnis dan Validasi

### 6.1 Format harga
Rupiah dengan pemisah ribuan titik tanpa spasi, mis. `Rp185.000`.

### 6.2 Normalisasi nomor WhatsApp
1. Hapus semua karakter non-digit (spasi, `-`, `+`, tanda kurung).
2. Jika diawali `0`, ganti `0` dengan `62`.
3. Jika diawali `62`, biarkan.
4. Selain itu, tolak dengan pesan "Awali dengan 0 atau 62".
5. Hasil harus 10-15 digit; jika tidak, tolak.

Contoh: `0899-1234-5678` menjadi `6289912345678`; `+62 899 1234 5678` menjadi `6289912345678`.

### 6.3 Aturan upload gambar
- Format diterima: JPG, PNG, WebP. **SVG ditolak** karena dapat memuat skrip.
- Ukuran berkas maksimum 2 MB sebelum diproses.
- Jenis berkas diperiksa dari tipe MIME dan tanda byte awal (file signature), bukan dari ekstensi.
- Gambar diubah ukurannya di browser (sisi terpanjang maksimum 800 px) dan dikompres ke WebP atau JPEG, lalu disimpan sebagai data URL.
- Hasil kompresi ditargetkan di bawah 200 KB per gambar.
- Gambar tidak dikirim ke server mana pun.
- Saat data dimuat, `imageUrl` yang tidak cocok dengan pola data URL gambar yang diizinkan dianggap kosong (mencegah nilai berbahaya dari `localStorage` yang dimanipulasi).

### 6.4 Batas aplikasi
- Maksimum 100 produk.
- Pesan galat penyimpanan ditampilkan bila `localStorage` penuh atau dinonaktifkan; data yang sudah ada tidak boleh rusak.

### 6.5 Kata sandi admin
- Minimal 8 karakter, maksimum 64.
- Disimpan hanya sebagai hash PBKDF2 dengan salt acak; kata sandi asli tidak pernah disimpan.
- Pembanding hash dilakukan setelah derivasi, bukan pada teks asli.

---

## 7. Non-Functional Requirements

| ID | Kategori | Persyaratan | Cara memeriksa |
| :--- | :--- | :--- | :--- |
| NFR-01 | Performa | Halaman katalog tampil dan dapat digunakan dalam 2 detik pada perangkat menengah untuk 100 produk | Hitung manual atau pakai tab Performance DevTools |
| NFR-02 | Keamanan | Semua teks pengguna di-escape atau dirender lewat `textContent`; tautan WhatsApp memakai `encodeURIComponent`; tautan eksternal memakai `rel="noopener"` | Uji masukan `<img src=x onerror=alert(1)>` (AC-26) |
| NFR-03 | Privasi | Tanpa API key, tanpa nomor pribadi, tanpa pelacak atau permintaan jaringan eksternal selain tautan `wa.me` yang diklik pengguna | Tab Network DevTools kosong saat memuat halaman |
| NFR-04 | Offline | Setelah dimuat, aplikasi tetap berfungsi tanpa internet karena semua aset lokal | Aktifkan mode offline DevTools, muat ulang dari cache, uji fitur |
| NFR-05 | Responsif | Layout nyaman pada lebar 360 px, tablet, dan desktop tanpa gulir horizontal pada halaman | Uji ukuran 360 px dan 1280 px |
| NFR-06 | Aksesibilitas | Seluruh kontrol dapat dioperasikan dengan keyboard; fokus terlihat; teks memiliki kontras WCAG AA di kedua tema; gambar memiliki teks alternatif; `prefers-reduced-motion` dihormati | Uji tab keyboard, pemeriksa kontras |
| NFR-07 | Tema | Tema tersimpan diterapkan sebelum render pertama (tanpa kedipan); transisi sekitar 200 ms | Muat ulang dengan tema Gelap |
| NFR-08 | Kompatibilitas | Chrome, Edge, Firefox, dan Safari dua versi terakhir | Uji manual di browser yang tersedia |
| NFR-09 | Kepatuhan aset | Tanpa merek dagang, logo, foto, font, atau ikon berhak cipta; placeholder dibuat sendiri | Periksa berkas proyek dan isi data contoh |
| NFR-10 | Ketahanan data | Data `localStorage` rusak atau tidak valid ditangani tanpa membuat halaman gagal; aplikasi kembali ke data contoh dengan pemberitahuan | AC-25 |

---

## 8. Risiko dan Mitigasi

| No | Risiko | Dampak | Mitigasi |
| :--- | :--- | :--- | :--- |
| R1 | Pengguna membersihkan data situs browser | Semua produk, pengaturan, dan kata sandi hilang | Tampilkan catatan "data tersimpan di perangkat ini"; sediakan Reset Data Contoh; (iterasi lanjutan) ekspor/impor JSON |
| R2 | Kata sandi admin dianggap aman padahal hanya kunci lokal | Rasa aman palsu; data dapat diubah lewat DevTools | Label "kunci lokal", peringatan di layar pembuatan kata sandi, dokumentasi di bagian 2 |
| R3 | Admin lupa kata sandi | Tidak bisa mengelola produk | Opsi Reset total dengan konfirmasi dua langkah; peringatan bahwa semua data hilang |
| R4 | Web Crypto tidak tersedia (konteks tidak aman) | Kata sandi tidak dapat di-hash | Jalankan lewat `localhost` atau HTTPS; tampilkan pesan jelas dan nonaktifkan mode admin bila API tidak ada |
| R5 | Kuota `localStorage` (sekitar 5 MB) penuh karena gambar | Penyimpanan gagal | Resize dan kompres gambar, batas 100 produk, pesan galat, data lama tidak ditimpa bila gagal |
| R6 | Berkas upload berbahaya atau menyamar | Injeksi konten | Tolak SVG, validasi MIME dan signature, render ulang lewat canvas, validasi pola data URL saat memuat |
| R7 | Nomor WhatsApp salah format | Tautan `wa.me` gagal | Normalisasi dan validasi (bagian 6.2) |
| R8 | Harga atau stok tidak logis | Informasi menyesatkan | Validasi HTML5 dan JavaScript sebelum simpan |
| R9 | Injeksi HTML lewat nama atau deskripsi | XSS | Escape atau `textContent` pada semua keluaran |
| R10 | Brute force kata sandi | Akses admin tidak sah | Penguncian 60 detik setelah 5 kegagalan, PBKDF2 100.000 iterasi (dengan catatan bahwa serangan offline tetap mungkin, lihat R2) |
| R11 | Penggunaan nama merek pada data baru yang dimasukkan admin | Pelanggaran merek dagang | Catatan di form: gunakan nama generik; tanggung jawab ada pada admin |

---

## 9. Out-of-Scope

1. WhatsApp Business API, webhook, bot balasan, atau pengiriman pesan dari server.
2. Pembayaran (payment gateway, transfer, e-wallet).
3. Keranjang belanja dan pemesanan multi-produk; satu tombol memesan satu produk.
4. Autentikasi sungguhan: server, token, peran berbasis server, banyak akun admin, pemulihan kata sandi lewat email atau SMS, sinkronisasi antarperangkat.
5. Upload gambar ke server atau penyimpanan cloud.
6. Riwayat pesanan, pelaporan penjualan, dan pengurangan stok otomatis saat pesan dikirim.
7. Ekspor/impor data (kandidat iterasi berikutnya).
8. Multi-bahasa; antarmuka hanya Bahasa Indonesia.

---

## 10. Kriteria Penerimaan (diperiksa manual)

Catat hasil pada kolom Status: Lulus / Gagal. Awali pengujian dengan membersihkan data situs, kecuali disebutkan lain.

### 10.1 Etalase

| ID | Skenario | Langkah | Hasil yang diharapkan | Status |
| :--- | :--- | :--- | :--- | :--- |
| AC-01 | Data contoh | Buka aplikasi pertama kali | Tampil 8 produk sesuai bagian 5.5 dengan harga `Rp...`, stok `unit`, kategori, dan placeholder SVG; 3 produk berlencana Unggulan | |
| AC-02 | Pencarian | Ketik `charger`, lalu `CHARGER`, lalu kosongkan | Hanya "Charger Dinding 20W" tampil untuk kedua huruf; setelah dikosongkan 8 produk kembali | |
| AC-03 | Pencarian kosong | Ketik `zzzz` | Tampil pesan status kosong, bukan layar kosong | |
| AC-04 | Filter kategori | Pilih `Audio` | Hanya 2 produk Audio tampil; memilih "Semua" menampilkan 8 | |
| AC-05 | Sorting | Pilih Harga terendah, Harga tertinggi, Nama A-Z, Unggulan | Urutan sesuai: terendah mulai Rp25.000; tertinggi mulai Rp1.450.000; A-Z mulai "Charger..."; Unggulan menampilkan 3 produk unggulan di depan | |
| AC-06 | Tautan WhatsApp | Klik "Pesan via WhatsApp" pada Power Bank | Tab baru terbuka ke `https://wa.me/6281200000000?text=...`; pesan memuat "Power Bank 10.000 mAh" dan "Rp185.000" | |
| AC-07 | Stok habis | Lihat "Holder Ponsel Lipat" | Tombol nonaktif dan berlabel stok habis; tidak membuka tab saat diklik | |

### 10.2 Tema

| ID | Skenario | Langkah | Hasil yang diharapkan | Status |
| :--- | :--- | :--- | :--- | :--- |
| AC-08 | Ganti tema | Pilih Gelap, lalu Terang, lalu Ikuti sistem | Warna berubah halus sekitar 200 ms; teks tetap terbaca di kedua tema | |
| AC-09 | Tema bertahan | Pilih Gelap, muat ulang | Halaman langsung gelap tanpa kedipan terang; pilihan tetap Gelap | |
| AC-10 | Ikuti sistem | Pilih Ikuti sistem, ubah tema OS atau emulasi DevTools | Tampilan mengikuti perubahan | |

### 10.3 Akses admin

| ID | Skenario | Langkah | Hasil yang diharapkan | Status |
| :--- | :--- | :--- | :--- | :--- |
| AC-11 | Pembeli ke dashboard | Tanpa masuk, buka `#admin` | Hanya layar masuk/buat kata sandi tampil; tidak ada ringkasan, tabel, atau form produk | |
| AC-12 | Buat kata sandi pertama | Pada data bersih, buka `#admin`; isi kata sandi 5 karakter; lalu 8 karakter dengan konfirmasi tidak cocok; lalu 8 karakter dengan konfirmasi cocok | Dua percobaan pertama ditolak dengan pesan jelas; yang ketiga berhasil masuk dashboard; peringatan "kunci lokal" tampil | |
| AC-13 | Kata sandi tidak tersimpan polos | Buka DevTools, Application, Local Storage, `gadgetku_admin` | Hanya `salt`, `hash`, `failedCount`, `lockUntil`; kata sandi asli tidak ada di mana pun | |
| AC-14 | Masuk salah dan benar | Keluar, masuk dengan kata sandi salah, lalu benar | Salah: pesan galat tanpa membuka dashboard; benar: dashboard terbuka | |
| AC-15 | Penguncian | Masukkan kata sandi salah 5 kali berturut-turut | Form terkunci 60 detik dengan hitung mundur; kata sandi benar pun ditolak selama terkunci; setelah 60 detik dapat dicoba lagi | |
| AC-16 | Keluar dan timeout | Klik Keluar; masuk lagi dan diamkan 15 menit (atau ubah `expiresAt` di `sessionStorage` ke waktu lampau lalu lakukan aksi) | Keduanya mengembalikan ke katalog dan dashboard tidak lagi dapat diakses tanpa masuk | |
| AC-17 | Sesi berakhir saat tab ditutup | Masuk, tutup tab, buka lagi `#admin` | Diminta masuk kembali | |
| AC-18 | Ganti kata sandi | Di dashboard, ganti dengan kata sandi lama salah, lalu benar | Salah ditolak; benar berhasil; masuk dengan kata sandi lama gagal, dengan yang baru berhasil | |
| AC-19 | Lupa kata sandi | Di layar masuk, pilih Reset total dan konfirmasi dua langkah | Semua data terhapus; aplikasi kembali ke kondisi awal dengan 8 produk contoh dan meminta pembuatan kata sandi baru; membatalkan konfirmasi tidak menghapus apa pun | |

### 10.4 Dashboard admin

| ID | Skenario | Langkah | Hasil yang diharapkan | Status |
| :--- | :--- | :--- | :--- | :--- |
| AC-20 | Ringkasan | Masuk sebagai admin pada data contoh | Total Produk 8, Total Stok 182 unit, Kategori 5 | |
| AC-21 | Tambah produk | Isi Nama `Kabel Data Braided 1m`, Kategori Aksesori, Harga 35000, Stok 20, centang Unggulan; simpan; muat ulang | Ringkasan menjadi 9 produk dan 202 unit; produk tampil di etalase dengan lencana Unggulan; data tetap ada setelah muat ulang | |
| AC-22 | Validasi form | Coba simpan: nama kosong, nama 2 karakter, harga `-1`, stok `1,5`, stok `-3`, harga kosong | Setiap kasus ditolak dengan pesan di dekat kolom terkait; tidak ada data tersimpan | |
| AC-23 | Ubah produk | Edit stok sebuah produk menjadi 0, simpan | Etalase menampilkan tombol nonaktif pada produk itu; ringkasan stok berkurang | |
| AC-24 | Hapus produk | Klik Hapus sekali, lalu klik konfirmasi; ulangi dengan membiarkan konfirmasi kedaluwarsa | Hapus langsung tidak terjadi pada klik pertama; produk hilang dari etalase dan tabel setelah konfirmasi; bila konfirmasi dibiarkan, tombol kembali normal | |
| AC-25 | Reset data contoh | Ubah beberapa produk, klik Reset data contoh | 8 produk contoh kembali; kata sandi admin, nomor WhatsApp, dan tema tidak berubah | |

### 10.5 Upload gambar dan nomor WhatsApp

| ID | Skenario | Langkah | Hasil yang diharapkan | Status |
| :--- | :--- | :--- | :--- | :--- |
| AC-26 | Upload valid | Upload JPG, PNG, dan WebP pada produk berbeda | Pratinjau tampil sebelum simpan; setelah simpan gambar tampil di kartu etalase dan tetap ada setelah muat ulang | |
| AC-27 | Upload ditolak | Coba berkas `.svg`, berkas teks yang diganti nama menjadi `.jpg`, dan gambar di atas 2 MB | Ketiganya ditolak dengan pesan jelas; produk tidak berubah | |
| AC-28 | Ukuran gambar | Upload foto beresolusi besar (mis. 4000 px) lalu periksa nilai `imageUrl` di DevTools | Gambar tampil tajam di kartu; sisi terpanjang tersimpan tidak lebih dari 800 px; ukuran data kurang dari sekitar 200 KB | |
| AC-29 | Hapus gambar | Pada produk bergambar, klik Hapus gambar dan simpan | Etalase kembali menampilkan placeholder SVG | |
| AC-30 | Ganti nomor WhatsApp | Masukkan `089912345678`, simpan, lalu klik tombol pesan | Tersimpan sebagai `6289912345678`; tautan `wa.me` mengarah ke nomor itu tanpa muat ulang halaman; tetap berlaku setelah muat ulang | |
| AC-31 | Nomor tidak valid | Masukkan `abc`, `123`, `+1 202 555 0100`, dan nomor 20 digit | Semua ditolak dengan pesan jelas; nomor sebelumnya tidak berubah | |

### 10.6 Ketahanan, keamanan, dan kepatuhan

| ID | Skenario | Langkah | Hasil yang diharapkan | Status |
| :--- | :--- | :--- | :--- | :--- |
| AC-32 | Data rusak | Ubah `gadgetku_products` di DevTools menjadi `{rusak`, muat ulang | Aplikasi tidak error; menampilkan 8 produk contoh dan pemberitahuan bahwa data diperbaiki | |
| AC-33 | Nilai `imageUrl` berbahaya | Ubah `imageUrl` satu produk menjadi `javascript:alert(1)` di DevTools, muat ulang | Tidak ada skrip berjalan; produk memakai placeholder | |
| AC-34 | Penyimpanan penuh | Simulasikan kuota penuh (mis. isi `localStorage` dengan data besar), lalu simpan produk | Pesan galat tampil; produk yang sudah ada tetap utuh | |
| AC-35 | Injeksi HTML | Simpan produk bernama `<img src=x onerror=alert(1)>` | Teks tampil apa adanya sebagai teks; tidak ada dialog atau skrip berjalan | |
| AC-36 | Responsif | Buka pada lebar 360 px dan 1280 px | Tidak ada gulir horizontal pada halaman (tabel boleh bergulir di wadahnya); semua kontrol terjangkau | |
| AC-37 | Keyboard | Operasikan katalog dan form hanya dengan Tab, Enter, Spasi | Seluruh fitur dapat dipakai dan fokus selalu terlihat | |
| AC-38 | Kepatuhan | Cari di kode sumber kata `api_key`, `token`, `password` bawaan; periksa tab Network; periksa aset | Tidak ada kredensial atau nomor pribadi; tidak ada permintaan eksternal saat memuat; tidak ada aset berhak cipta | |

---

## 11. Rencana Implementasi per Iterasi

### Iterasi 1: Fondasi proyek
- Buat proyek Vite vanilla (`npm create vite@latest gadgetku -- --template vanilla`).
- Struktur: `index.html`, `src/main.js`, `src/style.css`, `src/data/seed.js`, `src/utils/` (`format.js`, `escape.js`, `placeholders.js`, `phone.js`), `src/services/` (`storage.js`, `auth.js`, `image.js`), `src/views/` (`catalog.js`, `admin.js`, `login.js`).
- Buat 8 data contoh dan generator placeholder SVG per kategori.
- **Selesai bila:** AC-01 lulus pada tampilan statis.

### Iterasi 2: Penyimpanan dan utilitas
- Modul `storage.js` dengan try/catch, validasi saat memuat, versi skema, dan perbaikan data rusak.
- Pemformat Rupiah, normalisasi nomor WhatsApp, pembuat tautan `wa.me`, fungsi escape, dan validator `imageUrl`.
- **Selesai bila:** AC-30, AC-31, AC-32, AC-33 lulus.

### Iterasi 3: Etalase pembeli dan tema
- Grid kartu responsif, pencarian, filter, sorting, status kosong, tombol WhatsApp, dan penanganan stok habis.
- Pemilih tema dengan skrip kecil di `<head>` agar tema diterapkan sebelum render pertama.
- **Selesai bila:** AC-02 sampai AC-10, AC-36, dan AC-37 (bagian etalase) lulus.

### Iterasi 4: Mode admin (kunci lokal)
- `auth.js`: pembuatan kata sandi, hash PBKDF2 dengan salt, verifikasi, penguncian setelah 5 kegagalan, sesi di `sessionStorage` dengan idle timeout 15 menit, ganti kata sandi, dan reset total.
- Rute `#admin` dengan penjaga akses; layar buat kata sandi dan masuk; tombol Keluar.
- **Selesai bila:** AC-11 sampai AC-19 lulus.

### Iterasi 5: Dashboard admin dan CRUD
- Kartu ringkasan, tabel produk, form tambah/ubah dengan validasi, hapus dengan konfirmasi dua langkah, dan Reset data contoh.
- Form pengaturan nomor WhatsApp yang langsung memperbarui tautan di etalase.
- **Selesai bila:** AC-20 sampai AC-25, AC-30, dan AC-31 lulus.

### Iterasi 6: Upload gambar
- `image.js`: validasi MIME dan signature, batas 2 MB, resize ke maksimum 800 px lewat canvas, kompresi, pratinjau, dan hapus gambar.
- Penanganan kuota penuh dan pesan galat.
- **Selesai bila:** AC-26 sampai AC-29 dan AC-34 lulus.

### Iterasi 7: Pengujian akhir dan penyempurnaan
- Jalankan seluruh AC-01 sampai AC-38 dan catat hasilnya.
- Periksa kontras kedua tema, navigasi keyboard, responsivitas, dan kepatuhan aset.
- Rapikan pesan galat dan teks bantuan; build produksi (`npm run build`) dan uji hasil build lewat `npm run preview`.
- **Selesai bila:** semua AC berstatus Lulus.

---

## 12. Definition of Done

1. Seluruh kriteria penerimaan AC-01 sampai AC-38 berstatus Lulus.
2. `npm run build` berhasil tanpa galat dan hasil build berjalan lewat `npm run preview`.
3. Tidak ada API key, kredensial bawaan, nomor pribadi, atau aset berhak cipta di repositori.
4. Peringatan bahwa mode admin hanyalah kunci lokal tampil di aplikasi dan terdokumentasi di README.