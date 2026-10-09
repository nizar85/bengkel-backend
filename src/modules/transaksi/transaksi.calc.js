import { D } from '../../utils/uang.js';

export const hitungSubtotalJasa = (items) => items.reduce((sum, i) => sum.plus(D(i.harga)), D(0));

export const hitungSubtotalBarang = (items) =>
  items.reduce((sum, i) => sum.plus(D(i.harga_jual).mul(i.qty)), D(0));

/** 'YYYY-MM-DD' (WIB) + urutan harian → 'TRX-YYYYMMDD-NNN' */
export const buatKodeTransaksi = (tanggal, urutan) =>
  `TRX-${tanggal.replaceAll('-', '')}-${String(urutan).padStart(3, '0')}`;

export const bisaDilunasi = ({ jumlahJasa, jumlahBarang }) => jumlahJasa + jumlahBarang > 0;
