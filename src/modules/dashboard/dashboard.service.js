import { ROLE } from '../../constants/roles.js';
import { prisma } from '../../lib/prisma.js';
import { jamMenitWIB, rentangHariWIB, tanggalWIB } from '../../utils/waktu.js';
import { daftarStokMenipis } from '../barang/barang.service.js';
import { ambilPengaturan } from '../pengaturan/pengaturan.service.js';
import { daftarBelumBayar, ringkasanHariIni } from '../transaksi/transaksi.service.js';
import { batasServisTerakhir, sudahLewatJamTutup } from './reminder.calc.js';

const BATAS_DAFTAR = 50;

// Reminder dihitung saat dashboard diminta, tidak disimpan di tabel, supaya selalu sesuai data
// terbaru (misalnya stok yang sudah direstock langsung hilang dari alert).
export function ambilDashboard(user) {
  if (user.role === ROLE.ADMIN) return dashboardAdmin();
  if (user.role === ROLE.KASIR) return dashboardKasir();
  return dashboardMekanik(user);
}

async function dashboardAdmin() {
  const ringkasan = await ringkasanHariIni(rentangHariWIB(tanggalWIB()));
  const [stokMenipis, umum] = await Promise.all([
    daftarStokMenipis(),
    reminderUmum(ringkasan.jumlah),
  ]);
  return { ringkasan, reminder: { stokMenipis, ...umum } };
}

async function dashboardKasir() {
  const ringkasan = await ringkasanHariIni(rentangHariWIB(tanggalWIB()));
  const [belumBayar, umum] = await Promise.all([
    daftarBelumBayar({ limit: BATAS_DAFTAR }),
    reminderUmum(ringkasan.jumlah),
  ]);
  return { ringkasan, belumBayar, reminder: umum };
}

async function dashboardMekanik(user) {
  const transaksiSaya = await daftarBelumBayar({ mekanikId: user.id, limit: BATAS_DAFTAR });
  return { transaksiSaya };
}

/** RMD-2 dan RMD-3: reminder yang sama untuk Admin dan Kasir. */
async function reminderUmum(jumlahTransaksiHariIni) {
  const pengaturan = await ambilPengaturan();
  return {
    belumAdaTransaksi:
      sudahLewatJamTutup(pengaturan.jam_tutup, jamMenitWIB()) && jumlahTransaksiHariIni === 0,
    servisBerkala: await daftarServisBerkala(pengaturan.interval_servis_hari),
  };
}

// Modul ini read model: query lintas pelanggan dan transaksi yang hanya membaca (bagian 10.2).
// Pelanggan yang sudah ditandai "sudah dihubungi" hilang dari daftar sampai ia servis lagi (ada
// transaksi lunas yang lebih baru dari penandaan itu) dan intervalnya lewat lagi.
async function daftarServisBerkala(intervalHari) {
  const batas = batasServisTerakhir(new Date(), intervalHari);
  // MySQL hanya mengizinkan HAVING memakai kolom yang ada di SELECT, jadi terakhir_dihubungi_at
  // ikut dipilih walau tidak dikirim ke client
  return prisma.$queryRaw`
    SELECT p.id, p.nama, p.no_hp, p.tipe_motor, p.no_polisi, p.terakhir_dihubungi_at,
           MAX(t.dibayar_at) AS servis_terakhir
    FROM pelanggan p
    JOIN transaksi_servis t ON t.pelanggan_id = p.id AND t.status_bayar = 'lunas'
    GROUP BY p.id
    HAVING MAX(t.dibayar_at) <= ${batas}
       AND (p.terakhir_dihubungi_at IS NULL OR p.terakhir_dihubungi_at < MAX(t.dibayar_at))
    ORDER BY servis_terakhir ASC
    LIMIT ${BATAS_DAFTAR}`;
}
