import http from 'http';
import dotenv from 'dotenv';
import { app } from './app.js';
import { initSockets } from './sockets.js';

dotenv.config();

async function startServer() {
  const server = http.createServer(app);
  const PORT = process.env.PORT || 5001;

  initSockets(server);

  server.listen(PORT, () => {
    console.log(`[StaffSync Backend] Server successfully running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[StaffSync Backend] Failed to start server:', err);
  process.exit(1);
});
