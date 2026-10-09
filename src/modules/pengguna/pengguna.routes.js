import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { idParam } from '../../utils/common-schemas.js';
import * as ctrl from './pengguna.controller.js';
import * as s from './pengguna.schema.js';

export const penggunaRouter = Router();
penggunaRouter.use(authenticate);

// Path statis harus sebelum /:id
penggunaRouter.get('/mekanik', authorize('pengguna:lihat-mekanik'), ctrl.daftarMekanik);

penggunaRouter.get('/', authorize('pengguna:kelola'), validate({ query: s.listQuery }), ctrl.list);
penggunaRouter.post('/', authorize('pengguna:kelola'), validate({ body: s.buatBody }), ctrl.buat);
penggunaRouter.patch(
  '/:id',
  authorize('pengguna:kelola'),
  validate({ params: idParam, body: s.ubahBody }),
  ctrl.ubah,
);
penggunaRouter.patch(
  '/:id/status',
  authorize('pengguna:kelola'),
  validate({ params: idParam, body: s.statusBody }),
  ctrl.ubahStatus,
);
penggunaRouter.post(
  '/:id/reset-password',
  authorize('pengguna:kelola'),
  validate({ params: idParam, body: s.resetPasswordBody }),
  ctrl.resetPassword,
);
