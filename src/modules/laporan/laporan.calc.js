import { D } from '../../utils/uang.js';
import { tambahHari } from '../../utils/waktu.js';

const HARI_DEFAULT = 7;

/**
 * Rentang laporan 'dari' s.d. 'sampai' (inklusif, WIB). Kalau keduanya kosong: 7 hari terakhir
 * sampai hari ini. Kalau hanya satu yang diisi, sisi lainnya dihitung dari yang diberikan.
 */
export function tentukanRentangLaporan({ dari, sampai }, hariIni) {
  const akhir = sampai ?? hariIni;
  const awal = dari ?? tambahHari(akhir, -(HARI_DEFAULT - 1));
  return { dari: awal, sampai: akhir };
}

/** Laba kasar = pendapatan − harga beli barang terjual (FIN-6). Pengeluaran tidak dikurangkan. */
export const hitungLabaKasar = (pendapatan, hpp) => D(pendapatan).minus(D(hpp));

/** Uang keluar = pembelian barang (restock) + pengeluaran operasional (FIN-5). */
export const hitungTotalUangKeluar = (totalPembelian, totalPengeluaran) =>
  D(totalPembelian).plus(D(totalPengeluaran));
