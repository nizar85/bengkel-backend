import { uang } from '../../utils/uang.js';

const toStokMenipisDTO = (b) => ({
  id: b.id,
  nama: b.nama,
  stok: b.stok,
  stok_minimum: b.stok_minimum,
  lokasi_rak: b.lokasi_rak,
});

const toServisBerkalaDTO = (r) => ({
  id: Number(r.id),
  nama: r.nama,
  no_hp: r.no_hp,
  tipe_motor: r.tipe_motor,
  no_polisi: r.no_polisi,
  servis_terakhir: r.servis_terakhir,
});

const toBelumBayarDTO = (t) => ({
  id: t.id,
  kode: t.kode,
  keluhan: t.keluhan,
  total: uang(t.total),
  pelanggan: {
    id: t.pelanggan.id,
    nama: t.pelanggan.nama,
    no_polisi: t.pelanggan.no_polisi,
    tipe_motor: t.pelanggan.tipe_motor,
  },
  mekanik: { id: t.mekanik.id, nama: t.mekanik.nama },
  created_at: t.created_at,
});

// Pemasukan hanya ada di dashboard Admin: laporan keuangan tidak boleh sampai ke role lain
export const toDashboardAdminDTO = (d) => ({
  ringkasan_hari_ini: {
    jumlah_transaksi: d.ringkasan.jumlah,
    belum_bayar: d.ringkasan.belumBayar,
    pemasukan_jasa: uang(d.ringkasan.pemasukan.jasa),
    pemasukan_barang: uang(d.ringkasan.pemasukan.barang),
    pemasukan_total: uang(d.ringkasan.pemasukan.total),
  },
  reminder: {
    stok_menipis: d.reminder.stokMenipis.map(toStokMenipisDTO),
    belum_ada_transaksi: d.reminder.belumAdaTransaksi,
    servis_berkala: d.reminder.servisBerkala.map(toServisBerkalaDTO),
  },
});

export const toDashboardKasirDTO = (d) => ({
  ringkasan_hari_ini: { jumlah_transaksi: d.ringkasan.jumlah, belum_bayar: d.ringkasan.belumBayar },
  transaksi_belum_bayar: d.belumBayar.map(toBelumBayarDTO),
  reminder: {
    belum_ada_transaksi: d.reminder.belumAdaTransaksi,
    servis_berkala: d.reminder.servisBerkala.map(toServisBerkalaDTO),
  },
});

export const toDashboardMekanikDTO = (d) => ({
  transaksi_saya: d.transaksiSaya.map(toBelumBayarDTO),
});
