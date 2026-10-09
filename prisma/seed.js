import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME ?? 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) throw new Error('SEED_ADMIN_PASSWORD wajib diisi di .env');

  await prisma.pengguna.upsert({
    where: { username },
    update: {},
    create: {
      nama: 'Pemilik Bengkel',
      username,
      password_hash: await bcrypt.hash(password, 10),
      role: 'admin',
    },
  });

  // jam_tutup masih menunggu konfirmasi mitra; "17:00" hanya placeholder yang bisa diubah Admin
  const pengaturan = [
    { kunci: 'interval_servis_hari', nilai: '60' },
    { kunci: 'jam_tutup', nilai: '17:00' },
  ];
  for (const p of pengaturan) {
    await prisma.pengaturan.upsert({ where: { kunci: p.kunci }, update: {}, create: p });
  }
}

main().finally(() => prisma.$disconnect());
