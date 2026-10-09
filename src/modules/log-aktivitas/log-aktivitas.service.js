import { prisma } from '../../lib/prisma.js';
import { hitungOffset } from '../../utils/pagination.js';
import { potong } from '../../utils/teks.js';
import { filterWaktuWIB } from '../../utils/waktu.js';

/** Tulis satu baris log_aktivitas. Terima `tx` supaya log ikut rollback kalau aksi utamanya gagal. */
export function catatAktivitas(tx, { penggunaId, aksi, entitas, entitasId, keterangan }) {
  return tx.logAktivitas.create({
    data: {
      pengguna_id: penggunaId,
      aksi,
      entitas,
      entitas_id: entitasId ?? null,
      keterangan: potong(keterangan),
    },
  });
}

export async function listLogAktivitas({ pengguna_id, aksi, dari, sampai, page, limit }) {
  const where = {
    ...(pengguna_id && { pengguna_id }),
    ...(aksi && { aksi }),
    ...((dari || sampai) && { created_at: filterWaktuWIB(dari, sampai) }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.logAktivitas.findMany({
      where,
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      ...hitungOffset({ page, limit }),
      include: { pengguna: { select: { id: true, nama: true } } },
    }),
    prisma.logAktivitas.count({ where }),
  ]);
  return { items, total };
}
