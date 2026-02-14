/**
 * @description Server entrypoint wiring transports and services.
 */
import { createHttpServer } from './transports/httpServer';
import { createWsServer } from './transports/wsServer';
import { InMemorySessionService } from './services/sessionService';

const port = Number(process.env.PORT ?? 3001);
const server = createHttpServer();
const sessionService = new InMemorySessionService();

createWsServer({ server, sessionService });

server.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
