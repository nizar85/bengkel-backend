import { describe, expect, it } from 'vitest';
import {
  bisaDilunasi,
  buatKodeTransaksi,
  hitungSubtotalBarang,
  hitungSubtotalJasa,
} from './transaksi.calc.js';

describe('hitungSubtotalJasa', () => {
  it('mengembalikan 0 untuk daftar kosong', () => {
    expect(hitungSubtotalJasa([]).toFixed(2)).toBe('0.00');
  });

  it('menjumlahkan harga semua baris jasa', () => {
    const jasa = [{ harga: '25000.00' }, { harga: 75000 }];

    expect(hitungSubtotalJasa(jasa).toFixed(2)).toBe('100000.00');
  });

  it('menjumlah desimal tanpa galat floating point', () => {
    expect(hitungSubtotalJasa([{ harga: '0.1' }, { harga: '0.2' }]).toString()).toBe('0.3');
  });
});

describe('hitungSubtotalBarang', () => {
  it('mengembalikan 0 untuk daftar kosong', () => {
    expect(hitungSubtotalBarang([]).toFixed(2)).toBe('0.00');
  });

  it('mengalikan harga jual dengan qty lalu menjumlahkannya', () => {
    // 2 × 65.000 + 3 × 25.000,50 = 130.000 + 75.001,50
    const barang = [
      { qty: 2, harga_jual: '65000.00' },
      { qty: 3, harga_jual: '25000.50' },
    ];

    expect(hitungSubtotalBarang(barang).toFixed(2)).toBe('205001.50');
  });

  it('memakai harga jual snapshot di baris, bukan harga master', () => {
    const barang = [{ qty: 1, harga_jual: '40000.00', harga_master: '99999.00' }];

    expect(hitungSubtotalBarang(barang).toFixed(2)).toBe('40000.00');
  });
});

describe('buatKodeTransaksi', () => {
  it.each([
    { kasus: 'urutan pertama diberi nol di depan', urutan: 1, kode: 'TRX-20261001-001' },
    { kasus: 'urutan dua digit', urutan: 12, kode: 'TRX-20261001-012' },
    { kasus: 'urutan tiga digit', urutan: 123, kode: 'TRX-20261001-123' },
    { kasus: 'urutan empat digit tidak dipotong', urutan: 1000, kode: 'TRX-20261001-1000' },
  ])('$kasus', ({ urutan, kode }) => {
    expect(buatKodeTransaksi('2026-10-01', urutan)).toBe(kode);
  });

  it('membuang tanda hubung dari tanggal', () => {
    expect(buatKodeTransaksi('2027-01-09', 5)).toBe('TRX-20270109-005');
  });
});

describe('bisaDilunasi', () => {
  it('menolak transaksi tanpa jasa dan tanpa barang', () => {
    expect(bisaDilunasi({ jumlahJasa: 0, jumlahBarang: 0 })).toBe(false);
  });

  it('menerima transaksi yang hanya punya jasa', () => {
    expect(bisaDilunasi({ jumlahJasa: 1, jumlahBarang: 0 })).toBe(true);
  });

  it('menerima transaksi yang hanya punya barang (servis ganti part saja)', () => {
    expect(bisaDilunasi({ jumlahJasa: 0, jumlahBarang: 2 })).toBe(true);
  });
});
