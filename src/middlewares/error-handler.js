import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/app-error.js';

const PESAN_BODY = {
  'entity.parse.failed': 'Body harus berupa JSON yang valid',
  'entity.too.large': 'Body terlalu besar',
};

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join('.'), pesan: i.message }));
    return res
      .status(400)
      .json({ error: { code: 'VALIDASI_GAGAL', message: 'Data tidak valid', details } });
  }
  if (err instanceof AppError) {
    return res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  // Gagal membaca body (JSON rusak, terlalu besar) adalah kesalahan client, bukan bug server
  if (PESAN_BODY[err?.type]) {
    return res
      .status(err.status)
      .json({ error: { code: 'VALIDASI_GAGAL', message: PESAN_BODY[err.type] } });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: { code: 'DATA_DUPLIKAT', message: 'Data sudah ada' } });
    }
    if (err.code === 'P2025') {
      return res
        .status(404)
        .json({ error: { code: 'TIDAK_DITEMUKAN', message: 'Data tidak ditemukan' } });
    }
  }
  console.error(err);
  return res
    .status(500)
    .json({ error: { code: 'KESALAHAN_SERVER', message: 'Terjadi kesalahan pada server' } });
}
