import { AKSI } from '../../constants/aksi-log.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { hitungOffset } from '../../utils/pagination.js';
import { catatAktivitas } from '../log-aktivitas/log-aktivitas.service.js';

const BIDANG_UBAH = ['nama', 'no_hp', 'no_polisi', 'tipe_motor'];

export async function listPelanggan({ q, page, limit }) {
  const where = q
    ? {
        OR: [{ nama: { contains: q } }, { no_hp: { contains: q } }, { no_polisi: { contains: q } }],
      }
    : {};
  const [items, total] = await prisma.$transaction([
    prisma.pelanggan.findMany({
      where,
      orderBy: [{ nama: 'asc' }, { id: 'asc' }],
      ...hitungOffset({ page, limit }),
    }),
    prisma.pelanggan.count({ where }),
  ]);
  return { items, total };
}

export async function ambilPelanggan(id) {
  const pelanggan = await prisma.pelanggan.findUnique({ where: { id } });
  if (!pelanggan) throw AppError.tidakDitemukan('Pelanggan');
  return pelanggan;
}

/** Dipakai modul transaksi untuk memastikan pelanggan ada sebelum transaksi dibuat. */
export async function pastikanPelangganAda(tx, id) {
  const ada = await tx.pelanggan.findUnique({ where: { id }, select: { id: true } });
  if (!ada) throw AppError.tidakDitemukan('Pelanggan');
}

export function buatPelanggan(input, actor) {
  return prisma.$transaction(async (tx) => {
    const pelanggan = await tx.pelanggan.create({
      data: {
        nama: input.nama,
        no_hp: input.no_hp,
        no_polisi: input.no_polisi ?? null,
        tipe_motor: input.tipe_motor ?? null,
      },
    });
    await catatAktivitas(tx, {
      penggunaId: actor.id,
      aksi: AKSI.BUAT_PELANGGAN,
      entitas: 'pelanggan',
      entitasId: pelanggan.id,
      keterangan: pelanggan.nama,
    });
    return pelanggan;
  });
}

export function ubahPelanggan(id, input, actor) {
  return prisma.$transaction(async (tx) => {
    const lama = await tx.pelanggan.findUnique({ where: { id } });
    if (!lama) throw AppError.tidakDitemukan('Pelanggan');

    const berubah = BIDANG_UBAH.filter((f) => input[f] !== undefined && input[f] !== lama[f]);
    if (berubah.length === 0) return lama;

    const pelanggan = await tx.pelanggan.update({
      where: { id },
      data: {
        nama: input.nama,
        no_hp: input.no_hp,
        no_polisi: input.no_polisi,
        tipe_motor: input.tipe_motor,
      },
    });
    await catatAktivitas(tx, {
      penggunaId: actor.id,
      aksi: AKSI.UBAH_PELANGGAN,
      entitas: 'pelanggan',
      entitasId: id,
      keterangan: `${lama.nama} (${berubah.join(', ')})`,
    });
    return pelanggan;
  });
}

/** Kasir menekan "sudah dihubungi" di reminder servis berkala (RMD-3). */
export function tandaiSudahDihubungi(id, actor) {
  return prisma.$transaction(async (tx) => {
    const lama = await tx.pelanggan.findUnique({ where: { id }, select: { nama: true } });
    if (!lama) throw AppError.tidakDitemukan('Pelanggan');

    const pelanggan = await tx.pelanggan.update({
      where: { id },
      data: { terakhir_dihubungi_at: new Date() },
    });
    await catatAktivitas(tx, {
      penggunaId: actor.id,
      aksi: AKSI.TANDAI_DIHUBUNGI,
      entitas: 'pelanggan',
      entitasId: id,
      keterangan: lama.nama,
    });
    return pelanggan;
  });
}
