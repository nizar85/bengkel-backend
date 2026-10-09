import { z } from 'zod';
import { ROLE } from '../../constants/roles.js';
import { minimalSatuField, paginasiQuery, teksOpsional } from '../../utils/common-schemas.js';

const peran = z.enum(Object.values(ROLE));
const nama = z.string().trim().min(1).max(100);
// bcrypt hanya membaca 72 karakter pertama, jadi lebih panjang dari itu percuma
const password = z.string().min(8).max(72);

export const listQuery = paginasiQuery.extend({
  q: z.string().trim().max(100).optional(),
  role: peran.optional(),
  aktif: z.stringbool().optional(),
});

export const buatBody = z.object({
  nama,
  username: z.string().trim().min(3).max(50),
  password,
  role: peran,
  no_hp: teksOpsional(20),
});

export const ubahBody = minimalSatuField(
  z.object({ nama: nama.optional(), role: peran.optional(), no_hp: teksOpsional(20) }),
);

export const statusBody = z.object({ aktif: z.boolean() });

export const resetPasswordBody = z.object({ password_baru: password });
