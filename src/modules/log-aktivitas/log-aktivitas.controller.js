import { buatMeta } from '../../utils/pagination.js';
import { toLogAktivitasDTO } from './log-aktivitas.dto.js';
import * as service from './log-aktivitas.service.js';

export async function list(req, res) {
  const { page, limit } = req.valid.query;
  const { items, total } = await service.listLogAktivitas(req.valid.query);
  res.json({ data: items.map(toLogAktivitasDTO), meta: buatMeta({ page, limit, total }) });
}
