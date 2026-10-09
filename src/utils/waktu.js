// WIB = UTC+7 tanpa daylight saving, jadi cukup offset tetap.
// Database menyimpan UTC; semua konsep "hari ini" dihitung dalam WIB.
const OFFSET_WIB_MS = 7 * 60 * 60 * 1000;
const SEHARI_MS = 24 * 60 * 60 * 1000;

/** 'YYYY-MM-DD' menurut WIB. */
export function tanggalWIB(date = new Date()) {
  return new Date(date.getTime() + OFFSET_WIB_MS).toISOString().slice(0, 10);
}

/** 'HH:mm' menurut WIB. */
export function jamMenitWIB(date = new Date()) {
  return new Date(date.getTime() + OFFSET_WIB_MS).toISOString().slice(11, 16);
}

/** Rentang [awal, akhir) satu hari WIB, dalam Date UTC (untuk kolom DATETIME). */
export function rentangHariWIB(tanggal) {
  const awal = new Date(Date.parse(`${tanggal}T00:00:00Z`) - OFFSET_WIB_MS);
  return { awal, akhir: new Date(awal.getTime() + SEHARI_MS) };
}

/** Rentang [awal, akhir) dari tanggal 'dari' s.d. 'sampai' (inklusif), WIB. */
export function rentangTanggalWIB(dari, sampai) {
  return { awal: rentangHariWIB(dari).awal, akhir: rentangHariWIB(sampai).akhir };
}

/** 'YYYY-MM-DD' → Date untuk kolom DATE (pembelian.tanggal, pengeluaran.tanggal). */
export const keKolomDate = (tanggal) => new Date(`${tanggal}T00:00:00Z`);

/** Date dari kolom DATE → 'YYYY-MM-DD'. Kebalikan keKolomDate. */
export const dariKolomDate = (date) => date.toISOString().slice(0, 10);

/** True kalau berformat 'YYYY-MM-DD' dan tanggal itu benar-benar ada di kalender. */
export function adalahTanggalValid(tanggal) {
  if (typeof tanggal !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return false;
  const date = keKolomDate(tanggal);
  // Mesin JS bisa meluapkan tanggal yang tak ada (31 Feb → 3 Mar), jadi hasilnya harus kembali sama
  return !Number.isNaN(date.getTime()) && dariKolomDate(date) === tanggal;
}

/** Geser 'YYYY-MM-DD' sejumlah hari (boleh negatif). */
export function tambahHari(tanggal, jumlahHari) {
  return dariKolomDate(new Date(keKolomDate(tanggal).getTime() + jumlahHari * SEHARI_MS));
}

/** Filter kolom DATETIME untuk Prisma ({ gte, lt }) dari rentang tanggal WIB inklusif. */
export function filterWaktuWIB(dari, sampai) {
  if (!dari && !sampai) return undefined;
  return {
    ...(dari && { gte: rentangHariWIB(dari).awal }),
    ...(sampai && { lt: rentangHariWIB(sampai).akhir }),
  };
}

/** Filter kolom DATE untuk Prisma ({ gte, lte }) dari rentang tanggal inklusif. */
export function filterTanggalKolom(dari, sampai) {
  if (!dari && !sampai) return undefined;
  return {
    ...(dari && { gte: keKolomDate(dari) }),
    ...(sampai && { lte: keKolomDate(sampai) }),
  };
}
