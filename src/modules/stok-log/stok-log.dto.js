export const toStokLogDTO = (log) => ({
  id: log.id,
  tipe: log.tipe,
  qty_perubahan: log.qty_perubahan,
  stok_sesudah: log.stok_sesudah,
  transaksi_servis_id: log.transaksi_servis_id,
  pembelian_id: log.pembelian_id,
  keterangan: log.keterangan,
  pengguna: { id: log.pengguna.id, nama: log.pengguna.nama },
  created_at: log.created_at,
});
