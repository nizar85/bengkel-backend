import { z } from 'zod';
import { denganRentangValid, rentangTanggalQuery } from '../../utils/common-schemas.js';

export const rentangQuery = denganRentangValid(z.object({ ...rentangTanggalQuery.shape }));

export const pemasukanQuery = denganRentangValid(
  z.object({
    ...rentangTanggalQuery.shape,
    per: z.enum(['hari', 'minggu']).default('hari'),
  }),
);

// Parameter laporan yang diekspor sama dengan endpoint laporannya (per untuk pemasukan, limit untuk
// barang terlaris), karena isi berkas memang data laporan itu
export const eksporQuery = denganRentangValid(
  z.object({
    ...rentangTanggalQuery.shape,
    jenis: z.enum(['pemasukan', 'uang-keluar', 'laba-kasar', 'barang-terlaris']),
    format: z.enum(['xlsx', 'pdf']).default('xlsx'),
    per: z.enum(['hari', 'minggu']).default('hari'),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
);

export const terlarisQuery = denganRentangValid(
  z.object({
    ...rentangTanggalQuery.shape,
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
);
