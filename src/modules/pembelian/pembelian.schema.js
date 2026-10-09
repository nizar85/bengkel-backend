import {
  denganRentangValid,
  idSchema,
  paginasiQuery,
  qtySchema,
  rentangTanggalQuery,
  tanggalSchema,
  teksOpsional,
  uangPositifSchema,
} from '../../utils/common-schemas.js';
import { z } from 'zod';

export const buatBody = z.object({
  barang_id: idSchema,
  jumlah: qtySchema,
  total_harga: uangPositifSchema,
  tanggal: tanggalSchema.optional(),
  keterangan: teksOpsional(255),
});

export const listQuery = denganRentangValid(
  paginasiQuery.extend({
    barang_id: idSchema.optional(),
    ...rentangTanggalQuery.shape,
  }),
);
