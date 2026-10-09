import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import * as ctrl from './log-aktivitas.controller.js';
import * as s from './log-aktivitas.schema.js';

export const logAktivitasRouter = Router();
logAktivitasRouter.use(authenticate);

logAktivitasRouter.get(
  '/',
  authorize('log-aktivitas:lihat'),
  validate({ query: s.listQuery }),
  ctrl.list,
);
