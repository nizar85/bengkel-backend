import Decimal from 'decimal.js';

/** Buat Decimal dari angka/string/Prisma.Decimal. */
export const D = (v) => new Decimal(String(v ?? 0));

/** Bulatkan ke 2 desimal, half-up. */
export const bulat2 = (d) => D(d).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

/** Untuk DTO: Decimal → Number (rupiah aman di presisi double). */
export const uang = (v) => (v == null ? null : Number(v));
