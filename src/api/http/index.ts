import http, { ServerResponse } from 'http';
import { IncomingForm } from 'formidable';

// Error
import StandardizedError from '@/error';
import RouteNotFoundError from '@/errors/RouteNotFoundError';

// Utils
import Logger from '@/utils/logger';

// Handlers
import { ImagesHandler } from './routers/images/images.handler';
import { UploadHandler } from './routers/upload/upload.handler';

// Routers
import { PostRouters } from './PostRouters';
import PostRoutesInitializer from './routers/routes';

export type ResponseType = {
  statusCode: number;
  message: string;
  data: any;
};

const sendImage = (res: ServerResponse, response: ResponseType) => {
  res.writeHead(200, {
    'Content-Type': 'image/webp',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Expires': '0',
    'Pragma': 'no-cache',
  });
  res.end(response.data);
};

const sendResponse = (res: ServerResponse, response: ResponseType) => {
  res.writeHead(response.statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(response.data));
};

const sendError = (res: ServerResponse, error: StandardizedError) => {
  if (error instanceof StandardizedError) {
    res.writeHead(error.statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  } else {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
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
    PostRoutesInitializer();

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

      if (req.method === 'GET') {
        let response: ResponseType | null = null;

        if (req.url?.startsWith('/images')) {
          response = await ImagesHandler.handle(req);
        }

        if (response) sendImage(res, response);
        else
          sendResponse(res, {
            statusCode: 404,
            message: 'Not Found',
            data: null,
          });

        return;
      }

      if (req.method === 'POST') {
        let response: ResponseType | null = null;

        if (req.headers['content-type'] === 'application/json') {
          let data = '';

          req.on('data', (chunk) => {
            data += chunk.toString();
          });

          req.on('end', async () => {
            data = JSON.parse(data);

            // 路由定義已改到 ./routers/routes.ts
            let handleRoute = async () => {
              if (!req.url) req.url = '/';
              try {
                return await PostRouters.handle(req.url, data);
              } catch (error) {
                if (!(error instanceof RouteNotFoundError)) return null;
                sendResponse(res, {
                  statusCode: 404,
                  message: 'Not Found',
                  data: null,
                });
                return null;
              }
            };

            response = await handleRoute();

            if (response) {
              sendResponse(res, response);
              return;
            }

            sendResponse(res, {
              statusCode: 500,
              message: 'Request not handled',
              data: null,
            });

            console.error(`Request not handled: ${req.url}`);

            return;
          });

          return;
        } else {
          const form = new IncomingForm();

          form.parse(req, async (err, data) => {
            if (err) {
              sendError(res, err);
              return;
            }

            if (req.url === '/upload') {
              response = await UploadHandler.handle(data);
            }

            if (response) sendResponse(res, response);
            else
              sendResponse(res, {
                statusCode: 404,
                message: 'Not Found',
                data: null,
              });

            return;
          });

          return;
        }
      }
    });

    server.listen(this.port, () => {
      new Logger('Server').info(`Server is running on port ${this.port}`);
    });

    server.on('error', (error: any) => {
      new Logger('Server').error(`Server error: ${error.error_message}`);
    });

    return server;
  }
}
