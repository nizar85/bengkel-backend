import { z } from 'zod';
import { KATEGORI_PENGELUARAN } from '../../constants/enums.js';
import {
  denganRentangValid,
  minimalSatuField,
  paginasiQuery,
  rentangTanggalQuery,
  tanggalSchema,
  teksOpsional,
  uangPositifSchema,
} from '../../utils/common-schemas.js';

const kategori = z.enum(KATEGORI_PENGELUARAN);

export const listQuery = denganRentangValid(
  paginasiQuery.extend({
    kategori: kategori.optional(),
    ...rentangTanggalQuery.shape,
  }),
);

export const buatBody = z.object({
  kategori,
  jumlah: uangPositifSchema,
  tanggal: tanggalSchema,
  keterangan: teksOpsional(255),
});

export const ubahBody = minimalSatuField(
  z.object({
    kategori: kategori.optional(),
    jumlah: uangPositifSchema.optional(),
    tanggal: tanggalSchema.optional(),
    keterangan: teksOpsional(255),
  }),
);
