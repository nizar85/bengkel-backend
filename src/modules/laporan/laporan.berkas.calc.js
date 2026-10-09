import { LABEL_KATEGORI_PENGELUARAN } from '../../constants/enums.js';

const formatAngkaUang = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 1234567.5 → 'Rp 1.234.567,50'; negatif → '-Rp 50,00'. */
export const formatRupiah = (nilai) =>
  `${nilai < 0 ? '-' : ''}Rp ${formatAngkaUang.format(Math.abs(nilai))}`;

/** 'YYYY-MM-DD' → 'DD/MM/YYYY'. */
export const formatTanggal = (tanggal) => tanggal.split('-').reverse().join('/');

export const namaBerkas = (jenis, dari, sampai, format) =>
  `laporan-${jenis}_${dari}_${sampai}.${format}`;

const KOLOM_URAIAN_JUMLAH = [
  { kunci: 'uraian', judul: 'Uraian', tipe: 'teks' },
  { kunci: 'jumlah', judul: 'Jumlah', tipe: 'uang' },
];

function modelPemasukan(dto) {
  const mingguan = dto.per === 'minggu';
  const kunciPeriode = mingguan ? 'awal_minggu' : 'tanggal';
  return {
    judul: mingguan ? 'Laporan Pemasukan Mingguan' : 'Laporan Pemasukan Harian',
    kolom: [
      { kunci: kunciPeriode, judul: mingguan ? 'Minggu Mulai' : 'Tanggal', tipe: 'tanggal' },
      { kunci: 'jumlah_transaksi', judul: 'Jumlah Transaksi', tipe: 'angka' },
      { kunci: 'pemasukan_jasa', judul: 'Pemasukan Jasa', tipe: 'uang' },
      { kunci: 'pemasukan_barang', judul: 'Pemasukan Barang', tipe: 'uang' },
      { kunci: 'pemasukan_total', judul: 'Pemasukan Total', tipe: 'uang' },
    ],
    baris: dto.periode,
    totalBaris: [{ [kunciPeriode]: 'Total', ...dto.total }],
  };
}

function modelUangKeluar(dto) {
  return {
    judul: 'Laporan Uang Keluar',
    kolom: KOLOM_URAIAN_JUMLAH,
    baris: [
      {
        uraian: `Pembelian barang (${dto.pembelian.jumlah_pembelian} pembelian)`,
        jumlah: dto.pembelian.total,
      },
      ...dto.pengeluaran.per_kategori.map((k) => ({
        uraian: `Pengeluaran: ${LABEL_KATEGORI_PENGELUARAN[k.kategori]}`,
        jumlah: k.total,
      })),
    ],
    totalBaris: [
      { uraian: 'Total pembelian barang', jumlah: dto.pembelian.total },
      { uraian: 'Total pengeluaran operasional', jumlah: dto.pengeluaran.total },
      { uraian: 'Total uang keluar', jumlah: dto.total_uang_keluar },
    ],
  };
}

function modelLabaKasar(dto) {
  return {
    judul: 'Laporan Laba Kasar',
    kolom: KOLOM_URAIAN_JUMLAH,
    baris: [
      { uraian: 'Pendapatan (transaksi lunas)', jumlah: dto.pendapatan },
      { uraian: 'Harga beli barang terjual (HPP)', jumlah: dto.hpp },
      { uraian: 'Laba kasar', jumlah: dto.laba_kasar },
    ],
    totalBaris: [
      { uraian: 'Total pengeluaran operasional (pembanding)', jumlah: dto.total_pengeluaran },
      { uraian: 'Total pembelian barang (pembanding)', jumlah: dto.total_pembelian },
    ],
    catatan: [
      'Pengeluaran operasional dan pembelian barang ditampilkan sebagai pembanding dan tidak dikurangkan dari laba kasar.',
    ],
  };
}

function modelBarangTerlaris(dto) {
  return {
    judul: 'Laporan Barang Terlaris',
    kolom: [
      { kunci: 'no', judul: 'No', tipe: 'angka', bobot: 0.5 },
      { kunci: 'nama', judul: 'Barang', tipe: 'teks' },
      { kunci: 'total_qty', judul: 'Jumlah Terjual', tipe: 'angka' },
    ],
    baris: dto.barang.map((b, i) => ({ no: i + 1, nama: b.nama, total_qty: b.total_qty })),
  };
}

const PEMBENTUK_MODEL = {
  pemasukan: modelPemasukan,
  'uang-keluar': modelUangKeluar,
  'laba-kasar': modelLabaKasar,
  'barang-terlaris': modelBarangTerlaris,
};

/**
 * Tabel netral yang dipakai bersama oleh berkas xlsx dan pdf, dibentuk dari DTO endpoint laporan
 * yang sama (FIN-8: isi berkas = data laporan, tanpa query baru).
 */
export function bangunModelBerkas(jenis, dto) {
  if (!Object.hasOwn(PEMBENTUK_MODEL, jenis)) {
    throw new RangeError(`Jenis laporan tidak dikenal: ${jenis}`);
  }
  return {
    dari: dto.dari,
    sampai: dto.sampai,
    totalBaris: [],
    catatan: [],
    ...PEMBENTUK_MODEL[jenis](dto),
  };
}
