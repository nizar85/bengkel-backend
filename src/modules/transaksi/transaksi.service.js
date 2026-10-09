import { AKSI } from '../../constants/aksi-log.js';
import { ROLE } from '../../constants/roles.js';
import { kunciBarang, kunciTransaksi } from '../../lib/locks.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { hitungOffset } from '../../utils/pagination.js';
import { rentangHariWIB, tanggalWIB } from '../../utils/waktu.js';
import { tulisStokBarang } from '../barang/barang.service.js';
import { ambilJasaAktif } from '../jasa/jasa.service.js';
import { catatAktivitas } from '../log-aktivitas/log-aktivitas.service.js';
import { pastikanPelangganAda } from '../pelanggan/pelanggan.service.js';
import { pastikanMekanikValid } from '../pengguna/pengguna.service.js';
import { catatStok } from '../stok-log/stok-log.service.js';
import {
  bisaDilunasi,
  buatKodeTransaksi,
  hitungSubtotalBarang,
  hitungSubtotalJasa,
} from './transaksi.calc.js';

const SERTAKAN_DETAIL = {
  pelanggan: true,
  mekanik: { select: { id: true, nama: true } },
  dibuat_oleh: { select: { id: true, nama: true } },
  dibayar_oleh: { select: { id: true, nama: true } },
  detail_jasa: { include: { jasa: { select: { nama: true } } }, orderBy: { id: 'asc' } },
  detail_barang: {
    include: { barang: { select: { nama: true, satuan: true, lokasi_rak: true } } },
    orderBy: { id: 'asc' },
  },
};

const SERTAKAN_RINGKAS = {
  pelanggan: { select: { id: true, nama: true, no_polisi: true, tipe_motor: true } },
  mekanik: { select: { id: true, nama: true } },
};

export function pastikanBelumLunas(transaksi) {
  if (transaksi.status_bayar === 'lunas') {
    throw AppError.konflik('TRANSAKSI_SUDAH_LUNAS', 'Transaksi sudah lunas dan tidak bisa diubah');
  }
}

// Balas 404 (bukan 403) supaya mekanik tidak bisa menebak transaksi milik orang lain
export function pastikanAksesMekanik(transaksi, user) {
  if (user.role === ROLE.MEKANIK && transaksi.mekanik_id !== user.id) {
    throw AppError.tidakDitemukan('Transaksi');
  }
}

export async function listTransaksi({ status_bayar, tanggal, q, page, limit }, user) {
  const where = {
    ...(user.role === ROLE.MEKANIK && { mekanik_id: user.id }),
    ...(status_bayar && { status_bayar }),
    ...(tanggal && { created_at: filterHari(tanggal) }),
    ...(q && {
      OR: [
        { kode: { contains: q } },
        { pelanggan: { nama: { contains: q } } },
        { pelanggan: { no_polisi: { contains: q } } },
      ],
    }),
  };
  return cariTransaksi(where, { page, limit });
}

/** Riwayat transaksi satu pelanggan, terbaru dulu (FIN-7). */
export function listTransaksiPelanggan(pelangganId, { page, limit }) {
  return cariTransaksi({ pelanggan_id: pelangganId }, { page, limit });
}

/** Transaksi belum bayar, terlama dulu (dashboard kasir; dashboard mekanik lewat `mekanikId`). */
export function daftarBelumBayar({ mekanikId, limit }) {
  return prisma.transaksiServis.findMany({
    where: { status_bayar: 'belum_bayar', ...(mekanikId && { mekanik_id: mekanikId }) },
    orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
    take: limit,
    include: SERTAKAN_RINGKAS,
  });
}

/**
 * Angka "hari ini" untuk dashboard. Jumlah transaksi dihitung dari yang dibuat di rentang itu,
 * sedangkan pemasukan dari transaksi lunas yang dibayar di rentang itu (kapan uang diterima).
 */
export async function ringkasanHariIni({ awal, akhir }) {
  const dibuatHariIni = { created_at: { gte: awal, lt: akhir } };
  const [jumlah, belumBayar, pemasukan] = await prisma.$transaction([
    prisma.transaksiServis.count({ where: dibuatHariIni }),
    prisma.transaksiServis.count({ where: { ...dibuatHariIni, status_bayar: 'belum_bayar' } }),
    prisma.transaksiServis.aggregate({
      where: { status_bayar: 'lunas', dibayar_at: { gte: awal, lt: akhir } },
      _sum: { subtotal_jasa: true, subtotal_barang: true, total: true },
    }),
  ]);
  return {
    jumlah,
    belumBayar,
    pemasukan: {
      jasa: pemasukan._sum.subtotal_jasa ?? 0,
      barang: pemasukan._sum.subtotal_barang ?? 0,
      total: pemasukan._sum.total ?? 0,
    },
  };
}

export async function ambilTransaksi(id, user) {
  const transaksi = await ambilDetailTransaksi(prisma, id);
  if (!transaksi) throw AppError.tidakDitemukan('Transaksi');
  pastikanAksesMekanik(transaksi, user);
  return transaksi;
}

async function cariTransaksi(where, { page, limit }) {
  const [items, total] = await prisma.$transaction([
    prisma.transaksiServis.findMany({
      where,
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      ...hitungOffset({ page, limit }),
      include: SERTAKAN_RINGKAS,
    }),
    prisma.transaksiServis.count({ where }),
  ]);
  return { items, total };
}

const filterHari = (tanggal) => {
  const { awal, akhir } = rentangHariWIB(tanggal);
  return { gte: awal, lt: akhir };
};

const ambilDetailTransaksi = (tx, id) =>
  tx.transaksiServis.findUnique({ where: { id }, include: SERTAKAN_DETAIL });

export async function buatTransaksi(input, user) {
  for (let percobaan = 1; percobaan <= 3; percobaan++) {
    try {
      return await prisma.$transaction((tx) => buatDalamTx(tx, input, user));
    } catch (err) {
      // Dua kasir bisa mendapat nomor urut yang sama di saat bersamaan. Unique index pada `kode`
      // menolak salah satunya, lalu dicoba lagi dengan nomor urut berikutnya.
      if (err?.code === 'P2002' && String(err.meta?.target).includes('kode') && percobaan < 3) {
        continue;
      }
      throw err;
    }
  }
}

async function buatDalamTx(tx, input, user) {
  await pastikanPelangganAda(tx, input.pelanggan_id);
  await pastikanMekanikValid(tx, input.mekanik_id); // role mekanik/admin & aktif, else 409 MEKANIK_TIDAK_VALID
  const daftarJasa = await ambilJasaAktif(tx, input.jasa_ids ?? []); // jasa nonaktif → 409 DATA_NONAKTIF

  const hariIni = tanggalWIB();
  const { awal, akhir } = rentangHariWIB(hariIni);
  const urutan =
    (await tx.transaksiServis.count({ where: { created_at: { gte: awal, lt: akhir } } })) + 1;

  const transaksi = await tx.transaksiServis.create({
    data: {
      kode: buatKodeTransaksi(hariIni, urutan), // TRX-20261001-001
      pelanggan_id: input.pelanggan_id,
      mekanik_id: input.mekanik_id,
      dibuat_oleh_id: user.id,
      keluhan: input.keluhan ?? null,
      // Harga jasa disalin ke baris detail (snapshot), tidak ikut berubah kalau harga master berubah
      detail_jasa: { create: daftarJasa.map((j) => ({ jasa_id: j.id, harga: j.harga })) },
    },
  });

  await hitungUlangTotal(tx, transaksi.id);
  await catatAktivitas(tx, {
    penggunaId: user.id,
    aksi: AKSI.BUAT_TRANSAKSI,
    entitas: 'transaksi_servis',
    entitasId: transaksi.id,
    keterangan: transaksi.kode,
  });
  return ambilDetailTransaksi(tx, transaksi.id);
}

export function ubahTransaksi(transaksiId, input, user) {
  return prisma.$transaction(async (tx) => {
    const transaksi = await kunciTransaksi(tx, transaksiId);
    pastikanBelumLunas(transaksi);
    if (input.mekanik_id !== undefined) await pastikanMekanikValid(tx, input.mekanik_id);

    await tx.transaksiServis.update({
      where: { id: transaksi.id },
      data: { keluhan: input.keluhan, mekanik_id: input.mekanik_id },
    });
    await catatAktivitas(tx, {
      penggunaId: user.id,
      aksi: AKSI.UBAH_TRANSAKSI,
      entitas: 'transaksi_servis',
      entitasId: transaksi.id,
      keterangan: transaksi.kode,
    });
    return ambilDetailTransaksi(tx, transaksi.id);
  });
}

export function tambahJasa(transaksiId, { jasa_id }, user) {
  return prisma.$transaction(async (tx) => {
    const transaksi = await kunciTransaksi(tx, transaksiId);
    pastikanBelumLunas(transaksi);

    const [jasa] = await ambilJasaAktif(tx, [jasa_id]);
    await tx.detailJasa.create({
      data: { transaksi_servis_id: transaksi.id, jasa_id: jasa.id, harga: jasa.harga },
    });
    await hitungUlangTotal(tx, transaksi.id);
    await catatAktivitas(tx, {
      penggunaId: user.id,
      aksi: AKSI.TAMBAH_JASA,
      entitas: 'transaksi_servis',
      entitasId: transaksi.id,
      keterangan: `${jasa.nama} di ${transaksi.kode}`,
    });
    return ambilDetailTransaksi(tx, transaksi.id);
  });
}

export function hapusJasa(transaksiId, detailId, user) {
  return prisma.$transaction(async (tx) => {
    const transaksi = await kunciTransaksi(tx, transaksiId);
    pastikanBelumLunas(transaksi);

    const detail = await tx.detailJasa.findFirst({
      where: { id: detailId, transaksi_servis_id: transaksi.id },
      include: { jasa: { select: { nama: true } } },
    });
    if (!detail) throw AppError.tidakDitemukan('Detail jasa');

    await tx.detailJasa.delete({ where: { id: detail.id } });
    await hitungUlangTotal(tx, transaksi.id);
    await catatAktivitas(tx, {
      penggunaId: user.id,
      aksi: AKSI.HAPUS_JASA,
      entitas: 'transaksi_servis',
      entitasId: transaksi.id,
      keterangan: `${detail.jasa.nama} dari ${transaksi.kode}`,
    });
    return ambilDetailTransaksi(tx, transaksi.id);
  });
}

export function tambahSparepart(transaksiId, { barang_id, qty }, user) {
  return prisma.$transaction(async (tx) => {
    const transaksi = await kunciTransaksi(tx, transaksiId);
    pastikanBelumLunas(transaksi);

    const barang = await kunciBarang(tx, barang_id);
    if (!barang.aktif) throw AppError.konflik('DATA_NONAKTIF', 'Barang sudah nonaktif');
    if (barang.stok < qty) {
      throw AppError.konflik('STOK_TIDAK_CUKUP', 'Stok tidak cukup', { sisa_stok: barang.stok });
    }

    const stokSesudah = barang.stok - qty;
    await tulisStokBarang(tx, barang.id, { stok: stokSesudah });

    // Snapshot harga jual & harga beli rata-rata saat dipakai: laporan laba kasar (FIN-6)
    // harus memakai modal saat itu, bukan modal setelah restock berikutnya.
    await tx.detailBarang.create({
      data: {
        transaksi_servis_id: transaksi.id,
        barang_id: barang.id,
        qty,
        harga_jual: barang.harga_jual.toFixed(2),
        harga_beli: barang.harga_beli_rata_rata.toFixed(2),
        dicatat_oleh_id: user.id,
      },
    });

    await catatStok(tx, {
      barangId: barang.id,
      tipe: 'keluar',
      qtyPerubahan: -qty,
      stokSesudah,
      transaksiServisId: transaksi.id,
      penggunaId: user.id,
      keterangan: `Dipakai di ${transaksi.kode}`,
    });
    await hitungUlangTotal(tx, transaksi.id);
    await catatAktivitas(tx, {
      penggunaId: user.id,
      aksi: AKSI.TAMBAH_SPAREPART,
      entitas: 'transaksi_servis',
      entitasId: transaksi.id,
      keterangan: `${barang.nama} x${qty}`,
    });
    return ambilDetailTransaksi(tx, transaksi.id);
  });
}

export function hapusSparepart(transaksiId, detailId, user) {
  return prisma.$transaction(async (tx) => {
    const transaksi = await kunciTransaksi(tx, transaksiId);
    pastikanBelumLunas(transaksi);

    const detail = await tx.detailBarang.findFirst({
      where: { id: detailId, transaksi_servis_id: transaksi.id },
    });
    if (!detail) throw AppError.tidakDitemukan('Detail sparepart');

    const barang = await kunciBarang(tx, detail.barang_id);
    // Harga beli rata-rata sengaja tidak dihitung ulang: barang kembali dengan modal yang sama,
    // jadi rata-ratanya praktis tidak berubah dan alurnya tetap sederhana
    const stokSesudah = barang.stok + detail.qty;
    await tulisStokBarang(tx, barang.id, { stok: stokSesudah });
    await tx.detailBarang.delete({ where: { id: detail.id } });

    await catatStok(tx, {
      barangId: barang.id,
      tipe: 'masuk',
      qtyPerubahan: detail.qty,
      stokSesudah,
      transaksiServisId: transaksi.id,
      penggunaId: user.id,
      keterangan: `Dikembalikan dari ${transaksi.kode}`,
    });
    await hitungUlangTotal(tx, transaksi.id);
    await catatAktivitas(tx, {
      penggunaId: user.id,
      aksi: AKSI.HAPUS_SPAREPART,
      entitas: 'transaksi_servis',
      entitasId: transaksi.id,
      keterangan: `${barang.nama} x${detail.qty}`,
    });
    return ambilDetailTransaksi(tx, transaksi.id);
  });
}

export function bayar(transaksiId, { metode_bayar }, user) {
  return prisma.$transaction(async (tx) => {
    const transaksi = await kunciTransaksi(tx, transaksiId);
    pastikanBelumLunas(transaksi);

    const jumlahJasa = await tx.detailJasa.count({ where: { transaksi_servis_id: transaksi.id } });
    const jumlahBarang = await tx.detailBarang.count({
      where: { transaksi_servis_id: transaksi.id },
    });
    if (!bisaDilunasi({ jumlahJasa, jumlahBarang })) {
      throw AppError.konflik('TRANSAKSI_KOSONG', 'Transaksi belum punya jasa atau sparepart');
    }

    // Total dihitung ulang sekali lagi sebelum dikunci, untuk jaga-jaga data detail berubah
    await hitungUlangTotal(tx, transaksi.id);
    await tx.transaksiServis.update({
      where: { id: transaksi.id },
      data: {
        status_bayar: 'lunas',
        metode_bayar,
        dibayar_at: new Date(),
        dibayar_oleh_id: user.id,
      },
    });
    await catatAktivitas(tx, {
      penggunaId: user.id,
      aksi: AKSI.TERIMA_PEMBAYARAN,
      entitas: 'transaksi_servis',
      entitasId: transaksi.id,
      keterangan: `${transaksi.kode} (${metode_bayar})`,
    });
    return ambilDetailTransaksi(tx, transaksi.id);
  });
}

// Total SELALU dihitung ulang dari baris detail, tidak pernah ditambah/dikurangi secara bertahap,
// supaya tidak bisa melenceng.
export async function hitungUlangTotal(tx, transaksiId) {
  const jasa = await tx.detailJasa.findMany({
    where: { transaksi_servis_id: transaksiId },
    select: { harga: true },
  });
  const barang = await tx.detailBarang.findMany({
    where: { transaksi_servis_id: transaksiId },
    select: { qty: true, harga_jual: true },
  });
  const subtotalJasa = hitungSubtotalJasa(jasa);
  const subtotalBarang = hitungSubtotalBarang(barang);
  await tx.transaksiServis.update({
    where: { id: transaksiId },
    data: {
      subtotal_jasa: subtotalJasa.toFixed(2),
      subtotal_barang: subtotalBarang.toFixed(2),
      total: subtotalJasa.plus(subtotalBarang).toFixed(2),
    },
  });
}
