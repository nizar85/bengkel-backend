import { z } from 'zod';
import { minimalSatuField, paginasiQuery, teksOpsional } from '../../utils/common-schemas.js';

const nama = z.string().trim().min(1).max(100);
const noHp = z.string().trim().min(1).max(20);

export const listQuery = paginasiQuery.extend({
  q: z.string().trim().max(100).optional(),
});

export const buatBody = z.object({
  nama,
  no_hp: noHp,
  no_polisi: teksOpsional(15),
  tipe_motor: teksOpsional(100),
});

export const ubahBody = minimalSatuField(
  z.object({
    nama: nama.optional(),
    no_hp: noHp.optional(),
    no_polisi: teksOpsional(15),
    tipe_motor: teksOpsional(100),
  }),
);
