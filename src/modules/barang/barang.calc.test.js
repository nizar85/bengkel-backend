import { describe, expect, it } from 'vitest';
import { hitungHargaPerPcs, hitungRataRataTertimbang } from './barang.calc.js';

describe('hitungHargaPerPcs', () => {
  it('membagi total harga dengan jumlah', () => {
    expect(hitungHargaPerPcs(250000, 10).toFixed(2)).toBe('25000.00');
  });

  it('membulatkan ke 2 desimal', () => {
    expect(hitungHargaPerPcs(10000, 3).toFixed(2)).toBe('3333.33');
  });

  it('membulatkan setengah ke atas (half-up)', () => {
    expect(hitungHargaPerPcs('1.01', 2).toFixed(2)).toBe('0.51');
  });

  it.each([
    { kasus: 'jumlah 0', jumlah: 0 },
    { kasus: 'jumlah negatif', jumlah: -2 },
    { kasus: 'jumlah pecahan', jumlah: 2.5 },
  ])('menolak $kasus', ({ jumlah }) => {
    expect(() => hitungHargaPerPcs(10000, jumlah)).toThrow(RangeError);
  });
});

describe('hitungRataRataTertimbang', () => {
  it('memakai harga batch baru kalau stok lama 0', () => {
    const hasil = hitungRataRataTertimbang({
      stokLama: 0,
      hargaLama: 0,
      jumlahBaru: 10,
      totalHargaBaru: 250000,
    });

    expect(hasil.toFixed(2)).toBe('25000.00');
  });

  it('menimbang nilai stok lama dan batch baru', () => {
    // (10 × 20.000 + 300.000) / 20 = 25.000
    const hasil = hitungRataRataTertimbang({
      stokLama: 10,
      hargaLama: 20000,
      jumlahBaru: 10,
      totalHargaBaru: 300000,
    });

    expect(hasil.toFixed(2)).toBe('25000.00');
  });

  it('memakai total harga batch baru apa adanya, bukan harga per pcs yang sudah dibulatkan', () => {
    // (20 × 27.500 + 10.000) / 23 = 560.000 / 23 = 24.347,826… → 24.347,83
    const hasil = hitungRataRataTertimbang({
      stokLama: 20,
      hargaLama: 27500,
      jumlahBaru: 3,
      totalHargaBaru: 10000,
    });

    expect(hasil.toFixed(2)).toBe('24347.83');
  });

  it('membulatkan setengah ke atas (half-up) di 2 desimal', () => {
    // (1 × 0,01 + 0,02) / 2 = 0,015 → 0,02
    const hasil = hitungRataRataTertimbang({
      stokLama: 1,
      hargaLama: '0.01',
      jumlahBaru: 1,
      totalHargaBaru: '0.02',
    });

    expect(hasil.toFixed(2)).toBe('0.02');
  });

  it('menerima harga lama berupa string desimal (nilai dari database)', () => {
    // (4 × 1.500,50 + 2.000) / 5 = 8.002 / 5 = 1.600,40
    const hasil = hitungRataRataTertimbang({
      stokLama: 4,
      hargaLama: '1500.50',
      jumlahBaru: 1,
      totalHargaBaru: '2000.00',
    });

    expect(hasil.toFixed(2)).toBe('1600.40');
  });

  it('menolak jumlah baru 0', () => {
    expect(() =>
      hitungRataRataTertimbang({ stokLama: 0, hargaLama: 0, jumlahBaru: 0, totalHargaBaru: 1000 }),
    ).toThrow(RangeError);
  });
});
