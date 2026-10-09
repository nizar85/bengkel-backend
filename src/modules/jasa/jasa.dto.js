import { uang } from '../../utils/uang.js';

export const toJasaDTO = (j) => ({
  id: j.id,
  nama: j.nama,
  harga: uang(j.harga),
  aktif: j.aktif,
});
