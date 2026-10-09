import { buatMeta } from '../../utils/pagination.js';
import { toTransaksiRingkasDTO } from '../transaksi/transaksi.dto.js';
import { listTransaksiPelanggan } from '../transaksi/transaksi.service.js';
import { toPelangganDTO } from './pelanggan.dto.js';
import * as service from './pelanggan.service.js';

export async function list(req, res) {
  const { page, limit } = req.valid.query;
  const { items, total } = await service.listPelanggan(req.valid.query);
  res.json({ data: items.map(toPelangganDTO), meta: buatMeta({ page, limit, total }) });
}

export async function detail(req, res) {
  const pelanggan = await service.ambilPelanggan(req.valid.params.id);
  res.json({ data: toPelangganDTO(pelanggan) });
}

export async function buat(req, res) {
  const pelanggan = await service.buatPelanggan(req.valid.body, req.user);
  res.status(201).json({ data: toPelangganDTO(pelanggan) });
}

export async function ubah(req, res) {
  const pelanggan = await service.ubahPelanggan(req.valid.params.id, req.valid.body, req.user);
  res.json({ data: toPelangganDTO(pelanggan) });
}

export async function sudahDihubungi(req, res) {
  const pelanggan = await service.tandaiSudahDihubungi(req.valid.params.id, req.user);
  res.json({ data: toPelangganDTO(pelanggan) });
}

export async function riwayatTransaksi(req, res) {
  const { id } = req.valid.params;
  const { page, limit } = req.valid.query;
  await service.ambilPelanggan(id);
  const { items, total } = await listTransaksiPelanggan(id, { page, limit });
  res.json({ data: items.map(toTransaksiRingkasDTO), meta: buatMeta({ page, limit, total }) });
}
