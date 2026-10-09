import {
  toBarangTerlarisDTO,
  toLabaKasarDTO,
  toPemasukanDTO,
  toUangKeluarDTO,
} from './laporan.dto.js';
import { buatBerkas } from './laporan.berkas.js';
import * as service from './laporan.service.js';

export async function pemasukan(req, res) {
  res.json({ data: toPemasukanDTO(await service.pemasukan(req.valid.query)) });
}

export async function uangKeluar(req, res) {
  res.json({ data: toUangKeluarDTO(await service.uangKeluar(req.valid.query)) });
}

export async function labaKasar(req, res) {
  res.json({ data: toLabaKasarDTO(await service.labaKasar(req.valid.query)) });
}

export async function barangTerlaris(req, res) {
  res.json({ data: toBarangTerlarisDTO(await service.barangTerlaris(req.valid.query)) });
}

export async function ekspor(req, res) {
  const berkas = await buatBerkas(req.valid.query);
  res.setHeader('Content-Type', berkas.tipe);
  res.setHeader('Content-Disposition', `attachment; filename="${berkas.nama}"`);
  res.send(berkas.buffer);
}
