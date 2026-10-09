import { ROLE } from '../../constants/roles.js';
import { D, uang } from '../../utils/uang.js';

export function toBarangDTO(b, role) {
  const dto = {
    id: b.id,
    nama: b.nama,
    kategori: b.kategori,
    satuan: b.satuan,
    harga_jual: uang(b.harga_jual),
    stok: b.stok,
    stok_minimum: b.stok_minimum,
    stok_menipis: b.stok < b.stok_minimum,
    lokasi_rak: b.lokasi_rak,
    kompatibilitas_motor: b.kompatibilitas_motor,
    tipe: b.tipe,
    aktif: b.aktif,
  };
  // Harga beli adalah data biaya; matriks hak akses PRD membatasinya ke Admin saja
  if (role === ROLE.ADMIN) {
    dto.harga_beli_rata_rata = uang(b.harga_beli_rata_rata);
    dto.margin = uang(D(b.harga_jual).minus(D(b.harga_beli_rata_rata)));
  }
  return dto;
}
