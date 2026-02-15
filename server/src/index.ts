/**
 * @description Server entrypoint wiring transports and services.
 */
import { createHttpServer } from './transports/httpServer';
import { createWsServer } from './transports/wsServer';
import { InMemorySessionService } from './services/sessionService';
import { FileSessionPersistenceService } from './services/sessionPersistenceService';

const port = Number(process.env.PORT ?? 3001);
const server = createHttpServer();
const sessionStateFile = process.env.SESSION_STATE_FILE?.trim();
const persistence = sessionStateFile
  ? new FileSessionPersistenceService(sessionStateFile)
  : null;
const sessionService = new InMemorySessionService(undefined, undefined, persistence);

createWsServer({ server, sessionService });

server.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
