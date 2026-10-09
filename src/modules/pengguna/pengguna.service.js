import { AKSI } from '../../constants/aksi-log.js';
import { ROLE } from '../../constants/roles.js';
import { hashPassword } from '../../lib/password.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { hitungOffset } from '../../utils/pagination.js';
import { catatAktivitas } from '../log-aktivitas/log-aktivitas.service.js';

// password_hash sengaja tidak ada di sini: hanya cariPenggunaUntukLogin yang boleh membacanya
const PILIH_PUBLIK = {
  id: true,
  nama: true,
  username: true,
  role: true,
  no_hp: true,
  aktif: true,
  created_at: true,
  updated_at: true,
};

const PERAN_MEKANIK = [ROLE.MEKANIK, ROLE.ADMIN];

export function cariPenggunaUntukLogin(username) {
  return prisma.pengguna.findUnique({ where: { username } });
}

export async function ambilProfilPengguna(id) {
  const pengguna = await prisma.pengguna.findUnique({ where: { id }, select: PILIH_PUBLIK });
  if (!pengguna) throw AppError.tidakDitemukan('Pengguna');
  return pengguna;
}

/** Mekanik transaksi harus aktif dan ber-role mekanik, atau admin (pemilik yang turun tangan). */
export async function pastikanMekanikValid(tx, id) {
  const pengguna = await tx.pengguna.findUnique({
    where: { id },
    select: { role: true, aktif: true },
  });
  if (!pengguna?.aktif || !PERAN_MEKANIK.includes(pengguna.role)) {
    throw AppError.konflik('MEKANIK_TIDAK_VALID', 'Mekanik tidak valid');
  }
}

export function daftarMekanik() {
  return prisma.pengguna.findMany({
    where: { aktif: true, role: { in: PERAN_MEKANIK } },
    select: { id: true, nama: true, role: true },
    orderBy: { nama: 'asc' },
  });
}

export async function listPengguna({ q, role, aktif, page, limit }) {
  const where = {
    ...(q && { OR: [{ nama: { contains: q } }, { username: { contains: q } }] }),
    ...(role && { role }),
    ...(aktif !== undefined && { aktif }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.pengguna.findMany({
      where,
      select: PILIH_PUBLIK,
      orderBy: [{ nama: 'asc' }, { id: 'asc' }],
      ...hitungOffset({ page, limit }),
    }),
    prisma.pengguna.count({ where }),
  ]);
  return { items, total };
}

export async function buatPengguna(input, actor) {
  const password_hash = await hashPassword(input.password);
  try {
    return await prisma.$transaction(async (tx) => {
      const pengguna = await tx.pengguna.create({
        data: {
          nama: input.nama,
          username: input.username,
          password_hash,
          role: input.role,
          no_hp: input.no_hp ?? null,
        },
        select: PILIH_PUBLIK,
      });
      await catatAktivitas(tx, {
        penggunaId: actor.id,
        aksi: AKSI.BUAT_PENGGUNA,
        entitas: 'pengguna',
        entitasId: pengguna.id,
        keterangan: `${pengguna.username} (${pengguna.role})`,
      });
      return pengguna;
    });
  } catch (err) {
    if (err?.code === 'P2002') throw AppError.konflik('DATA_DUPLIKAT', 'Username sudah dipakai');
    throw err;
  }
}

export function ubahPengguna(id, input, actor) {
  return prisma.$transaction(async (tx) => {
    const target = await ambilTarget(tx, id);
    const roleBerubah = input.role !== undefined && input.role !== target.role;
    const profilBerubah =
      (input.nama !== undefined && input.nama !== target.nama) ||
      (input.no_hp !== undefined && input.no_hp !== target.no_hp);
    if (!roleBerubah && !profilBerubah) return target;

    if (roleBerubah && target.role === ROLE.ADMIN && target.aktif) {
      await pastikanAdminTersisa(tx, target.id, actor.id);
    }

    const pengguna = await tx.pengguna.update({
      where: { id },
      data: { nama: input.nama, role: input.role, no_hp: input.no_hp },
      select: PILIH_PUBLIK,
    });
    if (roleBerubah) {
      await catatAktivitas(tx, {
        penggunaId: actor.id,
        aksi: AKSI.UBAH_ROLE,
        entitas: 'pengguna',
        entitasId: id,
        keterangan: `${target.username}: ${target.role} → ${pengguna.role}`,
      });
    }
    if (profilBerubah) {
      await catatAktivitas(tx, {
        penggunaId: actor.id,
        aksi: AKSI.UBAH_PENGGUNA,
        entitas: 'pengguna',
        entitasId: id,
        keterangan: target.username,
      });
    }
    return pengguna;
  });
}

export function ubahStatus(id, aktif, actor) {
  return prisma.$transaction(async (tx) => {
    const target = await ambilTarget(tx, id);
    if (target.aktif === aktif) return target;

    if (!aktif && target.role === ROLE.ADMIN) {
      await pastikanAdminTersisa(tx, target.id, actor.id);
    }

    const pengguna = await tx.pengguna.update({
      where: { id },
      data: { aktif },
      select: PILIH_PUBLIK,
    });
    await catatAktivitas(tx, {
      penggunaId: actor.id,
      aksi: aktif ? AKSI.AKTIFKAN_AKUN : AKSI.NONAKTIFKAN_AKUN,
      entitas: 'pengguna',
      entitasId: id,
      keterangan: target.username,
    });
    return pengguna;
  });
}

export async function resetPassword(id, passwordBaru, actor) {
  const password_hash = await hashPassword(passwordBaru);
  await prisma.$transaction(async (tx) => {
    const target = await ambilTarget(tx, id);
    await tx.pengguna.update({ where: { id }, data: { password_hash } });
    await catatAktivitas(tx, {
      penggunaId: actor.id,
      aksi: AKSI.RESET_PASSWORD,
      entitas: 'pengguna',
      entitasId: id,
      keterangan: target.username,
    });
  });
}

async function ambilTarget(tx, id) {
  const pengguna = await tx.pengguna.findUnique({ where: { id }, select: PILIH_PUBLIK });
  if (!pengguna) throw AppError.tidakDitemukan('Pengguna');
  return pengguna;
}

/** Admin tidak boleh menonaktifkan/menurunkan dirinya sendiri, dan harus tersisa minimal 1 admin aktif. */
async function pastikanAdminTersisa(tx, targetId, actorId) {
  if (targetId === actorId) {
    throw AppError.konflik(
      'ADMIN_TERAKHIR',
      'Anda tidak bisa menonaktifkan atau menurunkan role akun sendiri',
    );
  }
  // Admin lain dikunci: dua admin yang saling menurunkan bersamaan tidak boleh menyisakan nol admin
  const adminLain = await tx.$queryRaw`
    SELECT id FROM pengguna WHERE role = 'admin' AND aktif = 1 AND id <> ${targetId} FOR UPDATE`;
  if (adminLain.length === 0) {
    throw AppError.konflik('ADMIN_TERAKHIR', 'Minimal harus ada satu admin aktif');
  }
}
