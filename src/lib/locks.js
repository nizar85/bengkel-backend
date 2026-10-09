import { D } from '../utils/uang.js';
import { AppError } from '../utils/app-error.js';

// Prisma tidak punya API "SELECT ... FOR UPDATE", jadi pakai raw query.
// Nilai WAJIB dibaca dari query yang mengunci ini. Jangan dibaca ulang lewat findUnique:
// snapshot REPEATABLE READ MySQL bisa mengembalikan nilai lama dari sebelum lock didapat.
export async function kunciTransaksi(tx, id) {
  const [row] = await tx.$queryRaw`
    SELECT id, kode, mekanik_id, status_bayar
    FROM transaksi_servis WHERE id = ${id} FOR UPDATE`;
  if (!row) throw AppError.tidakDitemukan('Transaksi');
  return {
    id: BigInt(row.id),
    kode: row.kode,
    mekanik_id: BigInt(row.mekanik_id),
    status_bayar: row.status_bayar,
  };
}

export async function kunciBarang(tx, id) {
  const [row] = await tx.$queryRaw`
    SELECT id, nama, stok, harga_jual, harga_beli_rata_rata, aktif
    FROM barang WHERE id = ${id} FOR UPDATE`;
  if (!row) throw AppError.tidakDitemukan('Barang');
  return {
    id: BigInt(row.id),
    nama: row.nama,
    stok: Number(row.stok),
    harga_jual: D(row.harga_jual),
    harga_beli_rata_rata: D(row.harga_beli_rata_rata),
    aktif: Boolean(row.aktif), // TINYINT(1) dari raw query bisa berupa 0/1
  };
}

// Urutan lock selalu: transaksi → barang. Semua alur yang mengunci keduanya harus mengikuti urutan
// ini supaya dua request bersamaan tidak deadlock.
