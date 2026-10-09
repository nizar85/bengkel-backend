export const toPelangganDTO = (p) => ({
  id: p.id,
  nama: p.nama,
  no_hp: p.no_hp,
  no_polisi: p.no_polisi,
  tipe_motor: p.tipe_motor,
  terakhir_dihubungi_at: p.terakhir_dihubungi_at,
  created_at: p.created_at,
  updated_at: p.updated_at,
});
