import { describe, expect, it } from 'vitest';
import { IZIN, boleh } from './permissions.js';
import { ROLE } from './roles.js';

const izinHanyaAdmin = [
  'pengguna:kelola',
  'barang:kelola',
  'jasa:kelola',
  'pembelian:kelola',
  'pengeluaran:kelola',
  'laporan:lihat',
  'log-aktivitas:lihat',
  'pengaturan:kelola',
];

describe('boleh', () => {
  it('menolak kasir untuk restock', () => {
    expect(boleh(ROLE.KASIR, 'pembelian:kelola')).toBe(false);
  });

  it('mengizinkan kasir membuat transaksi, mencatat sparepart, dan menerima bayar', () => {
    expect(boleh(ROLE.KASIR, 'transaksi:kelola')).toBe(true);
    expect(boleh(ROLE.KASIR, 'transaksi:sparepart')).toBe(true);
    expect(boleh(ROLE.KASIR, 'transaksi:bayar')).toBe(true);
  });

  it.each(izinHanyaAdmin)('menolak kasir untuk %s', (izin) => {
    expect(boleh(ROLE.KASIR, izin)).toBe(false);
  });

  it.each(['transaksi:kelola', 'transaksi:sparepart', 'transaksi:bayar'])(
    'menolak mekanik untuk %s',
    (izin) => {
      expect(boleh(ROLE.MEKANIK, izin)).toBe(false);
    },
  );

  it('membatasi mekanik hanya pada dashboard, stok, dan transaksi miliknya (read-only)', () => {
    const izinMekanik = Object.keys(IZIN).filter((izin) => boleh(ROLE.MEKANIK, izin));

    expect(izinMekanik.sort()).toEqual(['barang:lihat', 'dashboard:lihat', 'transaksi:lihat']);
  });

  it('mengizinkan admin untuk semua izin', () => {
    const izinDitolakAdmin = Object.keys(IZIN).filter((izin) => !boleh(ROLE.ADMIN, izin));

    expect(izinDitolakAdmin).toEqual([]);
  });

  it('menolak izin yang tidak dikenal, termasuk untuk admin', () => {
    expect(boleh(ROLE.ADMIN, 'izin:tidak-ada')).toBe(false);
  });

  it('menolak role yang tidak dikenal', () => {
    expect(boleh('tamu', 'dashboard:lihat')).toBe(false);
  });
});
