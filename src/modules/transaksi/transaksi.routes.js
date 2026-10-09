import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { idParam } from '../../utils/common-schemas.js';
import * as ctrl from './transaksi.controller.js';
import * as s from './transaksi.schema.js';

export const transaksiRouter = Router();
transaksiRouter.use(authenticate);

transaksiRouter.get('/', authorize('transaksi:lihat'), validate({ query: s.listQuery }), ctrl.list);
transaksiRouter.post('/', authorize('transaksi:kelola'), validate({ body: s.buatBody }), ctrl.buat);
transaksiRouter.get(
  '/:id',
  authorize('transaksi:lihat'),
  validate({ params: idParam }),
  ctrl.detail,
);
transaksiRouter.patch(
  '/:id',
  authorize('transaksi:kelola'),
  validate({ params: idParam, body: s.ubahBody }),
  ctrl.ubah,
);

transaksiRouter.post(
  '/:id/jasa',
  authorize('transaksi:kelola'),
  validate({ params: idParam, body: s.tambahJasaBody }),
  ctrl.tambahJasa,
);
transaksiRouter.delete(
  '/:id/jasa/:detailId',
  authorize('transaksi:kelola'),
  validate({ params: s.detailParams }),
  ctrl.hapusJasa,
);

// Mekanik sengaja tidak punya izin ini: ia menyampaikan kebutuhan part ke Kasir, Kasir yang mencatat
transaksiRouter.post(
  '/:id/barang',
  authorize('transaksi:sparepart'),
  validate({ params: idParam, body: s.tambahBarangBody }),
  ctrl.tambahBarang,
);
transaksiRouter.delete(
  '/:id/barang/:detailId',
  authorize('transaksi:sparepart'),
  validate({ params: s.detailParams }),
  ctrl.hapusBarang,
);

transaksiRouter.post(
  '/:id/bayar',
  authorize('transaksi:bayar'),
  validate({ params: idParam, body: s.bayarBody }),
  ctrl.bayar,
);
