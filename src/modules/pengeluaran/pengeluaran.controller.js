import { buatMeta } from '../../utils/pagination.js';
import { toPengeluaranDTO } from './pengeluaran.dto.js';
import * as service from './pengeluaran.service.js';

export async function list(req, res) {
  const { page, limit } = req.valid.query;
  const { items, total } = await service.listPengeluaran(req.valid.query);
  res.json({ data: items.map(toPengeluaranDTO), meta: buatMeta({ page, limit, total }) });
}

export async function buat(req, res) {
  const pengeluaran = await service.buatPengeluaran(req.valid.body, req.user);
  res.status(201).json({ data: toPengeluaranDTO(pengeluaran) });
}

export async function ubah(req, res) {
  const pengeluaran = await service.ubahPengeluaran(req.valid.params.id, req.valid.body, req.user);
  res.json({ data: toPengeluaranDTO(pengeluaran) });
}

export async function hapus(req, res) {
  await service.hapusPengeluaran(req.valid.params.id, req.user);
  res.status(204).end();
}
