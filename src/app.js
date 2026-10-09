import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import './config/zod-locale.js';
import { apiRouter } from './routes.js';
import { notFound } from './middlewares/not-found.js';
import { errorHandler } from './middlewares/error-handler.js';

export function createApp() {
  const app = express();

  // Prisma mengembalikan id BIGINT sebagai BigInt yang tidak bisa di-JSON-kan.
  // Diubah ke Number di sini (aman: id tidak akan melewati 2^53).
  app.set('json replacer', (_key, value) => (typeof value === 'bigint' ? Number(value) : value));

  app.use(helmet());
  // Content-Disposition harus diekspos supaya frontend lintas-origin bisa membaca nama berkas export
  app.use(
    cors({ origin: env.CORS_ORIGIN, credentials: true, exposedHeaders: ['Content-Disposition'] }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  if (env.NODE_ENV === 'development') app.use(morgan('dev'));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/v1', apiRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
