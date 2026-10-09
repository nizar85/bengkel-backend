import { KATEGORI_BARANG } from '../../constants/enums.js';
import { buatMeta } from '../../utils/pagination.js';
import { toPembelianDTO } from '../pembelian/pembelian.dto.js';
import { listPembelian } from '../pembelian/pembelian.service.js';
import { listStokLogBarang } from '../stok-log/stok-log.service.js';
import { toStokLogDTO } from '../stok-log/stok-log.dto.js';
import { toBarangDTO } from './barang.dto.js';
import * as service from './barang.service.js';

export function kategori(_req, res) {
  res.json({ data: KATEGORI_BARANG });
}

export async function list(req, res) {
  const { page, limit } = req.valid.query;
  const { role } = req.user;
  const { items, total } = await service.listBarang(req.valid.query, role);
  res.json({
    data: items.map((b) => toBarangDTO(b, role)),
    meta: buatMeta({ page, limit, total }),
  });
}

export async function detail(req, res) {
  const barang = await service.ambilBarang(req.valid.params.id, req.user.role);
  res.json({ data: toBarangDTO(barang, req.user.role) });
}

export async function buat(req, res) {
  const barang = await service.buatBarang(req.valid.body, req.user);
  res.status(201).json({ data: toBarangDTO(barang, req.user.role) });
}

export async function ubah(req, res) {
  const barang = await service.ubahBarang(req.valid.params.id, req.valid.body, req.user);
  res.json({ data: toBarangDTO(barang, req.user.role) });
}

export async function ubahStatus(req, res) {
  const { aktif } = req.valid.body;
  const barang = await service.ubahStatusBarang(req.valid.params.id, aktif, req.user);
  res.json({ data: toBarangDTO(barang, req.user.role) });
}

export async function penyesuaianStok(req, res) {
  const barang = await service.sesuaikanStok(req.valid.params.id, req.valid.body, req.user);
  res.status(201).json({ data: toBarangDTO(barang, req.user.role) });
}

export async function stokLog(req, res) {
  const { id } = req.valid.params;
  const { page, limit } = req.valid.query;
  await service.pastikanBarangAda(id);
  const { items, total } = await listStokLogBarang(id, req.valid.query);
  res.json({ data: items.map(toStokLogDTO), meta: buatMeta({ page, limit, total }) });
}

export async function riwayatPembelian(req, res) {
  const { id } = req.valid.params;
  const { page, limit } = req.valid.query;
  await service.pastikanBarangAda(id);
  const { items, total } = await listPembelian({ barang_id: id, page, limit });
  res.json({ data: items.map(toPembelianDTO), meta: buatMeta({ page, limit, total }) });
}
