import { buatMeta } from '../../utils/pagination.js';
import { toMekanikDTO, toPenggunaDTO } from './pengguna.dto.js';
import * as service from './pengguna.service.js';

export async function daftarMekanik(_req, res) {
  const mekanik = await service.daftarMekanik();
  res.json({ data: mekanik.map(toMekanikDTO) });
}

export async function list(req, res) {
  const { page, limit } = req.valid.query;
  const { items, total } = await service.listPengguna(req.valid.query);
  res.json({ data: items.map(toPenggunaDTO), meta: buatMeta({ page, limit, total }) });
}

export async function buat(req, res) {
  const pengguna = await service.buatPengguna(req.valid.body, req.user);
  res.status(201).json({ data: toPenggunaDTO(pengguna) });
}

export async function ubah(req, res) {
  const pengguna = await service.ubahPengguna(req.valid.params.id, req.valid.body, req.user);
  res.json({ data: toPenggunaDTO(pengguna) });
}

export async function ubahStatus(req, res) {
  const { aktif } = req.valid.body;
  const pengguna = await service.ubahStatus(req.valid.params.id, aktif, req.user);
  res.json({ data: toPenggunaDTO(pengguna) });
}

export async function resetPassword(req, res) {
  await service.resetPassword(req.valid.params.id, req.valid.body.password_baru, req.user);
  res.status(204).end();
}
