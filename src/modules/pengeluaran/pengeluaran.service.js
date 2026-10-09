import { AKSI } from '../../constants/aksi-log.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { hitungOffset } from '../../utils/pagination.js';
import { D, bulat2 } from '../../utils/uang.js';
import { dariKolomDate, filterTanggalKolom, keKolomDate } from '../../utils/waktu.js';
import { catatAktivitas } from '../log-aktivitas/log-aktivitas.service.js';

const SERTAKAN = { dibuat_oleh: { select: { id: true, nama: true } } };

export async function listPengeluaran({ kategori, dari, sampai, page, limit }) {
  const where = {
    ...(kategori && { kategori }),
    ...((dari || sampai) && { tanggal: filterTanggalKolom(dari, sampai) }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.pengeluaran.findMany({
      where,
      orderBy: [{ tanggal: 'desc' }, { id: 'desc' }],
      ...hitungOffset({ page, limit }),
      include: SERTAKAN,
    }),
    prisma.pengeluaran.count({ where }),
  ]);
  return { items, total };
}

export function buatPengeluaran(input, actor) {
  return prisma.$transaction(async (tx) => {
    const pengeluaran = await tx.pengeluaran.create({
      data: {
        kategori: input.kategori,
        jumlah: bulat2(input.jumlah).toFixed(2),
        tanggal: keKolomDate(input.tanggal),
        keterangan: input.keterangan ?? null,
        dibuat_oleh_id: actor.id,
      },
      include: SERTAKAN,
    });
    await catatAktivitas(tx, {
      penggunaId: actor.id,
      aksi: AKSI.CATAT_PENGELUARAN,
      entitas: 'pengeluaran',
      entitasId: pengeluaran.id,
      keterangan: `${pengeluaran.kategori} ${D(pengeluaran.jumlah)} tgl ${input.tanggal}`,
    });
    return pengeluaran;
  });
}

export function ubahPengeluaran(id, input, actor) {
  return prisma.$transaction(async (tx) => {
    const lama = await tx.pengeluaran.findUnique({ where: { id }, include: SERTAKAN });
    if (!lama) throw AppError.tidakDitemukan('Pengeluaran');

    const perubahan = [];
    if (input.kategori !== undefined && input.kategori !== lama.kategori) {
      perubahan.push(`kategori ${lama.kategori} → ${input.kategori}`);
    }
    if (input.jumlah !== undefined && !D(input.jumlah).equals(D(lama.jumlah))) {
      perubahan.push(`jumlah ${D(lama.jumlah)} → ${bulat2(input.jumlah)}`);
    }
    if (input.tanggal !== undefined && input.tanggal !== dariKolomDate(lama.tanggal)) {
      perubahan.push(`tanggal ${dariKolomDate(lama.tanggal)} → ${input.tanggal}`);
    }
    if (input.keterangan !== undefined && input.keterangan !== lama.keterangan) {
      perubahan.push('keterangan');
    }
    if (perubahan.length === 0) return lama;

    const pengeluaran = await tx.pengeluaran.update({
      where: { id },
      data: {
        kategori: input.kategori,
        jumlah: input.jumlah === undefined ? undefined : bulat2(input.jumlah).toFixed(2),
        tanggal: input.tanggal === undefined ? undefined : keKolomDate(input.tanggal),
        keterangan: input.keterangan,
      },
      include: SERTAKAN,
    });
    await catatAktivitas(tx, {
      penggunaId: actor.id,
      aksi: AKSI.UBAH_PENGELUARAN,
      entitas: 'pengeluaran',
      entitasId: id,
      keterangan: perubahan.join('; '),
    });
    return pengeluaran;
  });
}

export function hapusPengeluaran(id, actor) {
  return prisma.$transaction(async (tx) => {
    const lama = await tx.pengeluaran.findUnique({ where: { id } });
    if (!lama) throw AppError.tidakDitemukan('Pengeluaran');

    await tx.pengeluaran.delete({ where: { id } });
    // Barisnya hilang, jadi jumlah & tanggal disimpan di log supaya masih bisa ditelusuri
    await catatAktivitas(tx, {
      penggunaId: actor.id,
      aksi: AKSI.HAPUS_PENGELUARAN,
      entitas: 'pengeluaran',
      entitasId: id,
      keterangan: `${lama.kategori} ${D(lama.jumlah)} tgl ${dariKolomDate(lama.tanggal)}`,
    });
  });
}

/** Total pengeluaran per kategori dalam rentang tanggal inklusif (bahan laporan uang keluar). */
export async function totalPengeluaranPerKategori({ dari, sampai }) {
  const baris = await prisma.pengeluaran.groupBy({
    by: ['kategori'],
    where: { tanggal: filterTanggalKolom(dari, sampai) },
    _sum: { jumlah: true },
  });
  return baris.map((b) => ({ kategori: b.kategori, total: b._sum.jumlah }));
}
