import { prisma } from '../lib/prisma.js';
import { verifyToken } from '../lib/jwt.js';
import { NAMA_COOKIE } from '../modules/auth/auth.cookie.js';
import { AppError } from '../utils/app-error.js';

export async function authenticate(req, _res, next) {
  const token = req.cookies?.[NAMA_COOKIE];
  if (!token) throw AppError.tidakTerautentikasi();

  const payload = verifyToken(token); // token rusak/kedaluwarsa → lempar AppError 401
  const pengguna = await prisma.pengguna.findUnique({
    where: { id: BigInt(payload.sub) },
    select: { id: true, nama: true, role: true, aktif: true },
  });
  if (!pengguna?.aktif) throw AppError.tidakTerautentikasi();

  req.user = { id: pengguna.id, nama: pengguna.nama, role: pengguna.role };
  next();
}
