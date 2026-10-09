import { createApp } from './app.js';
import { env } from './config/env.js';

createApp().listen(env.PORT, (err) => {
  // Express 5 mengirim error listen (mis. EADDRINUSE) lewat callback ini, bukan melempar
  if (err) throw err;
  console.log(`API berjalan di http://localhost:${env.PORT}/api/v1`);
});
