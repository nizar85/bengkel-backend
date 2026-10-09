import { z } from 'zod';
import { METODE_BAYAR } from '../../constants/enums.js';
import {
  idSchema,
  minimalSatuField,
  paginasiQuery,
  qtySchema,
  tanggalSchema,
  teksOpsional,
} from '../../utils/common-schemas.js';

export const listQuery = paginasiQuery.extend({
  status_bayar: z.enum(['belum_bayar', 'lunas']).optional(),
  tanggal: tanggalSchema.optional(),
  q: z.string().trim().max(100).optional(),
});

export const buatBody = z.object({
  pelanggan_id: idSchema,
  mekanik_id: idSchema,
  keluhan: teksOpsional(2000),
  // Id kembar dibuang: satu jasa dua kali ditambahkan lewat POST /transaksi/:id/jasa
  jasa_ids: z
    .array(idSchema)
    .max(50)
    .transform((ids) => [...new Set(ids)])
    .optional(),
});

export const ubahBody = minimalSatuField(
  z.object({ keluhan: teksOpsional(2000), mekanik_id: idSchema.optional() }),
);

export const tambahJasaBody = z.object({ jasa_id: idSchema });

export const tambahBarangBody = z.object({ barang_id: idSchema, qty: qtySchema });

export const bayarBody = z.object({ metode_bayar: z.enum(METODE_BAYAR) });

export const detailParams = z.object({ id: idSchema, detailId: idSchema });
