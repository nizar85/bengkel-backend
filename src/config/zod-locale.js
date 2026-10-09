import { z } from 'zod';

// Pesan validasi yang sampai ke user harus berbahasa Indonesia (agent.md 3.2)
z.config(z.locales.id());
