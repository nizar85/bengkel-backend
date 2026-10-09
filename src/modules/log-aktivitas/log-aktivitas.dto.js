export const toLogAktivitasDTO = (log) => ({
  id: log.id,
  pengguna: { id: log.pengguna.id, nama: log.pengguna.nama },
  aksi: log.aksi,
  entitas: log.entitas,
  entitas_id: log.entitas_id,
  keterangan: log.keterangan,
  created_at: log.created_at,
});
