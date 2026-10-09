/** Potong teks supaya muat di kolom VARCHAR; null/undefined menjadi null. */
export const potong = (teks, maks = 255) => (teks == null ? null : String(teks).slice(0, maks));
