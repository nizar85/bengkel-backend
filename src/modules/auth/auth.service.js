import { AKSI } from '../../constants/aksi-log.js';
import { signToken } from '../../lib/jwt.js';
import { cocokPassword, hashPassword } from '../../lib/password.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { catatAktivitas } from '../log-aktivitas/log-aktivitas.service.js';
import { ambilProfilPengguna, cariPenggunaUntukLogin } from '../pengguna/pengguna.service.js';

// Username yang tidak terdaftar tetap memicu perbandingan bcrypt, supaya waktu respons tidak
// membocorkan apakah username itu ada
let hashTiruan;
const ambilHashTiruan = () => (hashTiruan ??= hashPassword('hash-tiruan-tidak-pernah-cocok'));

export async function login({ username, password }) {
  const pengguna = await cariPenggunaUntukLogin(username);
  const hash = pengguna?.password_hash ?? (await ambilHashTiruan());
  const cocok = await cocokPassword(password, hash);
  if (!pengguna || !cocok || !pengguna.aktif) {
    throw new AppError(401, 'LOGIN_GAGAL', 'Username atau password salah');
  }

  await catatAktivitas(prisma, {
    penggunaId: pengguna.id,
    aksi: AKSI.LOGIN,
    entitas: 'pengguna',
    entitasId: pengguna.id,
  });
  return { token: signToken(pengguna), pengguna };
}

export const profilSaya = (id) => ambilProfilPengguna(id);
