import { describe, expect, it } from 'vitest';
import { batasServisTerakhir, sudahLewatJamTutup } from './reminder.calc.js';

describe('sudahLewatJamTutup', () => {
  it('true tepat di jam tutup', () => {
    expect(sudahLewatJamTutup('17:00', '17:00')).toBe(true);
  });

  it('false sebelum jam tutup', () => {
    expect(sudahLewatJamTutup('17:00', '16:59')).toBe(false);
  });

  it('true sesudah jam tutup', () => {
    expect(sudahLewatJamTutup('17:00', '17:01')).toBe(true);
  });

  it('membandingkan jam dengan benar walau digit pertamanya lebih besar (09:30 vs 17:00)', () => {
    expect(sudahLewatJamTutup('17:00', '09:30')).toBe(false);
  });

  it('false di tengah malam, saat hari baru dimulai', () => {
    expect(sudahLewatJamTutup('17:00', '00:05')).toBe(false);
  });
});

describe('batasServisTerakhir', () => {
  it('mundur 60 hari dari sekarang', () => {
    const batas = batasServisTerakhir(new Date('2026-10-06T10:00:00Z'), 60);

    expect(batas.toISOString()).toBe('2026-08-07T10:00:00.000Z');
  });

  it('mundur 1 hari', () => {
    const batas = batasServisTerakhir(new Date('2026-10-06T10:00:00Z'), 1);

    expect(batas.toISOString()).toBe('2026-10-05T10:00:00.000Z');
  });

  it('mundur melewati pergantian tahun', () => {
    const batas = batasServisTerakhir(new Date('2027-01-10T00:00:00Z'), 30);

    expect(batas.toISOString()).toBe('2026-12-11T00:00:00.000Z');
  });

  it('tidak mengubah tanggal yang diberikan', () => {
    const sekarang = new Date('2026-10-06T10:00:00Z');
    batasServisTerakhir(sekarang, 60);

    expect(sekarang.toISOString()).toBe('2026-10-06T10:00:00.000Z');
  });
});
