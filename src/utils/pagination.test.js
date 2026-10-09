import { describe, expect, it } from 'vitest';
import { buatMeta, hitungOffset } from './pagination.js';

describe('hitungOffset', () => {
  it('memulai halaman 1 dari baris pertama', () => {
    expect(hitungOffset({ page: 1, limit: 20 })).toEqual({ skip: 0, take: 20 });
  });

  it('melompati semua baris halaman sebelumnya', () => {
    expect(hitungOffset({ page: 3, limit: 20 })).toEqual({ skip: 40, take: 20 });
  });

  it('memakai limit sebagai ukuran halaman', () => {
    expect(hitungOffset({ page: 2, limit: 5 })).toEqual({ skip: 5, take: 5 });
  });
});

describe('buatMeta', () => {
  it('menormalkan total BigInt dari raw query menjadi Number', () => {
    expect(buatMeta({ page: 1, limit: 20, total: 7n })).toEqual({ page: 1, limit: 20, total: 7 });
  });
});
