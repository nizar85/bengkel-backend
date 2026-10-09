import { z } from 'zod';
import { minimalSatuField, uangSchema } from '../../utils/common-schemas.js';

const nama = z.string().trim().min(1).max(100);

export const listQuery = z.object({
  q: z.string().trim().max(100).optional(),
  aktif: z.stringbool().optional(),
});

export const buatBody = z.object({ nama, harga: uangSchema });

export const ubahBody = minimalSatuField(
  z.object({ nama: nama.optional(), harga: uangSchema.optional() }),
);

export const statusBody = z.object({ aktif: z.boolean() });
