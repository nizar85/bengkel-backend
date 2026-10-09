import { prisma } from '../../lib/prisma.js';
import { hitungOffset } from '../../utils/pagination.js';
import { potong } from '../../utils/teks.js';
import { filterWaktuWIB } from '../../utils/waktu.js';

/** Tulis satu baris stok_log. Wajib dipanggil di dalam prisma.$transaction yang sama dengan perubahan stok. */
export function catatStok(
  tx,
  {
    barangId,
    tipe,
    qtyPerubahan,
    stokSesudah,
    penggunaId,
    transaksiServisId,
    pembelianId,
    keterangan,
  },
) {
  return tx.stokLog.create({
    data: {
      barang_id: barangId,
      tipe,
      qty_perubahan: qtyPerubahan,
      stok_sesudah: stokSesudah,
      pengguna_id: penggunaId,
      transaksi_servis_id: transaksiServisId ?? null,
      pembelian_id: pembelianId ?? null,
      keterangan: potong(keterangan),
    },
  });
}

export async function listStokLogBarang(barangId, { dari, sampai, page, limit }) {
  const where = {
    barang_id: barangId,
    ...((dari || sampai) && { created_at: filterWaktuWIB(dari, sampai) }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.stokLog.findMany({
      where,
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      ...hitungOffset({ page, limit }),
      include: { pengguna: { select: { id: true, nama: true } } },
    }),
    prisma.stokLog.count({ where }),
  ]);
  return { items, total };
}
