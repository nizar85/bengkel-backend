import { env } from '../../config/env.js';

export const NAMA_COOKIE = 'access_token';

export const opsiCookie = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: env.COOKIE_SECURE,
  maxAge: env.JWT_EXPIRES_HOURS * 60 * 60 * 1000,
  path: '/',
});
