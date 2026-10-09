import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { batasLogin } from '../../middlewares/rate-limit.js';
import { validate } from '../../middlewares/validate.js';
import * as ctrl from './auth.controller.js';
import * as s from './auth.schema.js';

export const authRouter = Router();

authRouter.post('/login', batasLogin, validate({ body: s.loginBody }), ctrl.login);
authRouter.post('/logout', authenticate, ctrl.logout);
authRouter.get('/me', authenticate, ctrl.me);
