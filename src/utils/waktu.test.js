import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  adalahTanggalValid,
  dariKolomDate,
  filterTanggalKolom,
  filterWaktuWIB,
  jamMenitWIB,
  keKolomDate,
  rentangHariWIB,
  rentangTanggalWIB,
  tambahHari,
  tanggalWIB,
} from './waktu.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('tanggalWIB', () => {
  it.each([
    {
      kasus: 'siang hari UTC tetap di tanggal yang sama',
      utc: '2026-10-01T03:15:00Z',
      wib: '2026-10-01',
    },
    {
      kasus: '1 ms sebelum tengah malam WIB masih hari itu',
      utc: '2026-10-01T16:59:59.999Z',
      wib: '2026-10-01',
    },
    {
      kasus: 'tepat tengah malam WIB sudah hari berikutnya',
      utc: '2026-10-01T17:00:00.000Z',
      wib: '2026-10-02',
    },
    {
      kasus: '18:00 UTC sudah besok di WIB',
      utc: '2026-10-01T18:00:00Z',
      wib: '2026-10-02',
    },
    {
      kasus: 'melewati pergantian tahun',
      utc: '2026-12-31T20:00:00Z',
      wib: '2027-01-01',
    },
  ])('$kasus', ({ utc, wib }) => {
    expect(tanggalWIB(new Date(utc))).toBe(wib);
  });

  it('memakai waktu sekarang kalau tanpa argumen', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T18:00:00Z'));

    expect(tanggalWIB()).toBe('2026-10-02');
  });
});

describe('jamMenitWIB', () => {
  it.each([
    { kasus: 'menambah 7 jam dari UTC', utc: '2026-10-01T03:15:00Z', wib: '10:15' },
    { kasus: 'memberi nol di depan jam dan menit', utc: '2026-10-01T17:05:00Z', wib: '00:05' },
    { kasus: 'melewati pergantian hari', utc: '2026-10-01T23:59:00Z', wib: '06:59' },
  ])('$kasus', ({ utc, wib }) => {
    expect(jamMenitWIB(new Date(utc))).toBe(wib);
  });

  it('memakai waktu sekarang kalau tanpa argumen', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T10:30:00Z'));

    expect(jamMenitWIB()).toBe('17:30');
  });
});

describe('rentangHariWIB', () => {
  it.each([
    {
      kasus: 'hari biasa dimulai 17:00 UTC hari sebelumnya',
      tanggal: '2026-10-01',
      awal: '2026-09-30T17:00:00.000Z',
      akhir: '2026-10-01T17:00:00.000Z',
    },
    {
      kasus: 'melewati pergantian tahun',
      tanggal: '2026-01-01',
      awal: '2025-12-31T17:00:00.000Z',
      akhir: '2026-01-01T17:00:00.000Z',
    },
    {
      kasus: 'awal Maret (Februari 2026 hanya 28 hari)',
      tanggal: '2026-03-01',
      awal: '2026-02-28T17:00:00.000Z',
      akhir: '2026-03-01T17:00:00.000Z',
    },
  ])('$kasus', ({ tanggal, awal, akhir }) => {
    const rentang = rentangHariWIB(tanggal);

    expect(rentang.awal.toISOString()).toBe(awal);
    expect(rentang.akhir.toISOString()).toBe(akhir);
  });
});

describe('rentangTanggalWIB', () => {
  it('mencakup seluruh hari "sampai" (inklusif)', () => {
    const rentang = rentangTanggalWIB('2026-10-01', '2026-10-03');

    expect(rentang.awal.toISOString()).toBe('2026-09-30T17:00:00.000Z');
    expect(rentang.akhir.toISOString()).toBe('2026-10-03T17:00:00.000Z');
  });

  it('sama dengan satu hari penuh kalau dari dan sampai di tanggal yang sama', () => {
    const rentang = rentangTanggalWIB('2026-10-01', '2026-10-01');

    expect(rentang.awal.toISOString()).toBe('2026-09-30T17:00:00.000Z');
    expect(rentang.akhir.toISOString()).toBe('2026-10-01T17:00:00.000Z');
  });
});

describe('keKolomDate', () => {
  it('menghasilkan tengah malam UTC supaya kolom DATE tidak bergeser hari', () => {
    expect(keKolomDate('2026-10-01').toISOString()).toBe('2026-10-01T00:00:00.000Z');
  });
});

describe('adalahTanggalValid', () => {
  it.each(['2026-10-01', '2026-02-28', '2028-02-29', '2026-12-31'])('menerima %s', (tanggal) => {
    expect(adalahTanggalValid(tanggal)).toBe(true);
  });

  it.each([
    { kasus: '29 Februari di tahun biasa', tanggal: '2026-02-29' },
    { kasus: 'tanggal 31 di bulan 30 hari', tanggal: '2026-04-31' },
    { kasus: 'bulan 13', tanggal: '2026-13-01' },
    { kasus: 'bulan 0', tanggal: '2026-00-10' },
    { kasus: 'hari 0', tanggal: '2026-10-00' },
    { kasus: 'tanpa nol di depan', tanggal: '2026-1-1' },
    { kasus: 'teks biasa', tanggal: 'bukan-tanggal' },
    { kasus: 'string kosong', tanggal: '' },
    { kasus: 'angka, bukan string', tanggal: 20261001 },
    { kasus: 'undefined', tanggal: undefined },
  ])('menolak $kasus', ({ tanggal }) => {
    expect(adalahTanggalValid(tanggal)).toBe(false);
  });
});

describe('dariKolomDate', () => {
  it('mengubah Date kolom DATE (tengah malam UTC) menjadi YYYY-MM-DD', () => {
    expect(dariKolomDate(new Date('2026-10-01T00:00:00.000Z'))).toBe('2026-10-01');
  });

  it('kebalikan keKolomDate di pergantian tahun', () => {
    expect(dariKolomDate(keKolomDate('2026-12-31'))).toBe('2026-12-31');
  });
});

describe('tambahHari', () => {
  it.each([
    { kasus: 'mundur 6 hari', tanggal: '2026-10-07', jumlah: -6, hasil: '2026-10-01' },
    { kasus: 'mundur melewati awal bulan', tanggal: '2026-03-01', jumlah: -1, hasil: '2026-02-28' },
    {
      kasus: 'maju melewati pergantian tahun',
      tanggal: '2026-12-31',
      jumlah: 1,
      hasil: '2027-01-01',
    },
    {
      kasus: 'nol hari tidak mengubah apa pun',
      tanggal: '2026-10-01',
      jumlah: 0,
      hasil: '2026-10-01',
    },
  ])('$kasus', ({ tanggal, jumlah, hasil }) => {
    expect(tambahHari(tanggal, jumlah)).toBe(hasil);
  });
});

describe('filterWaktuWIB', () => {
  it('mengembalikan undefined kalau dari dan sampai kosong', () => {
    expect(filterWaktuWIB()).toBeUndefined();
  });

  it('hanya memberi batas bawah kalau hanya dari yang diisi', () => {
    const filter = filterWaktuWIB('2026-10-01');

    expect(filter.gte.toISOString()).toBe('2026-09-30T17:00:00.000Z');
    expect(filter).not.toHaveProperty('lt');
  });

  it('hanya memberi batas atas (eksklusif) kalau hanya sampai yang diisi', () => {
    const filter = filterWaktuWIB(undefined, '2026-10-01');

    expect(filter.lt.toISOString()).toBe('2026-10-01T17:00:00.000Z');
    expect(filter).not.toHaveProperty('gte');
  });

  it('mencakup seluruh hari "sampai" kalau keduanya diisi', () => {
    const filter = filterWaktuWIB('2026-10-01', '2026-10-03');

    expect(filter.gte.toISOString()).toBe('2026-09-30T17:00:00.000Z');
    expect(filter.lt.toISOString()).toBe('2026-10-03T17:00:00.000Z');
  });
});

describe('filterTanggalKolom', () => {
  it('mengembalikan undefined kalau dari dan sampai kosong', () => {
    expect(filterTanggalKolom()).toBeUndefined();
  });

  it('inklusif di kedua ujung untuk kolom DATE', () => {
    const filter = filterTanggalKolom('2026-10-01', '2026-10-03');

    expect(filter.gte.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(filter.lte.toISOString()).toBe('2026-10-03T00:00:00.000Z');
  });

  it('hanya memberi satu sisi kalau hanya salah satu yang diisi', () => {
    expect(filterTanggalKolom('2026-10-01')).not.toHaveProperty('lte');
    expect(filterTanggalKolom(undefined, '2026-10-03')).not.toHaveProperty('gte');
  });
});
