import { z } from 'zod';
import { minimalSatuField } from '../../utils/common-schemas.js';

export const ubahBody = minimalSatuField(
  z.object({
    jam_tutup: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Jam harus berformat 'HH:mm' (00:00 sampai 23:59)")
      .optional(),
    interval_servis_hari: z.coerce.number().int().min(1).max(365).optional(),
  }),
);
