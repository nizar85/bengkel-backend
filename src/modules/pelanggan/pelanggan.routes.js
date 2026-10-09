import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { idParam, paginasiQuery } from '../../utils/common-schemas.js';
import * as ctrl from './pelanggan.controller.js';
import * as s from './pelanggan.schema.js';

export const pelangganRouter = Router();
pelangganRouter.use(authenticate);

pelangganRouter.get(
  '/',
  authorize('pelanggan:kelola'),
  validate({ query: s.listQuery }),
  ctrl.list,
);
pelangganRouter.post('/', authorize('pelanggan:kelola'), validate({ body: s.buatBody }), ctrl.buat);
pelangganRouter.get(
  '/:id',
  authorize('pelanggan:kelola'),
  validate({ params: idParam }),
  ctrl.detail,
);
pelangganRouter.patch(
  '/:id',
  authorize('pelanggan:kelola'),
  validate({ params: idParam, body: s.ubahBody }),
  ctrl.ubah,
);
pelangganRouter.post(
  '/:id/sudah-dihubungi',
  authorize('pelanggan:kelola'),
  validate({ params: idParam }),
  ctrl.sudahDihubungi,
);
pelangganRouter.get(
  '/:id/transaksi',
  authorize('pelanggan:kelola'),
  validate({ params: idParam, query: paginasiQuery }),
  ctrl.riwayatTransaksi,
);
