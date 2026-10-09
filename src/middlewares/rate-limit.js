import { rateLimit } from 'express-rate-limit';
import { AppError } from '../utils/app-error.js';

// Yang dihitung hanya percobaan gagal: login berhasil bukan serangan brute force, dan staf bengkel
// bisa berbagi satu IP yang sama (satu jaringan, satu komputer kasir)
export const batasLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(
      new AppError(
        429,
        'TERLALU_BANYAK_PERCOBAAN',
        'Terlalu banyak percobaan login, coba lagi nanti',
      ),
    ),
});
