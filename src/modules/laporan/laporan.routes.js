import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import * as ctrl from './laporan.controller.js';
import * as s from './laporan.schema.js';

export const laporanRouter = Router();
// Laporan keuangan hanya untuk Admin (data paling sensitif di matriks hak akses)
laporanRouter.use(authenticate, authorize('laporan:lihat'));

laporanRouter.get('/pemasukan', validate({ query: s.pemasukanQuery }), ctrl.pemasukan);
laporanRouter.get('/uang-keluar', validate({ query: s.rentangQuery }), ctrl.uangKeluar);
laporanRouter.get('/laba-kasar', validate({ query: s.rentangQuery }), ctrl.labaKasar);
laporanRouter.get('/barang-terlaris', validate({ query: s.terlarisQuery }), ctrl.barangTerlaris);
laporanRouter.get('/export', validate({ query: s.eksporQuery }), ctrl.ekspor);
