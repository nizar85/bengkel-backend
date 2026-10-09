import { AKSI } from '../../constants/aksi-log.js';
import { prisma } from '../../lib/prisma.js';
import { catatAktivitas } from '../log-aktivitas/log-aktivitas.service.js';

// Sama dengan nilai seed; dipakai kalau barisnya belum ada supaya dashboard tidak error
const DEFAULT = { jam_tutup: '17:00', interval_servis_hari: '60' };

/** { jam_tutup: 'HH:mm', interval_servis_hari: number } */
export async function ambilPengaturan(db = prisma) {
  const baris = await db.pengaturan.findMany();
  const nilai = { ...DEFAULT, ...Object.fromEntries(baris.map((b) => [b.kunci, b.nilai])) };
  return { jam_tutup: nilai.jam_tutup, interval_servis_hari: Number(nilai.interval_servis_hari) };
}

export function ubahPengaturan(input, actor) {
  return prisma.$transaction(async (tx) => {
    const lama = await ambilPengaturan(tx);
    const perubahan = Object.entries(input).filter(
      ([kunci, nilai]) => nilai !== undefined && nilai !== lama[kunci],
    );
    for (const [kunci, nilai] of perubahan) {
      await tx.pengaturan.upsert({
        where: { kunci },
        update: { nilai: String(nilai) },
        create: { kunci, nilai: String(nilai) },
      });
    }
    if (perubahan.length > 0) {
      await catatAktivitas(tx, {
        penggunaId: actor.id,
        aksi: AKSI.UBAH_PENGATURAN,
        entitas: 'pengaturan',
        keterangan: perubahan
          .map(([kunci, nilai]) => `${kunci}: ${lama[kunci]} → ${nilai}`)
          .join('; '),
      });
    }
    return ambilPengaturan(tx);
  });
}
