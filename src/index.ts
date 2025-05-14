// Config
import { serverConfig } from '@/config';

// Error
import StandardizedError from '@/error';

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
  if (!(error instanceof StandardizedError)) {
    error = new StandardizedError({
      name: 'ServerError',
      message: `未處理的例外: ${error.message}`,
      part: 'SERVER',
      tag: 'UNCAUGHT_EXCEPTION',
      statusCode: 500,
    });
  }
  new Logger('Server').error(error.message);
});

process.on('unhandledRejection', (error: any) => {
  if (!(error instanceof StandardizedError)) {
    error = new StandardizedError({
      message: `未處理的拒絕: ${error.message}`,
      name: 'ServerError',
      part: 'SERVER',
      tag: 'UNHANDLED_REJECTION',
      statusCode: 500,
    });
  }
  new Logger('Server').error(error.message);
});
