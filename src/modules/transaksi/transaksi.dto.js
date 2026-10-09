import { ROLE } from '../../constants/roles.js';
import { D, uang } from '../../utils/uang.js';

const orang = (p) => (p ? { id: p.id, nama: p.nama } : null);

export function toTransaksiDTO(t, role) {
  const admin = role === ROLE.ADMIN;
  const mekanik = role === ROLE.MEKANIK;
  return {
    id: t.id,
    kode: t.kode,
    status_bayar: t.status_bayar,
    metode_bayar: t.metode_bayar,
    dibayar_at: t.dibayar_at,
    keluhan: t.keluhan,
    subtotal_jasa: uang(t.subtotal_jasa),
    subtotal_barang: uang(t.subtotal_barang),
    total: uang(t.total),
    pelanggan: {
      id: t.pelanggan.id,
      nama: t.pelanggan.nama,
      // Mekanik hanya perlu mengenali motornya; nomor HP pelanggan bukan urusannya
      ...(!mekanik && { no_hp: t.pelanggan.no_hp }),
      no_polisi: t.pelanggan.no_polisi,
      tipe_motor: t.pelanggan.tipe_motor,
    },
    mekanik: orang(t.mekanik),
    dibuat_oleh: orang(t.dibuat_oleh),
    dibayar_oleh: orang(t.dibayar_oleh),
    detail_jasa: t.detail_jasa.map((d) => ({
      id: d.id,
      jasa_id: d.jasa_id,
      nama: d.jasa.nama,
      harga: uang(d.harga),
    })),
    detail_barang: t.detail_barang.map((d) => ({
      id: d.id,
      barang_id: d.barang_id,
      nama: d.barang.nama,
      satuan: d.barang.satuan,
      lokasi_rak: d.barang.lokasi_rak,
      qty: d.qty,
      harga_jual: uang(d.harga_jual),
      subtotal: uang(D(d.harga_jual).mul(d.qty)),
      // Harga beli adalah data biaya; hanya Admin yang boleh melihatnya
      ...(admin && { harga_beli: uang(d.harga_beli) }),
    })),
    created_at: t.created_at,
    updated_at: t.updated_at,
  };
}

/** Baris untuk daftar transaksi: tanpa rincian jasa/barang. */
export const toTransaksiRingkasDTO = (t) => ({
  id: t.id,
  kode: t.kode,
  status_bayar: t.status_bayar,
  metode_bayar: t.metode_bayar,
  total: uang(t.total),
  pelanggan: {
    id: t.pelanggan.id,
    nama: t.pelanggan.nama,
    no_polisi: t.pelanggan.no_polisi,
    tipe_motor: t.pelanggan.tipe_motor,
  },
  mekanik: orang(t.mekanik),
  dibayar_at: t.dibayar_at,
  created_at: t.created_at,
});
