import http, { ServerResponse } from 'http';
import formidable from 'formidable';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Handlers
import { LoginHandler } from './routers/login/login.handler';
import { RegisterHandler } from './routers/register/register.handler';
import { RefreshChannelHandler } from './routers/refresh/channel/refreshChannel.handler';
import { RefreshFriendHandler } from './routers/refresh/friend/refreshFriend.handler';
import { RefreshFriendApplicationHandler } from './routers/refresh/friendApplication/refreshFriendApplication.handler';
import { RefreshFriendGroupHandler } from './routers/refresh/friendGroup/refreshFriendGroup.handler';
import { RefreshMemberHandler } from './routers/refresh/member/refreshMember.handler';
import { RefreshMemberApplicationHandler } from './routers/refresh/memberApplication/refreshMemberApplication.handler';
import {
  RefreshServerHandler,
  RefreshServerChannelsHandler,
  RefreshServerMemberApplicationsHandler,
  RefreshServerMembersHandler,
} from './routers/refresh/server/refreshServer.handler';
import {
  RefreshUserHandler,
  RefreshUserFriendApplicationsHandler,
  RefreshUserFriendGroupsHandler,
  RefreshUserFriendsHandler,
  RefreshUserServersHandler,
} from './routers/refresh/user/refreshUser.handler';
import { ImagesHandler } from './routers/images/images.handler';
import { UploadHandler } from './routers/upload/upload.handler';

export type ResponseType = {
  statusCode: number;
  message: string;
  data: any;
};

const sendImage = (res: ServerResponse, response: ResponseType) => {
  res.writeHead(200, {
    'Content-Type': 'image/jpeg',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Expires': '0',
    'Pragma': 'no-cache',
  });
  res.end(response);
};

const sendResponse = (res: ServerResponse, response: ResponseType) => {
  res.writeHead(response.statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(response.data));
};

const sendOptions = (res: ServerResponse) => {
  res.writeHead(200);
  res.end();
};

const ERROR_RESPONSE = {
  statusCode: 500,
  message: 'Internal Server Error',
  data: { error: 'Internal Server Error' },
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
        let data = '';

        req.on('data', (chunk) => {
          data += chunk.toString();
        });

        req.on('end', async () => {
          data = JSON.parse(data);
          if (req.url === '/login') {
            const response = await new LoginHandler(req).handle(data);
            if (response) {
              sendResponse(res, response);
            } else {
              sendResponse(res, ERROR_RESPONSE);
            }
            return;
          } else if (req.url === '/register') {
            const response = await new RegisterHandler(req).handle(data);
            if (response) {
              sendResponse(res, response);
            } else {
              sendResponse(res, ERROR_RESPONSE);
            }
            return;
          } else if (req.url === '/refresh/channel') {
            const response = await new RefreshChannelHandler(req).handle(data);
            if (response) {
              sendResponse(res, response);
            } else {
              sendResponse(res, ERROR_RESPONSE);
            }
            return;
          } else if (req.url === '/refresh/friend') {
            const response = await new RefreshFriendHandler(req).handle(data);
            if (response) {
              sendResponse(res, response);
            } else {
              sendResponse(res, ERROR_RESPONSE);
            }
            return;
          } else if (req.url === '/refresh/friendApplication') {
            const response = await new RefreshFriendApplicationHandler(
              req,
            ).handle(data);
            if (response) {
              sendResponse(res, response);
            } else {
              sendResponse(res, ERROR_RESPONSE);
            }
            return;
          } else if (req.url === '/refresh/friendGroup') {
            const response = await new RefreshFriendGroupHandler(req).handle(
              data,
            );
            if (response) {
              sendResponse(res, response);
            } else {
              sendResponse(res, ERROR_RESPONSE);
            }
            return;
          } else if (req.url === '/refresh/member') {
            const response = await new RefreshMemberHandler(req).handle(data);
            if (response) {
              sendResponse(res, response);
            } else {
              sendResponse(res, ERROR_RESPONSE);
            }
            return;
          } else if (req.url === '/refresh/memberApplication') {
            const response = await new RefreshMemberApplicationHandler(
              req,
            ).handle(data);
            if (response) {
              sendResponse(res, response);
            } else {
              sendResponse(res, ERROR_RESPONSE);
            }
            return;
          } else if (req.url === '/refresh/server') {
            const response = await new RefreshServerHandler(req).handle(data);
            if (response) {
              sendResponse(res, response);
            } else {
              sendResponse(res, ERROR_RESPONSE);
            }
            return;
          } else if (req.url === '/refresh/serverChannels') {
            const response = await new RefreshServerChannelsHandler(req).handle(
              data,
            );
            if (response) {
              sendResponse(res, response);
            } else {
              sendResponse(res, ERROR_RESPONSE);
            }
            return;
          } else if (req.url === '/refresh/serverMemberApplications') {
            const response = await new RefreshServerMemberApplicationsHandler(
              req,
            ).handle(data);
            if (response) {
              sendResponse(res, response);
            } else {
              sendResponse(res, ERROR_RESPONSE);
            }
            return;
          } else if (req.url === '/refresh/serverMembers') {
            const response = await new RefreshServerMembersHandler(req).handle(
              data,
            );
            if (response) {
              sendResponse(res, response);
            } else {
              sendResponse(res, ERROR_RESPONSE);
            }
            return;
          } else if (req.url === '/refresh/user') {
            const response = await new RefreshUserHandler(req).handle(data);
            if (response) {
              sendResponse(res, response);
            } else {
              sendResponse(res, ERROR_RESPONSE);
            }
            return;
          } else if (req.url === '/refresh/userFriendApplications') {
            const response = await new RefreshUserFriendApplicationsHandler(
              req,
            ).handle(data);
            if (response) {
              sendResponse(res, response);
            } else {
              sendResponse(res, ERROR_RESPONSE);
            }
            return;
          } else if (req.url === '/refresh/userFriendGroups') {
            const response = await new RefreshUserFriendGroupsHandler(
              req,
            ).handle(data);
            if (response) {
              sendResponse(res, response);
            } else {
              sendResponse(res, ERROR_RESPONSE);
            }
            return;
          } else if (req.url === '/refresh/userFriends') {
            const response = await new RefreshUserFriendsHandler(req).handle(
              data,
            );
            if (response) {
              sendResponse(res, response);
            } else {
              sendResponse(res, ERROR_RESPONSE);
            }
            return;
          } else if (req.url === '/refresh/userServers') {
            const response = await new RefreshUserServersHandler(req).handle(
              data,
            );
            if (response) {
              sendResponse(res, response);
            } else {
              sendResponse(res, ERROR_RESPONSE);
            }
            return;
          } else if (req.url === '/images') {
            const response = await new ImagesHandler(req).handle(data);
            if (response) {
              sendImage(res, response);
            } else {
              sendResponse(res, ERROR_RESPONSE);
            }
            return;
          } else if (req.url === '/upload') {
            const form = new formidable.IncomingForm();
            form.parse(req, async (err, data) => {
              if (err) {
                sendResponse(res, {
                  statusCode: 500,
                  message: 'error',
                  data: { error: err },
                });
                return;
              }
              const response = await new UploadHandler(req).handle(data);
              if (response) {
                sendResponse(res, response);
              } else {
                sendResponse(res, ERROR_RESPONSE);
              }
            });
          } else {
            sendResponse(res, ERROR_RESPONSE);
            return;
          }
        });
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
