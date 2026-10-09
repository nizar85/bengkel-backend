import * as service from './pengaturan.service.js';

export async function lihat(_req, res) {
  res.json({ data: await service.ambilPengaturan() });
}

export async function ubah(req, res) {
  res.json({ data: await service.ubahPengaturan(req.valid.body, req.user) });
}
