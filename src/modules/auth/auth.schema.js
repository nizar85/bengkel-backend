import { z } from 'zod';

export const loginBody = z.object({
  username: z.string().trim().min(1).max(50),
  password: z.string().min(1).max(72),
});
