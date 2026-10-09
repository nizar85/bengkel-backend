export const KATEGORI_BARANG = [
  { value: 'mesin', label: 'Mesin' },
  { value: 'kelistrikan', label: 'Kelistrikan' },
  { value: 'pengereman', label: 'Pengereman' },
  { value: 'transmisi_penggerak', label: 'Transmisi & Penggerak' },
  { value: 'ban_roda', label: 'Ban & Roda' },
  { value: 'suspensi', label: 'Suspensi' },
  { value: 'body_aksesoris', label: 'Body & Aksesoris' },
  { value: 'cairan_consumables', label: 'Cairan & Consumables' },
];

export const NILAI_KATEGORI_BARANG = KATEGORI_BARANG.map((k) => k.value);
export const TIPE_BARANG = ['original', 'kw1', 'kw2', 'lainnya'];
export const METODE_BAYAR = ['tunai', 'transfer', 'qris'];
export const KATEGORI_PENGELUARAN = ['listrik_air', 'sewa', 'gaji', 'peralatan', 'lainnya'];

export const LABEL_KATEGORI_PENGELUARAN = {
  listrik_air: 'Listrik & Air',
  sewa: 'Sewa',
  gaji: 'Gaji',
  peralatan: 'Peralatan',
  lainnya: 'Lainnya',
};
