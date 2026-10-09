import { z } from 'zod';
import {
  denganRentangValid,
  idSchema,
  paginasiQuery,
  rentangTanggalQuery,
} from '../../utils/common-schemas.js';

export const listQuery = denganRentangValid(
  paginasiQuery.extend({
    pengguna_id: idSchema.optional(),
    aksi: z.string().trim().min(1).max(50).optional(),
    ...rentangTanggalQuery.shape,
  }),
);
