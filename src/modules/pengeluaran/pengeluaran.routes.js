import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { idParam } from '../../utils/common-schemas.js';
import * as ctrl from './pengeluaran.controller.js';
import * as s from './pengeluaran.schema.js';

export const pengeluaranRouter = Router();
pengeluaranRouter.use(authenticate, authorize('pengeluaran:kelola'));

pengeluaranRouter.get('/', validate({ query: s.listQuery }), ctrl.list);
pengeluaranRouter.post('/', validate({ body: s.buatBody }), ctrl.buat);
pengeluaranRouter.patch('/:id', validate({ params: idParam, body: s.ubahBody }), ctrl.ubah);
pengeluaranRouter.delete('/:id', validate({ params: idParam }), ctrl.hapus);
