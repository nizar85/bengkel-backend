import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import * as ctrl from './pembelian.controller.js';
import * as s from './pembelian.schema.js';

export const pembelianRouter = Router();
pembelianRouter.use(authenticate);

// Sengaja tanpa PATCH/DELETE: pembelian tidak bisa diedit, koreksi lewat penyesuaian stok
pembelianRouter.post(
  '/',
  authorize('pembelian:kelola'),
  validate({ body: s.buatBody }),
  ctrl.restock,
);
pembelianRouter.get(
  '/',
  authorize('pembelian:kelola'),
  validate({ query: s.listQuery }),
  ctrl.list,
);
