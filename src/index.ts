import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// HTTP Server
import HttpServer from '@/api/http';

// Socket Server
import SocketServer from '@/api/socket';

// HTTP Server
const httpServer = new HttpServer(4500).setup();

// Socket Server
const socketServer = new SocketServer(httpServer).setup();

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
