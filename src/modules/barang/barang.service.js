import { AKSI } from '../../constants/aksi-log.js';
import { ROLE } from '../../constants/roles.js';
import { kunciBarang } from '../../lib/locks.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { hitungOffset } from '../../utils/pagination.js';
import { D, bulat2 } from '../../utils/uang.js';
import { catatAktivitas } from '../log-aktivitas/log-aktivitas.service.js';
import { catatStok } from '../stok-log/stok-log.service.js';

const BIDANG_BIASA = [
  'nama',
  'kategori',
  'satuan',
  'stok_minimum',
  'lokasi_rak',
  'kompatibilitas_motor',
  'tipe',
];

export async function listBarang(query, role) {
  const { q, kategori, lokasi_rak, stok_menipis, aktif, page, limit } = query;
  const admin = role === ROLE.ADMIN;
  const where = {
    // Non-admin hanya melihat barang aktif; admin boleh menyaring lewat ?aktif=
    ...(!admin ? { aktif: true } : aktif !== undefined && { aktif }),
    ...(q && {
      OR: [
        { nama: { contains: q } },
        { lokasi_rak: { contains: q } },
        { kompatibilitas_motor: { contains: q } },
      ],
    }),
    ...(kategori && { kategori }),
    ...(lokasi_rak && { lokasi_rak: { contains: lokasi_rak } }),
    // Membandingkan dua kolom di tabel yang sama memakai field reference Prisma
    ...(stok_menipis && { stok: { lt: prisma.barang.fields.stok_minimum } }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.barang.findMany({
      where,
      orderBy: [{ nama: 'asc' }, { id: 'asc' }],
      ...hitungOffset({ page, limit }),
    }),
    prisma.barang.count({ where }),
  ]);
  return { items, total };
}

export async function ambilBarang(id, role) {
  const barang = await prisma.barang.findUnique({ where: { id } });
  if (!barang || (!barang.aktif && role !== ROLE.ADMIN)) throw AppError.tidakDitemukan('Barang');
  return barang;
}

export async function pastikanBarangAda(id) {
  const ada = await prisma.barang.findUnique({ where: { id }, select: { id: true } });
  if (!ada) throw AppError.tidakDitemukan('Barang');
}

/** RMD-1: barang aktif yang stoknya di bawah batas minimum, paling sedikit dulu. */
export function daftarStokMenipis() {
  return prisma.barang.findMany({
    where: { aktif: true, stok: { lt: prisma.barang.fields.stok_minimum } },
    select: { id: true, nama: true, stok: true, stok_minimum: true, lokasi_rak: true },
    orderBy: [{ stok: 'asc' }, { nama: 'asc' }],
  });
}

export function buatBarang(input, actor) {
  return prisma.$transaction(async (tx) => {
    // Stok dan harga_beli_rata_rata tidak diisi di sini: keduanya default 0 sampai restock pertama
    const barang = await tx.barang.create({
      data: {
        nama: input.nama,
        kategori: input.kategori,
        satuan: input.satuan,
        harga_jual: bulat2(input.harga_jual).toFixed(2),
        stok_minimum: input.stok_minimum,
        lokasi_rak: input.lokasi_rak ?? null,
        kompatibilitas_motor: input.kompatibilitas_motor ?? null,
        tipe: input.tipe ?? null,
      },
    });
    await catatAktivitas(tx, {
      penggunaId: actor.id,
      aksi: AKSI.BUAT_BARANG,
      entitas: 'barang',
      entitasId: barang.id,
      keterangan: barang.nama,
    });
    return barang;
  });
}

export function ubahBarang(id, input, actor) {
  return prisma.$transaction(async (tx) => {
    const lama = await ambilBarangTx(tx, id);
    const data = {};
    const berubah = [];
    for (const bidang of BIDANG_BIASA) {
      if (input[bidang] !== undefined && input[bidang] !== lama[bidang]) {
        data[bidang] = input[bidang];
        berubah.push(bidang);
      }
    }
    const hargaBerubah =
      input.harga_jual !== undefined && !D(input.harga_jual).equals(D(lama.harga_jual));
    if (hargaBerubah) data.harga_jual = bulat2(input.harga_jual).toFixed(2);
    if (Object.keys(data).length === 0) return lama;

    const barang = await tx.barang.update({ where: { id }, data });
    if (hargaBerubah) {
      await catatAktivitas(tx, {
        penggunaId: actor.id,
        aksi: AKSI.UBAH_HARGA,
        entitas: 'barang',
        entitasId: id,
        keterangan: `${lama.nama}: ${D(lama.harga_jual)} → ${D(barang.harga_jual)}`,
      });
    }
    if (berubah.length > 0) {
      await catatAktivitas(tx, {
        penggunaId: actor.id,
        aksi: AKSI.UBAH_BARANG,
        entitas: 'barang',
        entitasId: id,
        keterangan: `${lama.nama} (${berubah.join(', ')})`,
      });
    }
    return barang;
  });
}

export function ubahStatusBarang(id, aktif, actor) {
  return prisma.$transaction(async (tx) => {
    const lama = await ambilBarangTx(tx, id);
    if (lama.aktif === aktif) return lama;

    const barang = await tx.barang.update({ where: { id }, data: { aktif } });
    await catatAktivitas(tx, {
      penggunaId: actor.id,
      aksi: AKSI.UBAH_STATUS_BARANG,
      entitas: 'barang',
      entitasId: id,
      keterangan: `${lama.nama}: ${aktif ? 'diaktifkan' : 'dinonaktifkan'}`,
    });
    return barang;
  });
}

/** Koreksi stok manual (mis. setelah cek fisik). Harga beli rata-rata tidak berubah. */
export function sesuaikanStok(id, { qty_perubahan, alasan }, actor) {
  return prisma.$transaction(async (tx) => {
    const barang = await kunciBarang(tx, id);
    const stokSesudah = barang.stok + qty_perubahan;
    if (stokSesudah < 0) {
      throw AppError.konflik('STOK_TIDAK_CUKUP', 'Stok tidak cukup', { sisa_stok: barang.stok });
    }

    const diperbarui = await tulisStokBarang(tx, barang.id, { stok: stokSesudah });
    await catatStok(tx, {
      barangId: barang.id,
      tipe: 'penyesuaian',
      qtyPerubahan: qty_perubahan,
      stokSesudah,
      penggunaId: actor.id,
      keterangan: alasan,
    });
    await catatAktivitas(tx, {
      penggunaId: actor.id,
      aksi: AKSI.PENYESUAIAN_STOK,
      entitas: 'barang',
      entitasId: barang.id,
      keterangan: `${barang.nama} ${qty_perubahan > 0 ? '+' : ''}${qty_perubahan}: ${alasan}`,
    });
    return diperbarui;
  });
}

/**
 * Satu-satunya jalan bagi modul lain (transaksi, pembelian) untuk menulis stok dan harga beli
 * rata-rata. Pemanggil wajib sudah memegang kunciBarang(tx, id) di transaksi yang sama.
 */
export function tulisStokBarang(tx, barangId, { stok, hargaBeliRataRata }) {
  return tx.barang.update({
    where: { id: barangId },
    data: {
      stok,
      ...(hargaBeliRataRata !== undefined && {
        harga_beli_rata_rata: hargaBeliRataRata.toFixed(2),
      }),
    },
  });
}

async function ambilBarangTx(tx, id) {
  const barang = await tx.barang.findUnique({ where: { id } });
  if (!barang) throw AppError.tidakDitemukan('Barang');
  return barang;
}
