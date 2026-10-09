import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import * as ctrl from './dashboard.controller.js';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

dashboardRouter.get('/', authorize('dashboard:lihat'), ctrl.lihat);
