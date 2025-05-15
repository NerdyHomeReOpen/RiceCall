// Config
import { serverConfig } from '@/config';

// Utils
import Logger from '@/utils/logger';

// HTTP Server
import HttpServer from '@/api/http';

// Socket Server
import SocketServer from '@/api/socket';

// Database
import Database from '@/database';

// Systems
import xpSystem from '@/systems/xp';
import imageSystem from '@/systems/image';

// Setup HTTP Server
export const httpServer = new HttpServer(serverConfig.port).setup();

// Setup Socket Server
export const socketServer = new SocketServer(httpServer).setup();

// Setup Database
export const database = new Database();

// Setup Systems
xpSystem.setup();
imageSystem.setup();

// Error Handling
process.on('uncaughtException', (error: any) => {
  new Logger('Server').error(`Uncaught exception: ${error.message}`);
});

process.on('unhandledRejection', (error: any) => {
  new Logger('Server').error(`Unhandled rejection: ${error.message}`);
});
