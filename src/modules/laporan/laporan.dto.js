import { uang } from '../../utils/uang.js';

export const toPemasukanDTO = (h) => ({
  dari: h.dari,
  sampai: h.sampai,
  per: h.per,
  periode: h.baris.map((b) => ({
    [h.per === 'minggu' ? 'awal_minggu' : 'tanggal']: b.periode,
    jumlah_transaksi: b.jumlah,
    pemasukan_jasa: uang(b.jasa),
    pemasukan_barang: uang(b.barang),
    pemasukan_total: uang(b.total),
  })),
  total: {
    jumlah_transaksi: h.ringkasan.jumlah,
    pemasukan_jasa: uang(h.ringkasan.jasa),
    pemasukan_barang: uang(h.ringkasan.barang),
    pemasukan_total: uang(h.ringkasan.total),
  },
});

export const toUangKeluarDTO = (h) => ({
  dari: h.dari,
  sampai: h.sampai,
  pembelian: { jumlah_pembelian: h.pembelian.jumlah, total: uang(h.pembelian.total) },
  pengeluaran: {
    total: uang(h.totalPengeluaran),
    per_kategori: h.perKategori.map((k) => ({ kategori: k.kategori, total: uang(k.total) })),
  },
  total_uang_keluar: uang(h.totalUangKeluar),
});

export const toLabaKasarDTO = (h) => ({
  dari: h.dari,
  sampai: h.sampai,
  pendapatan: uang(h.pendapatan),
  hpp: uang(h.hpp),
  laba_kasar: uang(h.labaKasar),
  total_pengeluaran: uang(h.totalPengeluaran),
  total_pembelian: uang(h.totalPembelian),
});

export const toBarangTerlarisDTO = (h) => ({
  dari: h.dari,
  sampai: h.sampai,
  barang: h.baris.map((b) => ({ barang_id: b.barangId, nama: b.nama, total_qty: b.totalQty })),
});
