import { describe, expect, it } from 'vitest';
import { D, bulat2, uang } from './uang.js';

describe('D', () => {
  it('menganggap null dan undefined sebagai 0', () => {
    expect(D(null).toString()).toBe('0');
    expect(D(undefined).toString()).toBe('0');
  });

  it('menjumlah desimal tanpa galat floating point', () => {
    expect(D('0.1').plus(D('0.2')).toString()).toBe('0.3');
  });
});

describe('bulat2', () => {
  it.each([
    { kasus: 'setengah dibulatkan ke atas (half-up)', nilai: '1.005', hasil: '1.01' },
    { kasus: 'half-up pada 2.675 yang di float jatuh ke 2.67', nilai: '2.675', hasil: '2.68' },
    { kasus: 'di bawah setengah dibulatkan ke bawah', nilai: '1.004', hasil: '1.00' },
    { kasus: 'selalu 2 desimal', nilai: '1234.5', hasil: '1234.50' },
  ])('$kasus', ({ nilai, hasil }) => {
    expect(bulat2(nilai).toFixed(2)).toBe(hasil);
  });
});

describe('uang', () => {
  it('mengubah Decimal menjadi Number', () => {
    expect(uang(D('12500.50'))).toBe(12500.5);
  });

  it('mempertahankan 0 (bukan null), baik Decimal maupun angka mentah', () => {
    expect(uang(D(0))).toBe(0);
    expect(uang(0)).toBe(0);
  });

  it('mengembalikan null untuk null dan undefined', () => {
    expect(uang(null)).toBeNull();
    expect(uang(undefined)).toBeNull();
  });
});
