import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { idParam } from '../../utils/common-schemas.js';
import * as ctrl from './jasa.controller.js';
import * as s from './jasa.schema.js';

export const jasaRouter = Router();
jasaRouter.use(authenticate);

jasaRouter.get('/', authorize('jasa:lihat'), validate({ query: s.listQuery }), ctrl.list);
jasaRouter.post('/', authorize('jasa:kelola'), validate({ body: s.buatBody }), ctrl.buat);
jasaRouter.patch(
  '/:id',
  authorize('jasa:kelola'),
  validate({ params: idParam, body: s.ubahBody }),
  ctrl.ubah,
);
jasaRouter.patch(
  '/:id/status',
  authorize('jasa:kelola'),
  validate({ params: idParam, body: s.statusBody }),
  ctrl.ubahStatus,
);
