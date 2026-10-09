const SEHARI_MS = 24 * 60 * 60 * 1000;

/** Format 'HH:mm' zero-padded bisa dibandingkan sebagai string. */
export const sudahLewatJamTutup = (jamTutup, jamSekarang) => jamSekarang >= jamTutup;

/** Pelanggan dengan servis terakhir <= tanggal ini perlu diingatkan. */
export const batasServisTerakhir = (sekarang, intervalHari) =>
  new Date(sekarang.getTime() - intervalHari * SEHARI_MS);
