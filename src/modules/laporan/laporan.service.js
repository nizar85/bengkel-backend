import { Prisma } from '@prisma/client';
import { KATEGORI_PENGELUARAN } from '../../constants/enums.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { D } from '../../utils/uang.js';
import { dariKolomDate, rentangTanggalWIB, tanggalWIB } from '../../utils/waktu.js';
import { totalPembelian } from '../pembelian/pembelian.service.js';
import { totalPengeluaranPerKategori } from '../pengeluaran/pengeluaran.service.js';
import { hitungLabaKasar, hitungTotalUangKeluar, tentukanRentangLaporan } from './laporan.calc.js';

// Modul ini read model: query agregat lintas tabel yang hanya membaca, jadi aturan "satu modul
// tidak menyentuh tabel modul lain" tidak berlaku untuk SQL transaksi di bawah (sesuai bagian 11).
// Semua laporan memakai transaksi LUNAS dan menyaring dengan dibayar_at, yaitu kapan uang diterima.

function siapkanRentang(query) {
  const { dari, sampai } = tentukanRentangLaporan(query, tanggalWIB());
  if (dari > sampai) {
    throw new AppError(400, 'VALIDASI_GAGAL', "Tanggal 'dari' tidak boleh setelah 'sampai'");
  }
  return { dari, sampai, ...rentangTanggalWIB(dari, sampai) };
}

const keTanggal = (nilai) =>
  nilai instanceof Date ? dariKolomDate(nilai) : String(nilai).slice(0, 10);

/** FIN-4: pemasukan per hari atau per minggu (Senin), dipecah jasa vs barang. */
export async function pemasukan(query) {
  const { dari, sampai, awal, akhir } = siapkanRentang(query);
  // Database menyimpan UTC, sedangkan hari/minggu laporan menurut WIB (UTC+7). CONVERT_TZ dengan
  // offset angka tidak butuh tabel zona waktu MySQL.
  const lokal = Prisma.sql`CONVERT_TZ(dibayar_at, '+00:00', '+07:00')`;
  // WEEKDAY() 0 = Senin, jadi pengurangan ini selalu jatuh di Senin (awal minggu ISO)
  const periode =
    query.per === 'minggu'
      ? Prisma.sql`DATE_SUB(DATE(${lokal}), INTERVAL WEEKDAY(${lokal}) DAY)`
      : Prisma.sql`DATE(${lokal})`;

  const rows = await prisma.$queryRaw`
    SELECT ${periode} AS periode,
           COUNT(*) AS jumlah_transaksi,
           SUM(subtotal_jasa) AS pemasukan_jasa,
           SUM(subtotal_barang) AS pemasukan_barang,
           SUM(total) AS pemasukan_total
    FROM transaksi_servis
    WHERE status_bayar = 'lunas' AND dibayar_at >= ${awal} AND dibayar_at < ${akhir}
    GROUP BY periode
    ORDER BY periode`;

  const baris = rows.map((r) => ({
    periode: keTanggal(r.periode),
    jumlah: Number(r.jumlah_transaksi),
    jasa: D(r.pemasukan_jasa),
    barang: D(r.pemasukan_barang),
    total: D(r.pemasukan_total),
  }));
  const ringkasan = baris.reduce(
    (t, b) => ({
      jumlah: t.jumlah + b.jumlah,
      jasa: t.jasa.plus(b.jasa),
      barang: t.barang.plus(b.barang),
      total: t.total.plus(b.total),
    }),
    { jumlah: 0, jasa: D(0), barang: D(0), total: D(0) },
  );
  return { dari, sampai, per: query.per, baris, ringkasan };
}

/** FIN-5: pembelian barang + pengeluaran operasional per kategori. */
export async function uangKeluar(query) {
  const { dari, sampai } = siapkanRentang(query);
  return { dari, sampai, ...(await ringkasUangKeluar({ dari, sampai })) };
}

/** FIN-6: laba kasar, ditampilkan berdampingan dengan total pengeluaran dan pembelian. */
export async function labaKasar(query) {
  const { dari, sampai, awal, akhir } = siapkanRentang(query);
  const [{ pendapatan }] = await prisma.$queryRaw`
    SELECT COALESCE(SUM(total), 0) AS pendapatan FROM transaksi_servis
    WHERE status_bayar = 'lunas' AND dibayar_at >= ${awal} AND dibayar_at < ${akhir}`;
  // Harga beli memakai snapshot di detail_barang, jadi modal yang dipakai adalah modal saat dipakai
  const [{ hpp }] = await prisma.$queryRaw`
    SELECT COALESCE(SUM(db.qty * db.harga_beli), 0) AS hpp
    FROM detail_barang db
    JOIN transaksi_servis t ON t.id = db.transaksi_servis_id
    WHERE t.status_bayar = 'lunas' AND t.dibayar_at >= ${awal} AND t.dibayar_at < ${akhir}`;
  const keluar = await ringkasUangKeluar({ dari, sampai });

  return {
    dari,
    sampai,
    pendapatan: D(pendapatan),
    hpp: D(hpp),
    labaKasar: hitungLabaKasar(pendapatan, hpp),
    totalPengeluaran: keluar.totalPengeluaran,
    totalPembelian: D(keluar.pembelian.total),
  };
}

/** STK-9: barang dengan qty terpakai terbanyak. */
export async function barangTerlaris(query) {
  const { dari, sampai, awal, akhir } = siapkanRentang(query);
  const rows = await prisma.$queryRaw`
    SELECT b.id AS barang_id, b.nama AS nama, SUM(db.qty) AS total_qty
    FROM detail_barang db
    JOIN transaksi_servis t ON t.id = db.transaksi_servis_id
    JOIN barang b ON b.id = db.barang_id
    WHERE t.status_bayar = 'lunas' AND t.dibayar_at >= ${awal} AND t.dibayar_at < ${akhir}
    GROUP BY b.id, b.nama
    ORDER BY total_qty DESC, b.nama ASC
    LIMIT ${query.limit}`;
  const baris = rows.map((r) => ({
    barangId: Number(r.barang_id),
    nama: r.nama,
    totalQty: Number(r.total_qty),
  }));
  return { dari, sampai, baris };
}

async function ringkasUangKeluar({ dari, sampai }) {
  const pembelian = await totalPembelian({ dari, sampai });
  const perKategoriDb = new Map(
    (await totalPengeluaranPerKategori({ dari, sampai })).map((k) => [k.kategori, D(k.total)]),
  );
  // Semua kategori selalu tampil (0 kalau kosong) supaya bentuk responsnya stabil
  const perKategori = KATEGORI_PENGELUARAN.map((kategori) => ({
    kategori,
    total: perKategoriDb.get(kategori) ?? D(0),
  }));
  const totalPengeluaran = perKategori.reduce((jumlah, k) => jumlah.plus(k.total), D(0));
  return {
    pembelian: { jumlah: pembelian.jumlah, total: D(pembelian.total) },
    perKategori,
    totalPengeluaran,
    totalUangKeluar: hitungTotalUangKeluar(pembelian.total, totalPengeluaran),
  };
}
