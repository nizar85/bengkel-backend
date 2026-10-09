import { toJasaDTO } from './jasa.dto.js';
import * as service from './jasa.service.js';

export async function list(req, res) {
  const jasa = await service.listJasa(req.valid.query, req.user.role);
  res.json({ data: jasa.map(toJasaDTO) });
}

export async function buat(req, res) {
  const jasa = await service.buatJasa(req.valid.body, req.user);
  res.status(201).json({ data: toJasaDTO(jasa) });
}

export async function ubah(req, res) {
  const jasa = await service.ubahJasa(req.valid.params.id, req.valid.body, req.user);
  res.json({ data: toJasaDTO(jasa) });
}

export async function ubahStatus(req, res) {
  const jasa = await service.ubahStatusJasa(req.valid.params.id, req.valid.body.aktif, req.user);
  res.json({ data: toJasaDTO(jasa) });
}
