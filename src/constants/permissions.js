import { ROLE } from './roles.js';

const { ADMIN, KASIR, MEKANIK } = ROLE;
const SEMUA = [ADMIN, KASIR, MEKANIK];

// Terjemahan matriks hak akses PRD v2. Admin ada di setiap daftar karena Admin bisa semua aksi.
export const IZIN = {
  'dashboard:lihat': SEMUA,
  'pengguna:kelola': [ADMIN],
  'pengguna:lihat-mekanik': [ADMIN, KASIR],
  'pelanggan:kelola': [ADMIN, KASIR],
  'barang:lihat': SEMUA,
  'barang:kelola': [ADMIN],
  'jasa:lihat': [ADMIN, KASIR],
  'jasa:kelola': [ADMIN],
  'pembelian:kelola': [ADMIN],
  'transaksi:lihat': SEMUA, // mekanik dibatasi ke transaksi miliknya di service
  'transaksi:kelola': [ADMIN, KASIR], // buat transaksi, ubah header, tambah/hapus jasa
  'transaksi:sparepart': [ADMIN, KASIR], // Mekanik sengaja tidak ada: ia hanya menyampaikan kebutuhan part ke Kasir
  'transaksi:bayar': [ADMIN, KASIR],
  'pengeluaran:kelola': [ADMIN],
  'laporan:lihat': [ADMIN],
  'log-aktivitas:lihat': [ADMIN],
  'pengaturan:kelola': [ADMIN],
};

export const boleh = (role, izin) => IZIN[izin]?.includes(role) ?? false;
