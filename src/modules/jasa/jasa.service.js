import { AKSI } from '../../constants/aksi-log.js';
import { ROLE } from '../../constants/roles.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { D, bulat2 } from '../../utils/uang.js';
import { catatAktivitas } from '../log-aktivitas/log-aktivitas.service.js';

export function listJasa({ q, aktif }, role) {
  return prisma.jasa.findMany({
    where: {
      // Kasir hanya memilih jasa yang masih ditawarkan
      ...(role !== ROLE.ADMIN ? { aktif: true } : aktif !== undefined && { aktif }),
      ...(q && { nama: { contains: q } }),
    },
    orderBy: [{ nama: 'asc' }, { id: 'asc' }],
  });
}

/**
 * Dipakai modul transaksi: jasa harus ada dan aktif. Urutan hasil mengikuti urutan `ids`.
 * Pemanggil bertanggung jawab membuang id kembar.
 */
export async function ambilJasaAktif(tx, ids) {
  if (ids.length === 0) return [];
  const rows = await tx.jasa.findMany({ where: { id: { in: ids } } });
  const perId = new Map(rows.map((j) => [j.id, j]));
  return ids.map((id) => {
    const jasa = perId.get(id);
    if (!jasa) throw AppError.tidakDitemukan('Jasa');
    if (!jasa.aktif) throw AppError.konflik('DATA_NONAKTIF', `Jasa "${jasa.nama}" sudah nonaktif`);
    return jasa;
  });
}

export function buatJasa(input, actor) {
  return prisma.$transaction(async (tx) => {
    const jasa = await tx.jasa.create({
      data: { nama: input.nama, harga: bulat2(input.harga).toFixed(2) },
    });
    await catatAktivitas(tx, {
      penggunaId: actor.id,
      aksi: AKSI.BUAT_JASA,
      entitas: 'jasa',
      entitasId: jasa.id,
      keterangan: `${jasa.nama} (${D(jasa.harga)})`,
    });
    return jasa;
  });
}

export function ubahJasa(id, input, actor) {
  return prisma.$transaction(async (tx) => {
    const lama = await ambilJasa(tx, id);
    const namaBerubah = input.nama !== undefined && input.nama !== lama.nama;
    const hargaBerubah = input.harga !== undefined && !D(input.harga).equals(D(lama.harga));
    if (!namaBerubah && !hargaBerubah) return lama;

    const jasa = await tx.jasa.update({
      where: { id },
      data: {
        ...(namaBerubah && { nama: input.nama }),
        ...(hargaBerubah && { harga: bulat2(input.harga).toFixed(2) }),
      },
    });
    if (hargaBerubah) {
      await catatAktivitas(tx, {
        penggunaId: actor.id,
        aksi: AKSI.UBAH_HARGA,
        entitas: 'jasa',
        entitasId: id,
        keterangan: `${lama.nama}: ${D(lama.harga)} → ${D(jasa.harga)}`,
      });
    }
    if (namaBerubah) {
      await catatAktivitas(tx, {
        penggunaId: actor.id,
        aksi: AKSI.UBAH_JASA,
        entitas: 'jasa',
        entitasId: id,
        keterangan: `${lama.nama} → ${jasa.nama}`,
      });
    }
    return jasa;
  });
}

export function ubahStatusJasa(id, aktif, actor) {
  return prisma.$transaction(async (tx) => {
    const lama = await ambilJasa(tx, id);
    if (lama.aktif === aktif) return lama;

    const jasa = await tx.jasa.update({ where: { id }, data: { aktif } });
    await catatAktivitas(tx, {
      penggunaId: actor.id,
      aksi: AKSI.UBAH_JASA,
      entitas: 'jasa',
      entitasId: id,
      keterangan: `${lama.nama}: ${aktif ? 'diaktifkan' : 'dinonaktifkan'}`,
    });
    return jasa;
  });
}

async function ambilJasa(tx, id) {
  const jasa = await tx.jasa.findUnique({ where: { id } });
  if (!jasa) throw AppError.tidakDitemukan('Jasa');
  return jasa;
}
