import { boleh } from '../constants/permissions.js';
import { AppError } from '../utils/app-error.js';

export const authorize = (izin) => (req, _res, next) => {
  if (!boleh(req.user.role, izin)) throw AppError.aksesDitolak();
  next();
};
