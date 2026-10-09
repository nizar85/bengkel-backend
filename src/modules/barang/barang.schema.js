import { z } from 'zod';
import { NILAI_KATEGORI_BARANG, TIPE_BARANG } from '../../constants/enums.js';
import {
  MAKS_QTY,
  denganRentangValid,
  minimalSatuField,
  paginasiQuery,
  rentangTanggalQuery,
  teksOpsional,
  uangSchema,
} from '../../utils/common-schemas.js';

const nama = z.string().trim().min(1).max(150);
const kategori = z.enum(NILAI_KATEGORI_BARANG);
const satuan = z.string().trim().min(1).max(20);
const stokMinimum = z.coerce.number().int().min(0).max(MAKS_QTY);
const tipe = z.enum(TIPE_BARANG).nullable();

export const listQuery = paginasiQuery.extend({
  q: z.string().trim().max(100).optional(),
  kategori: kategori.optional(),
  lokasi_rak: z.string().trim().max(50).optional(),
  stok_menipis: z.stringbool().optional(),
  aktif: z.stringbool().optional(),
});

// strictObject: stok dan harga_beli_rata_rata TIDAK boleh dikirim lewat sini (stok awal & harga beli
// hanya masuk lewat restock), jadi field asing ditolak dengan 400, bukan diam-diam diabaikan
export const buatBody = z.strictObject({
  nama,
  kategori,
  satuan: satuan.optional(),
  harga_jual: uangSchema,
  stok_minimum: stokMinimum.optional(),
  lokasi_rak: teksOpsional(50),
  kompatibilitas_motor: teksOpsional(255),
  tipe: tipe.optional(),
});

export const ubahBody = minimalSatuField(
  z.strictObject({
    nama: nama.optional(),
    kategori: kategori.optional(),
    satuan: satuan.optional(),
    harga_jual: uangSchema.optional(),
    stok_minimum: stokMinimum.optional(),
    lokasi_rak: teksOpsional(50),
    kompatibilitas_motor: teksOpsional(255),
    tipe: tipe.optional(),
  }),
);

export const statusBody = z.object({ aktif: z.boolean() });

export const penyesuaianBody = z.object({
  qty_perubahan: z.coerce
    .number()
    .int()
    .min(-MAKS_QTY)
    .max(MAKS_QTY)
    .refine((v) => v !== 0, 'qty_perubahan tidak boleh 0'),
  alasan: z.string().trim().min(1).max(255),
});

export const stokLogQuery = denganRentangValid(paginasiQuery.extend(rentangTanggalQuery.shape));
