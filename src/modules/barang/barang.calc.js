import Decimal from 'decimal.js';
import { D } from '../../utils/uang.js';

/** Harga per pcs dari pembelian bulk, 2 desimal half-up. */
export function hitungHargaPerPcs(totalHarga, jumlah) {
  if (!Number.isInteger(jumlah) || jumlah <= 0) {
    throw new RangeError('jumlah harus bilangan bulat > 0');
  }
  return D(totalHarga).div(jumlah).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/**
 * Harga beli rata-rata tertimbang setelah restock (PRD Fitur 1).
 * (stokLama × hargaLama + totalHargaBaru) / (stokLama + jumlahBaru)
 * Saat stokLama = 0 rumus ini otomatis sama dengan harga per pcs batch baru.
 */
export function hitungRataRataTertimbang({ stokLama, hargaLama, jumlahBaru, totalHargaBaru }) {
  if (!Number.isInteger(jumlahBaru) || jumlahBaru <= 0) {
    throw new RangeError('jumlahBaru harus bilangan bulat > 0');
  }
  const nilaiStokLama = D(hargaLama).mul(stokLama);
  return nilaiStokLama
    .plus(D(totalHargaBaru))
    .div(stokLama + jumlahBaru)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}
