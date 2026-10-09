import { toProfilDTO } from '../pengguna/pengguna.dto.js';
import { NAMA_COOKIE, opsiCookie } from './auth.cookie.js';
import * as service from './auth.service.js';

export async function login(req, res) {
  const { token, pengguna } = await service.login(req.valid.body);
  res.cookie(NAMA_COOKIE, token, opsiCookie());
  res.json({ data: toProfilDTO(pengguna) });
}

export function logout(_req, res) {
  res.clearCookie(NAMA_COOKIE, { ...opsiCookie(), maxAge: undefined });
  res.status(204).end();
}

export async function me(req, res) {
  const pengguna = await service.profilSaya(req.user.id);
  res.json({ data: toProfilDTO(pengguna) });
}
