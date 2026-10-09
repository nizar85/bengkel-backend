import { describe, expect, it } from 'vitest';
import {
  bangunModelBerkas,
  formatRupiah,
  formatTanggal,
  namaBerkas,
} from './laporan.berkas.calc.js';

describe('formatRupiah', () => {
  it('memakai titik ribuan dan koma desimal gaya Indonesia', () => {
    expect(formatRupiah(1234567.5)).toBe('Rp 1.234.567,50');
  });

  it('selalu 2 desimal, juga untuk 0', () => {
    expect(formatRupiah(0)).toBe('Rp 0,00');
  });

  it('menaruh tanda minus di depan Rp untuk nilai negatif (laba kasar rugi)', () => {
    expect(formatRupiah(-50)).toBe('-Rp 50,00');
  });
});

describe('formatTanggal', () => {
  it("mengubah 'YYYY-MM-DD' menjadi 'DD/MM/YYYY'", () => {
    expect(formatTanggal('2026-10-05')).toBe('05/10/2026');
  });
});

describe('namaBerkas', () => {
  it('memuat jenis, rentang tanggal, dan ekstensi format', () => {
    expect(namaBerkas('pemasukan', '2026-10-05', '2026-10-12', 'xlsx')).toBe(
      'laporan-pemasukan_2026-10-05_2026-10-12.xlsx',
    );
  });

  it('memakai ekstensi pdf untuk format pdf', () => {
    expect(namaBerkas('laba-kasar', '2026-10-01', '2026-10-07', 'pdf')).toBe(
      'laporan-laba-kasar_2026-10-01_2026-10-07.pdf',
    );
  });
});

describe('bangunModelBerkas: pemasukan', () => {
  const dto = {
    dari: '2026-10-05',
    sampai: '2026-10-12',
    per: 'hari',
    periode: [
      {
        tanggal: '2026-10-05',
        jumlah_transaksi: 1,
        pemasukan_jasa: 30000,
        pemasukan_barang: 80000,
        pemasukan_total: 110000,
      },
    ],
    total: {
      jumlah_transaksi: 1,
      pemasukan_jasa: 30000,
      pemasukan_barang: 80000,
      pemasukan_total: 110000,
    },
  };

  it('memetakan baris harian apa adanya dengan kolom jasa vs barang terpisah', () => {
    const model = bangunModelBerkas('pemasukan', dto);

    expect(model.judul).toBe('Laporan Pemasukan Harian');
    expect(model.kolom.map((k) => k.kunci)).toEqual([
      'tanggal',
      'jumlah_transaksi',
      'pemasukan_jasa',
      'pemasukan_barang',
      'pemasukan_total',
    ]);
    expect(model.baris).toEqual(dto.periode);
  });

  it('menaruh total di baris penutup dengan label pada kolom pertama', () => {
    const model = bangunModelBerkas('pemasukan', dto);

    expect(model.totalBaris).toEqual([{ tanggal: 'Total', ...dto.total }]);
  });

  it('memakai kolom awal minggu untuk laporan mingguan', () => {
    const mingguan = {
      ...dto,
      per: 'minggu',
      periode: [{ awal_minggu: '2026-10-05', ...dto.total }],
    };
    const model = bangunModelBerkas('pemasukan', mingguan);

    expect(model.judul).toBe('Laporan Pemasukan Mingguan');
    expect(model.kolom[0]).toMatchObject({ kunci: 'awal_minggu', judul: 'Minggu Mulai' });
    expect(model.totalBaris[0].awal_minggu).toBe('Total');
  });

  it('menghasilkan baris kosong kalau tidak ada transaksi', () => {
    const model = bangunModelBerkas('pemasukan', { ...dto, periode: [] });

    expect(model.baris).toEqual([]);
  });
});

describe('bangunModelBerkas: uang-keluar', () => {
  const dto = {
    dari: '2026-10-05',
    sampai: '2026-10-12',
    pembelian: { jumlah_pembelian: 3, total: 450000 },
    pengeluaran: {
      total: 700000,
      per_kategori: [
        { kategori: 'listrik_air', total: 200000 },
        { kategori: 'sewa', total: 0 },
        { kategori: 'gaji', total: 500000 },
        { kategori: 'peralatan', total: 0 },
        { kategori: 'lainnya', total: 0 },
      ],
    },
    total_uang_keluar: 1150000,
  };

  it('memuat pembelian barang lalu tiap kategori pengeluaran dengan label yang terbaca', () => {
    const model = bangunModelBerkas('uang-keluar', dto);

    expect(model.baris[0]).toEqual({ uraian: 'Pembelian barang (3 pembelian)', jumlah: 450000 });
    expect(model.baris[1]).toEqual({ uraian: 'Pengeluaran: Listrik & Air', jumlah: 200000 });
    expect(model.baris).toHaveLength(6);
  });

  it('menutup dengan total pembelian, total pengeluaran, dan total uang keluar', () => {
    const model = bangunModelBerkas('uang-keluar', dto);

    expect(model.totalBaris).toEqual([
      { uraian: 'Total pembelian barang', jumlah: 450000 },
      { uraian: 'Total pengeluaran operasional', jumlah: 700000 },
      { uraian: 'Total uang keluar', jumlah: 1150000 },
    ]);
  });
});

describe('bangunModelBerkas: laba-kasar', () => {
  const dto = {
    dari: '2026-10-05',
    sampai: '2026-10-12',
    pendapatan: 525000,
    hpp: 240000,
    laba_kasar: 285000,
    total_pengeluaran: 700000,
    total_pembelian: 450000,
  };

  it('menampilkan pendapatan, HPP, dan laba kasar', () => {
    const model = bangunModelBerkas('laba-kasar', dto);

    expect(model.baris).toEqual([
      { uraian: 'Pendapatan (transaksi lunas)', jumlah: 525000 },
      { uraian: 'Harga beli barang terjual (HPP)', jumlah: 240000 },
      { uraian: 'Laba kasar', jumlah: 285000 },
    ]);
  });

  it('menampilkan pengeluaran dan pembelian sebagai pembanding, bukan pengurang laba kasar', () => {
    const model = bangunModelBerkas('laba-kasar', dto);

    expect(model.totalBaris.map((b) => b.jumlah)).toEqual([700000, 450000]);
    expect(model.catatan.join(' ')).toMatch(/tidak dikurangkan/);
  });
});

describe('bangunModelBerkas: barang-terlaris', () => {
  it('memberi nomor urut peringkat mulai dari 1', () => {
    const model = bangunModelBerkas('barang-terlaris', {
      dari: '2026-10-05',
      sampai: '2026-10-12',
      barang: [
        { barang_id: 7, nama: 'Barang A', total_qty: 6 },
        { barang_id: 8, nama: 'Barang B', total_qty: 3 },
      ],
    });

    expect(model.baris).toEqual([
      { no: 1, nama: 'Barang A', total_qty: 6 },
      { no: 2, nama: 'Barang B', total_qty: 3 },
    ]);
  });
});

describe('bangunModelBerkas: umum', () => {
  it('membawa rentang tanggal laporan ke model untuk dicetak di judul', () => {
    const model = bangunModelBerkas('barang-terlaris', {
      dari: '2026-10-05',
      sampai: '2026-10-12',
      barang: [],
    });

    expect(model).toMatchObject({ dari: '2026-10-05', sampai: '2026-10-12' });
  });

  it('menolak jenis laporan yang tidak dikenal', () => {
    expect(() => bangunModelBerkas('rahasia', {})).toThrow(RangeError);
  });
});
