import { buatMeta } from '../../utils/pagination.js';
import { toPembelianDTO, toRestockDTO } from './pembelian.dto.js';
import * as service from './pembelian.service.js';

export async function restock(req, res) {
  const hasil = await service.restock(req.valid.body, req.user);
  res.status(201).json({ data: toRestockDTO(hasil) });
}

export async function list(req, res) {
  const { page, limit } = req.valid.query;
  const { items, total } = await service.listPembelian(req.valid.query);
  res.json({ data: items.map(toPembelianDTO), meta: buatMeta({ page, limit, total }) });
}
