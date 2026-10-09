import { describe, expect, it } from 'vitest';
import { hitungLabaKasar, hitungTotalUangKeluar, tentukanRentangLaporan } from './laporan.calc.js';

describe('tentukanRentangLaporan', () => {
  it('memakai 7 hari terakhir sampai hari ini kalau dari dan sampai kosong', () => {
    expect(tentukanRentangLaporan({}, '2026-10-07')).toEqual({
      dari: '2026-10-01',
      sampai: '2026-10-07',
    });
  });

  it('melewati pergantian bulan dan tahun', () => {
    expect(tentukanRentangLaporan({}, '2027-01-03')).toEqual({
      dari: '2026-12-28',
      sampai: '2027-01-03',
    });
  });

  it('memakai rentang yang diberikan apa adanya', () => {
    const rentang = { dari: '2026-09-01', sampai: '2026-09-30' };

    expect(tentukanRentangLaporan(rentang, '2026-10-07')).toEqual(rentang);
  });

  it('kalau hanya dari yang diisi, sampai = hari ini', () => {
    expect(tentukanRentangLaporan({ dari: '2026-10-02' }, '2026-10-07')).toEqual({
      dari: '2026-10-02',
      sampai: '2026-10-07',
    });
  });

  it('kalau hanya sampai yang diisi, dari = 6 hari sebelumnya (total 7 hari)', () => {
    expect(tentukanRentangLaporan({ sampai: '2026-10-03' }, '2026-10-07')).toEqual({
      dari: '2026-09-27',
      sampai: '2026-10-03',
    });
  });
});

describe('hitungLabaKasar', () => {
  it('pendapatan dikurangi harga beli barang terjual', () => {
    expect(hitungLabaKasar(525000, 240000).toFixed(2)).toBe('285000.00');
  });

  it('bisa negatif kalau modal barang melebihi pendapatan', () => {
    expect(hitungLabaKasar(100, 150).toFixed(2)).toBe('-50.00');
  });

  it('0 kalau tidak ada transaksi', () => {
    expect(hitungLabaKasar(0, 0).toFixed(2)).toBe('0.00');
  });

  it('menerima string desimal dari database tanpa galat pembulatan', () => {
    expect(hitungLabaKasar('1000.10', '400.05').toFixed(2)).toBe('600.05');
  });
});

describe('hitungTotalUangKeluar', () => {
  it('menjumlahkan pembelian barang dan pengeluaran operasional', () => {
    expect(hitungTotalUangKeluar(450000, 700000).toFixed(2)).toBe('1150000.00');
  });

  it('tetap benar kalau salah satunya 0', () => {
    expect(hitungTotalUangKeluar('0.00', '125.50').toFixed(2)).toBe('125.50');
  });
});
