# Backend Sistem Manajemen Bengkel

API untuk Sistem Manajemen Bengkel (Capstone Design Project, Universitas Telkom Purwokerto). Fiturnya: Manajemen Stok, Keuangan Bengkel, Akun & Akses, Pelanggan, dan Reminder. Dipakai tiga role (`admin`, `kasir`, `mekanik`) lewat HTTP API di `/api/v1`.

**Stack:** Node.js (ES Modules) · Express 5 · MySQL 8 · Prisma 6 · Zod · JWT di cookie httpOnly · Vitest

Aturan kerja dan aturan bisnis ada di [`../agent.md`](../agent.md). Rancangan teknis lengkap (schema, alur kritis, fase) ada di [`../docs/backend-implementation.md`](../docs/backend-implementation.md).

## Prasyarat

- Node.js 20 atau lebih baru (disarankan 22 LTS)
- MySQL 8 yang berjalan, dengan user yang boleh membuat database (Prisma memakai _shadow database_ saat `migrate dev`)

## Setup dari nol

```bash
cd backend
npm install
cp .env.example .env     # lalu isi DATABASE_URL, JWT_SECRET, SEED_ADMIN_PASSWORD
npm run db:migrate       # membuat 12 tabel (kalau diminta nama migration: init)
npm run db:seed          # akun admin awal + pengaturan default
npm run dev              # http://localhost:3000/api/v1
```

Cek server: `GET http://localhost:3000/health` harus mengembalikan `{ "status": "ok" }`. Login pertama memakai `SEED_ADMIN_USERNAME` dan `SEED_ADMIN_PASSWORD` dari `.env`; ganti password itu sebelum dipakai sungguhan.

### MySQL lewat Docker (opsional)

Kalau belum punya MySQL, perintah ini menjalankannya sesuai nilai bawaan `.env.example` (hanya bisa diakses dari komputer ini):

```bash
docker run -d --name bengkel-mysql \
  -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=bengkel \
  -p 127.0.0.1:3306:3306 -v bengkel-mysql-data:/var/lib/mysql \
  mysql:8.4
```

Menghapusnya: `docker rm -f bengkel-mysql && docker volume rm bengkel-mysql-data`.

## Variabel lingkungan

Divalidasi saat start (`src/config/env.js`); server berhenti dengan pesan jelas kalau ada yang salah.

| Variabel                                      | Bawaan                  | Keterangan                                     |
| --------------------------------------------- | ----------------------- | ---------------------------------------------- |
| `NODE_ENV`                                    | `development`           | `development` mengaktifkan log request         |
| `PORT`                                        | `3000`                  | Ganti kalau port bentrok dengan aplikasi lain  |
| `DATABASE_URL`                                | –                       | `mysql://user:password@host:3306/bengkel`      |
| `JWT_SECRET`                                  | –                       | Minimal 32 karakter acak; jangan di-commit     |
| `JWT_EXPIRES_HOURS`                           | `12`                    | Masa berlaku login                             |
| `CORS_ORIGIN`                                 | `http://localhost:5173` | Origin frontend (cookie memakai `credentials`) |
| `COOKIE_SECURE`                               | `false`                 | Wajib `true` kalau dilayani lewat HTTPS        |
| `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` | `admin` / –             | Akun admin yang dibuat `db:seed`               |

## Perintah

| Perintah             | Fungsi                                                         |
| -------------------- | -------------------------------------------------------------- |
| `npm run dev`        | Server dengan auto-restart                                     |
| `npm start`          | Server tanpa auto-restart (produksi)                           |
| `npm run db:migrate` | Buat/terapkan migration di development                         |
| `npm run db:deploy`  | Terapkan migration yang sudah ada (produksi)                   |
| `npm run db:seed`    | Akun admin awal dan pengaturan default (aman dijalankan ulang) |
| `npm run db:studio`  | Prisma Studio untuk melihat isi database                       |
| `npm test`           | Unit test (Vitest)                                             |
| `npm run lint`       | ESLint                                                         |
| `npm run format`     | Prettier                                                       |

## Struktur dan arsitektur

Kode dikelompokkan per modul di `src/modules/<modul>/`, dengan lapisan:

```
routes → controller → service → Prisma (database)
          (HTTP)       (logic)
                ↘ calc (fungsi pure, tanpa database)
```

| File              | Tugas                                                                           |
| ----------------- | ------------------------------------------------------------------------------- |
| `*.routes.js`     | Daftar endpoint + middleware `authenticate`, `authorize`, `validate`            |
| `*.controller.js` | Membaca `req.valid`/`req.user`, memanggil service, membentuk response lewat DTO |
| `*.service.js`    | Logic bisnis dan `prisma.$transaction`                                          |
| `*.calc.js`       | Rumus dan aturan murni (diuji unit)                                             |
| `*.schema.js`     | Skema Zod untuk body/query/params                                               |
| `*.dto.js`        | Bentuk response per role (mis. harga beli hanya untuk admin)                    |

Modul: `auth`, `pengguna`, `pelanggan`, `barang`, `jasa`, `pembelian`, `transaksi`, `pengeluaran`, `laporan`, `dashboard`, `stok-log`, `log-aktivitas`, `pengaturan`. Modul tidak menulis query ke tabel modul lain; mereka memakai fungsi service yang diekspor modul pemilik tabel. Pengecualian: `laporan` dan `dashboard` adalah _read model_ yang menjalankan query agregat lintas tabel (hanya membaca).

Helper bersama: `lib/locks.js` (`SELECT … FOR UPDATE`, urutan lock selalu transaksi → barang), `stok-log` (`catatStok`), `log-aktivitas` (`catatAktivitas`).

## Hak akses

Dicek di backend pada setiap request (`authorize(...)`); aturan per baris (mekanik hanya transaksi miliknya) dicek di service.

| Aksi                                                              | admin | kasir |       mekanik       |
| ----------------------------------------------------------------- | :---: | :---: | :-----------------: |
| Login, dashboard                                                  |  ✅   |  ✅   | ✅ (hanya miliknya) |
| Buat transaksi, ubah jasa, **catat sparepart**, terima pembayaran |  ✅   |  ✅   |         ❌          |
| Kelola pelanggan, tandai "sudah dihubungi"                        |  ✅   |  ✅   |         ❌          |
| Lihat stok, lokasi rak, harga jual                                |  ✅   |  ✅   |         ✅          |
| Kelola barang/jasa, penyesuaian stok, restock                     |  ✅   |  ❌   |         ❌          |
| Lihat harga beli, margin, pengeluaran, laporan                    |  ✅   |  ❌   |         ❌          |
| Kelola akun, histori aktivitas, pengaturan                        |  ✅   |  ❌   |         ❌          |

Mekanik read-only: kebutuhan part disampaikan lisan ke Kasir, yang mencatatnya ke sistem.

## Konvensi API

- Base path `/api/v1`; field JSON `snake_case`; id berupa number.
- Sukses: `{ "data": … }`; list ditambah `"meta": { "page", "limit", "total" }` (`?page=1&limit=20`, `limit` maksimum 100).
- Error: `{ "error": { "code", "message", "details?" } }`. Status: `400` validasi, `401` belum login, `403` role tidak berhak, `404` tidak ditemukan, `409` aturan bisnis (lunas, stok kurang, username dipakai, …), `429` terlalu banyak percobaan login.
- Uang: number rupiah dengan 2 desimal (perhitungan di backend memakai Decimal). Pesan error untuk user berbahasa Indonesia.
- Waktu: database menyimpan UTC; `DATETIME` dikirim sebagai ISO 8601 UTC, `DATE` sebagai `YYYY-MM-DD`. "Hari ini", filter `dari`/`sampai`, kode transaksi, dan laporan dihitung dalam WIB (UTC+7).
- Login memasang cookie httpOnly `access_token`. Frontend dan backend harus satu _site_ (`sameSite: lax`).

## Endpoint

Rincian parameter dan contoh request ada di [`requests.http`](requests.http).

| Modul       | Endpoint                                                                                                                                                      | Role                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Auth        | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`                                                                                                       | publik / login                    |
| Pengguna    | `GET /pengguna/mekanik`                                                                                                                                       | admin, kasir                      |
|             | `GET`, `POST /pengguna`; `PATCH /pengguna/:id`, `PATCH /pengguna/:id/status`, `POST /pengguna/:id/reset-password`                                             | admin                             |
| Pelanggan   | `GET`, `POST /pelanggan`; `GET`, `PATCH /pelanggan/:id`; `GET /pelanggan/:id/transaksi`; `POST /pelanggan/:id/sudah-dihubungi`                                | admin, kasir                      |
| Barang      | `GET /barang/kategori`, `GET /barang`, `GET /barang/:id`                                                                                                      | semua (response berbeda per role) |
|             | `POST /barang`, `PATCH /barang/:id`, `PATCH /barang/:id/status`, `POST /barang/:id/penyesuaian-stok`, `GET /barang/:id/stok-log`, `GET /barang/:id/pembelian` | admin                             |
| Jasa        | `GET /jasa`                                                                                                                                                   | admin, kasir                      |
|             | `POST /jasa`, `PATCH /jasa/:id`, `PATCH /jasa/:id/status`                                                                                                     | admin                             |
| Pembelian   | `POST /pembelian`, `GET /pembelian` (tanpa edit/hapus)                                                                                                        | admin                             |
| Transaksi   | `GET /transaksi`, `GET /transaksi/:id`                                                                                                                        | semua (mekanik hanya miliknya)    |
|             | `POST /transaksi`, `PATCH /transaksi/:id`, `POST /transaksi/:id/jasa`, `DELETE /transaksi/:id/jasa/:detailId`                                                 | admin, kasir                      |
|             | `POST /transaksi/:id/barang`, `DELETE /transaksi/:id/barang/:detailId`, `POST /transaksi/:id/bayar`                                                           | admin, kasir                      |
| Pengeluaran | `GET`, `POST /pengeluaran`; `PATCH`, `DELETE /pengeluaran/:id`                                                                                                | admin                             |
| Laporan     | `GET /laporan/pemasukan`, `/uang-keluar`, `/laba-kasar`, `/barang-terlaris`, `/export` (xlsx/pdf)                                                             | admin                             |
| Dashboard   | `GET /dashboard` (isi berbeda per role)                                                                                                                       | semua                             |
| Histori     | `GET /log-aktivitas`                                                                                                                                          | admin                             |
| Pengaturan  | `GET`, `PATCH /pengaturan`                                                                                                                                    | admin                             |

## Aturan bisnis yang dijaga

- Stok tidak boleh minus (`409 STOK_TIDAK_CUKUP` dengan `sisa_stok`); tiap perubahan stok menulis satu baris `stok_log` di transaksi database yang sama.
- Transaksi lunas terkunci total (`409 TRANSAKSI_SUDAH_LUNAS`); transaksi tanpa jasa dan tanpa barang tidak bisa dilunasi.
- Harga jasa, harga jual, dan harga beli disalin sebagai snapshot saat baris detail dibuat; total selalu dihitung ulang dari baris detail.
- Barang baru berstok 0; stok awal dan harga beli hanya masuk lewat restock, dengan harga beli rata-rata tertimbang. Pembelian tidak bisa diubah, koreksi lewat penyesuaian stok.
- Pengguna, barang, dan jasa tidak dihapus, hanya dinonaktifkan. Admin tidak bisa menonaktifkan atau menurunkan dirinya sendiri, dan minimal satu admin aktif harus tersisa.
- Aksi penting menulis `log_aktivitas`. Reminder (stok menipis, belum ada transaksi di jam tutup, servis berkala) dihitung saat dashboard diminta, tidak disimpan.

## Pengujian

- `npm test`: unit test untuk fungsi pure (rumus harga, total, kode transaksi, hak akses, zona waktu WIB, reminder, model laporan). Tidak menyentuh database.
- Endpoint dicek manual lewat [`requests.http`](requests.http) (ekstensi REST Client di VS Code): jalankan dari atas ke bawah, request bernama saling memakai hasil sebelumnya.

## Troubleshooting

| Gejala                                                                             | Penyebab dan solusi                                                                                        |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `EADDRINUSE: address already in use :::3000`                                       | Port dipakai aplikasi lain. Ubah `PORT` di `.env` (dan `@host` di `requests.http`)                         |
| `PrismaClientKnownRequestError` bernilai `undefined` atau "did not initialize yet" | Prisma Client belum di-generate: jalankan `npx prisma generate` (`db:migrate` juga melakukannya)           |
| `Environment variable not found: DATABASE_URL`                                     | `.env` belum ada atau belum diisi                                                                          |
| `429 TERLALU_BANYAK_PERCOBAAN`                                                     | Batas 10 percobaan login gagal per 15 menit per IP. Tunggu, atau restart server (penghitung ada di memori) |
| Frontend tidak menerima cookie                                                     | `CORS_ORIGIN` harus persis sama dengan origin frontend, dan keduanya satu _site_                           |
| npm memperingatkan "allow-scripts" untuk Prisma                                    | Peringatan npm 11. Kalau client tidak terbentuk, jalankan `npx prisma generate`                            |

Produksi: set `NODE_ENV=production`, `COOKIE_SECURE=true` (HTTPS), `JWT_SECRET` acak yang kuat, ganti password admin seed, terapkan schema dengan `npm run db:deploy`, lalu `npm start`.
