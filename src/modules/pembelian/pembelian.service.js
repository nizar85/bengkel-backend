import { AKSI } from '../../constants/aksi-log.js';
import { kunciBarang } from '../../lib/locks.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { hitungOffset } from '../../utils/pagination.js';
import { bulat2 } from '../../utils/uang.js';
import { filterTanggalKolom, keKolomDate, tanggalWIB } from '../../utils/waktu.js';
import { hitungHargaPerPcs, hitungRataRataTertimbang } from '../barang/barang.calc.js';
import { tulisStokBarang } from '../barang/barang.service.js';
import { catatAktivitas } from '../log-aktivitas/log-aktivitas.service.js';
import { catatStok } from '../stok-log/stok-log.service.js';

const SERTAKAN = {
  barang: { select: { id: true, nama: true } },
  dibuat_oleh: { select: { id: true, nama: true } },
};

/**
 * Restock (STK-2). Harga beli rata-rata dihitung ulang di sini, di dalam transaksi yang mengunci
 * baris barang, supaya dua restock bersamaan tidak saling menimpa stok atau harga rata-rata.
 */
export function restock(input, actor) {
  return prisma.$transaction(async (tx) => {
    const barang = await kunciBarang(tx, input.barang_id);
    if (!barang.aktif) {
      throw AppError.konflik('DATA_NONAKTIF', 'Barang nonaktif tidak bisa direstock');
    }

    const hargaPerPcs = hitungHargaPerPcs(input.total_harga, input.jumlah);
    const hargaRataRataBaru = hitungRataRataTertimbang({
      stokLama: barang.stok,
      hargaLama: barang.harga_beli_rata_rata,
      jumlahBaru: input.jumlah,
      totalHargaBaru: input.total_harga,
    });
    const stokSesudah = barang.stok + input.jumlah;

    const pembelian = await tx.pembelian.create({
      data: {
        barang_id: barang.id,
        jumlah: input.jumlah,
        total_harga: bulat2(input.total_harga).toFixed(2),
        harga_per_pcs: hargaPerPcs.toFixed(2),
        tanggal: keKolomDate(input.tanggal ?? tanggalWIB()),
        keterangan: input.keterangan ?? null,
        dibuat_oleh_id: actor.id,
      },
      include: SERTAKAN,
    });
    const barangBaru = await tulisStokBarang(tx, barang.id, {
      stok: stokSesudah,
      hargaBeliRataRata: hargaRataRataBaru,
    });
    await catatStok(tx, {
      barangId: barang.id,
      tipe: 'masuk',
      qtyPerubahan: input.jumlah,
      stokSesudah,
      pembelianId: pembelian.id,
      penggunaId: actor.id,
      keterangan: 'Restock',
    });
    await catatAktivitas(tx, {
      penggunaId: actor.id,
      aksi: AKSI.RESTOCK,
      entitas: 'pembelian',
      entitasId: pembelian.id,
      keterangan: `${barang.nama} +${input.jumlah}`,
    });
    return { pembelian, barang: barangBaru };
  });
}

export async function listPembelian({ barang_id, dari, sampai, page, limit }) {
  const where = {
    ...(barang_id && { barang_id }),
    ...((dari || sampai) && { tanggal: filterTanggalKolom(dari, sampai) }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.pembelian.findMany({
      where,
      orderBy: [{ tanggal: 'desc' }, { id: 'desc' }],
      ...hitungOffset({ page, limit }),
      include: SERTAKAN,
    }),
    prisma.pembelian.count({ where }),
  ]);
  return { items, total };
}

/** Jumlah dan total pembelian dalam rentang tanggal inklusif (bahan laporan uang keluar). */
export async function totalPembelian({ dari, sampai }) {
  const hasil = await prisma.pembelian.aggregate({
    where: { tanggal: filterTanggalKolom(dari, sampai) },
    _sum: { total_harga: true },
    _count: { _all: true },
  });
  return { jumlah: hasil._count._all, total: hasil._sum.total_harga ?? 0 };
}
