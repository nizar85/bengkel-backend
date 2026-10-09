import { describe, expect, it } from 'vitest';
import { potong } from './teks.js';

describe('potong', () => {
  it('memotong teks yang melebihi batas', () => {
    expect(potong('a'.repeat(300), 10)).toBe('a'.repeat(10));
  });

  it('membiarkan teks yang masih muat', () => {
    expect(potong('Dipakai di TRX-20261001-001', 255)).toBe('Dipakai di TRX-20261001-001');
  });

  it('mengubah null dan undefined menjadi null', () => {
    expect(potong(null)).toBeNull();
    expect(potong(undefined)).toBeNull();
  });

  it('memakai batas 255 (VARCHAR(255) di stok_log dan log_aktivitas) kalau batas tidak diberikan', () => {
    expect(potong('b'.repeat(300))).toHaveLength(255);
  });
});
