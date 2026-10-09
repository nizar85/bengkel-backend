// Daftar field ditulis eksplisit supaya password_hash tidak mungkin ikut keluar
export const toPenggunaDTO = (p) => ({
  id: p.id,
  nama: p.nama,
  username: p.username,
  role: p.role,
  no_hp: p.no_hp,
  aktif: p.aktif,
  created_at: p.created_at,
  updated_at: p.updated_at,
});

export const toProfilDTO = (p) => ({ id: p.id, nama: p.nama, username: p.username, role: p.role });

export const toMekanikDTO = (p) => ({ id: p.id, nama: p.nama, role: p.role });
