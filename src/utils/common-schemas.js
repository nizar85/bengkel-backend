import { z } from 'zod';
import { adalahTanggalValid } from './waktu.js';

// Id bisa datang sebagai string (params) atau number (body JSON); dipakai sebagai BigInt oleh Prisma
export const idSchema = z
  .union([z.string().regex(/^\d+$/), z.number().int().positive()])
  .transform((v) => BigInt(v));

export const idParam = z.object({ id: idSchema });

export const paginasiQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Cek format saja meloloskan '2026-13-45', yang jadi Date tidak valid dan berakhir sebagai error 500
export const tanggalSchema = z
  .string()
  .refine(adalahTanggalValid, 'Tanggal tidak valid, gunakan format YYYY-MM-DD');

export const rentangTanggalQuery = z.object({
  dari: tanggalSchema.optional(),
  sampai: tanggalSchema.optional(),
});

/** Dipasang paling akhir pada skema query yang memakai rentangTanggalQuery. */
export const denganRentangValid = (schema) =>
  schema.refine(({ dari, sampai }) => !dari || !sampai || dari <= sampai, {
    message: "Tanggal 'dari' tidak boleh setelah 'sampai'",
    path: ['dari'],
  });

export const MAKS_UANG = 9_999_999_999.99; // batas kolom DECIMAL(12,2)
export const MAKS_QTY = 1_000_000; // batas wajar jumlah barang; mencegah luapan kolom INT

const angkaUang = z.coerce.number().max(MAKS_UANG).multipleOf(0.01);
export const uangSchema = angkaUang.nonnegative();
export const uangPositifSchema = angkaUang.positive();

export const qtySchema = z.coerce.number().int().min(1).max(MAKS_QTY);

/** Teks opsional: '' dan null menjadi null, undefined berarti tidak dikirim (tidak diubah). */
export const teksOpsional = (maks) =>
  z
    .string()
    .trim()
    .max(maks)
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional();

/** Untuk body PATCH: tolak body yang tidak mengubah apa pun. */
export const minimalSatuField = (schema) =>
  schema.refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'Minimal satu field harus diisi',
  });
