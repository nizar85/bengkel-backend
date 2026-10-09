import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import * as ctrl from './pengaturan.controller.js';
import * as s from './pengaturan.schema.js';

export const pengaturanRouter = Router();
pengaturanRouter.use(authenticate, authorize('pengaturan:kelola'));

pengaturanRouter.get('/', ctrl.lihat);
pengaturanRouter.patch('/', validate({ body: s.ubahBody }), ctrl.ubah);
