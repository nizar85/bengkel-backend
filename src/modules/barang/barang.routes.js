import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { idParam, paginasiQuery } from '../../utils/common-schemas.js';
import * as ctrl from './barang.controller.js';
import * as s from './barang.schema.js';

export const barangRouter = Router();
barangRouter.use(authenticate);

// Path statis harus sebelum /:id
barangRouter.get('/kategori', authorize('barang:lihat'), ctrl.kategori);

barangRouter.get('/', authorize('barang:lihat'), validate({ query: s.listQuery }), ctrl.list);
barangRouter.post('/', authorize('barang:kelola'), validate({ body: s.buatBody }), ctrl.buat);
barangRouter.get('/:id', authorize('barang:lihat'), validate({ params: idParam }), ctrl.detail);
barangRouter.patch(
  '/:id',
  authorize('barang:kelola'),
  validate({ params: idParam, body: s.ubahBody }),
  ctrl.ubah,
);
barangRouter.patch(
  '/:id/status',
  authorize('barang:kelola'),
  validate({ params: idParam, body: s.statusBody }),
  ctrl.ubahStatus,
);
barangRouter.post(
  '/:id/penyesuaian-stok',
  authorize('barang:kelola'),
  validate({ params: idParam, body: s.penyesuaianBody }),
  ctrl.penyesuaianStok,
);
barangRouter.get(
  '/:id/stok-log',
  authorize('barang:kelola'),
  validate({ params: idParam, query: s.stokLogQuery }),
  ctrl.stokLog,
);
barangRouter.get(
  '/:id/pembelian',
  authorize('pembelian:kelola'),
  validate({ params: idParam, query: paginasiQuery }),
  ctrl.riwayatPembelian,
);
