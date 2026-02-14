import express from 'express';
import http from 'http';

export function createHttpServer(): http.Server {
  const app = express();

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return http.createServer(app);
}
