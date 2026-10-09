import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export function signToken({ id, role }) {
  return jwt.sign({ sub: String(id), role }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: `${env.JWT_EXPIRES_HOURS}h`,
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    throw AppError.tidakTerautentikasi();
  }
}
