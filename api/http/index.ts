import http, { ServerResponse } from 'http';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Handlers
import LoginHandler from './routers/login/login.handler';
import RegisterHandler from './routers/register/register.handler';
import RefreshUserHandler from './routers/refreshUser/refreshUser.handler';

export type ResponseType = {
  statusCode: number;
  message: string;
  data: any;
};

const sendResponse = (res: ServerResponse, response: ResponseType) => {
  res.writeHead(response.statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(response.data));
};

const sendOptions = (res: ServerResponse) => {
  res.writeHead(200);
  res.end();
};

export default class HttpServer {
  constructor(private port: number) {
    this.port = port;
  }

  setup() {
    const server = http.createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, PATCH');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization',
      );

      if (req.method === 'OPTIONS') {
        sendOptions(res);
        return;
      }

      if (req.method === 'POST') {
        if (req.url === '/login') {
          const response = await new LoginHandler(req).handle();
          if (response) {
            sendResponse(res, response);
          } else {
            sendResponse(res, {
              statusCode: 500,
              message: 'Internal Server Error',
              data: { error: 'Internal Server Error' },
            });
          }
        } else if (req.url === '/register') {
          const response = await new RegisterHandler(req).handle();
          if (response) {
            sendResponse(res, response);
          } else {
            sendResponse(res, {
              statusCode: 500,
              message: 'Internal Server Error',
              data: { error: 'Internal Server Error' },
            });
          }
        } else if (req.url === '/refresh/user') {
          const response = await new RefreshUserHandler(req).refreshUser();
          if (response) {
            sendResponse(res, response);
          } else {
            sendResponse(res, {
              statusCode: 500,
              message: 'Internal Server Error',
              data: { error: 'Internal Server Error' },
            });
          }
        } else {
          sendResponse(res, {
            statusCode: 404,
            message: 'API URL Not Found',
            data: { error: 'API URL Not Found' },
          });
        }
      }
    });

    server.listen(this.port, () => {
      console.log(`Server is running on port ${this.port}`);
    });

    server.on('error', (error: any) => {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError({
          name: 'ServerError',
          message: `伺服器發生預期外的錯誤: ${error.message}`,
          part: 'SERVER',
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }
      new Logger('Server').error(`Server error: ${error.error_message}`);
    });

    return server;
  }
}
