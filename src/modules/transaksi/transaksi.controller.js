import { buatMeta } from '../../utils/pagination.js';
import { toTransaksiDTO, toTransaksiRingkasDTO } from './transaksi.dto.js';
import * as service from './transaksi.service.js';

export async function list(req, res) {
  const { page, limit } = req.valid.query;
  const { items, total } = await service.listTransaksi(req.valid.query, req.user);
  res.json({ data: items.map(toTransaksiRingkasDTO), meta: buatMeta({ page, limit, total }) });
}

export async function detail(req, res) {
  const transaksi = await service.ambilTransaksi(req.valid.params.id, req.user);
  res.json({ data: toTransaksiDTO(transaksi, req.user.role) });
}

export async function buat(req, res) {
  const transaksi = await service.buatTransaksi(req.valid.body, req.user);
  res.status(201).json({ data: toTransaksiDTO(transaksi, req.user.role) });
}

export async function ubah(req, res) {
  const transaksi = await service.ubahTransaksi(req.valid.params.id, req.valid.body, req.user);
  res.json({ data: toTransaksiDTO(transaksi, req.user.role) });
}

export async function tambahJasa(req, res) {
  const transaksi = await service.tambahJasa(req.valid.params.id, req.valid.body, req.user);
  res.status(201).json({ data: toTransaksiDTO(transaksi, req.user.role) });
}

// Hapus baris mengubah total, jadi responsnya transaksi terbaru (bukan 204): frontend tidak
// menghitung angka final sendiri
export async function hapusJasa(req, res) {
  const { id, detailId } = req.valid.params;
  const transaksi = await service.hapusJasa(id, detailId, req.user);
  res.json({ data: toTransaksiDTO(transaksi, req.user.role) });
}

export async function tambahBarang(req, res) {
  const transaksi = await service.tambahSparepart(req.valid.params.id, req.valid.body, req.user);
  res.status(201).json({ data: toTransaksiDTO(transaksi, req.user.role) });
}

export async function hapusBarang(req, res) {
  const { id, detailId } = req.valid.params;
  const transaksi = await service.hapusSparepart(id, detailId, req.user);
  res.json({ data: toTransaksiDTO(transaksi, req.user.role) });
}

export async function bayar(req, res) {
  const transaksi = await service.bayar(req.valid.params.id, req.valid.body, req.user);
  res.json({ data: toTransaksiDTO(transaksi, req.user.role) });
}
