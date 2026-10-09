import { ROLE } from '../../constants/roles.js';
import { dariKolomDate } from '../../utils/waktu.js';
import { uang } from '../../utils/uang.js';
import { toBarangDTO } from '../barang/barang.dto.js';

export const toPembelianDTO = (p) => ({
  id: p.id,
  barang: { id: p.barang.id, nama: p.barang.nama },
  jumlah: p.jumlah,
  total_harga: uang(p.total_harga),
  harga_per_pcs: uang(p.harga_per_pcs),
  tanggal: dariKolomDate(p.tanggal),
  keterangan: p.keterangan,
  dibuat_oleh: { id: p.dibuat_oleh.id, nama: p.dibuat_oleh.nama },
  created_at: p.created_at,
});

/** Respons restock: catatan pembelian plus kondisi terbaru barang (stok & harga beli rata-rata). */
export const toRestockDTO = ({ pembelian, barang }) => ({
  pembelian: toPembelianDTO(pembelian),
  barang: toBarangDTO(barang, ROLE.ADMIN),
});
