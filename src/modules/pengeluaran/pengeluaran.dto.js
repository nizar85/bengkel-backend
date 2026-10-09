import { dariKolomDate } from '../../utils/waktu.js';
import { uang } from '../../utils/uang.js';

export const toPengeluaranDTO = (p) => ({
  id: p.id,
  kategori: p.kategori,
  keterangan: p.keterangan,
  jumlah: uang(p.jumlah),
  tanggal: dariKolomDate(p.tanggal),
  dibuat_oleh: { id: p.dibuat_oleh.id, nama: p.dibuat_oleh.nama },
  created_at: p.created_at,
  updated_at: p.updated_at,
});
