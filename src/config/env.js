import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_HOURS: z.coerce.number().int().positive().default(12),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // z.coerce.boolean() mengubah string "false" menjadi true, jadi dibaca manual
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export const env = schema.parse(process.env);
