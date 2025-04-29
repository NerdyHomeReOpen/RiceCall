import http, { IncomingMessage, ServerResponse } from 'http';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Handlers
import { LoginHandler } from '@/api/http/routers/login/login.handler';
import { RegisterHandler } from '@/api/http/routers/register/register.handler';
import { RefreshChannelHandler } from '@/api/http/routers/refreshChannel/refreshChannel.handler';
import { RefreshFriendHandler } from '@/api/http/routers/refreshFriend/refreshFriend.handler';
import { RefreshFriendApplicationHandler } from '@/api/http/routers/refreshFriendApplication/refreshFriendApplication.handler';
import { RefreshFriendGroupHandler } from '@/api/http/routers/refreshFriendGroup/refreshFriendGroup.handler';
import { RefreshMemberHandler } from '@/api/http/routers/refreshMember/refreshMember.handler';
import { RefreshMemberApplicationHandler } from '@/api/http/routers/refreshMemberApplication/refreshMemberApplication.handler';
import { RefreshServerHandler } from '@/api/http/routers/refreshServer/refreshServer.handler';
import { RefreshServerChannelsHandler } from '@/api/http/routers/refreshServerChannels/refreshServerChannels.handler';
import { RefreshServerMemberApplicationsHandler } from '@/api/http/routers/refreshServerMemberApplications/refreshServerMemberApplications.handler';
import { RefreshServerMembersHandler } from '@/api/http/routers/refreshServerMembers/refreshServerMembers.handler';
import { RefreshUserHandler } from '@/api/http/routers/refreshUser/refreshUser.handler';
import { RefreshUserFriendApplicationsHandler } from '@/api/http/routers/refreshUserFriendApplications/refreshUserFriendApplications.handler';
import { RefreshUserFriendGroupsHandler } from '@/api/http/routers/refreshUserFriendGroups/refreshUserFriendGroups.handler';
import { RefreshUserFriendsHandler } from '@/api/http/routers/refreshUserFriends/refreshUserFriends.handler';
import { RefreshUserServersHandler } from '@/api/http/routers/refreshUserServers/refreshUserServers.handler';
import { ImagesHandler } from '@/api/http/routers/images/images.handler';
import { UploadHandler } from '@/api/http/routers/upload/upload.handler';

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
        if (req.url === '/login') {
          const response = await new LoginHandler(req).handle();
          if (response) {
            sendResponse(res, response);
          } else {
            sendResponse(res, ERROR_RESPONSE);
          }
        } else if (req.url === '/register') {
          const response = await new RegisterHandler(req).handle();
          if (response) {
            sendResponse(res, response);
          } else {
            sendResponse(res, ERROR_RESPONSE);
          }
        } else if (req.url === '/refresh/channel') {
          const response = await new RefreshChannelHandler(req).handle();
          if (response) {
            sendResponse(res, response);
          } else {
            sendResponse(res, ERROR_RESPONSE);
          }
        } else if (req.url === '/refresh/friend') {
          const response = await new RefreshFriendHandler(req).handle();
          if (response) {
            sendResponse(res, response);
          } else {
            sendResponse(res, ERROR_RESPONSE);
          }
        } else if (req.url === '/refresh/friendApplication') {
          const response = await new RefreshFriendApplicationHandler(
            req,
          ).handle();
          if (response) {
            sendResponse(res, response);
          } else {
            sendResponse(res, ERROR_RESPONSE);
          }
        } else if (req.url === '/refresh/friendGroup') {
          const response = await new RefreshFriendGroupHandler(req).handle();
          if (response) {
            sendResponse(res, response);
          } else {
            sendResponse(res, ERROR_RESPONSE);
          }
        } else if (req.url === '/refresh/member') {
          const response = await new RefreshMemberHandler(req).handle();
          if (response) {
            sendResponse(res, response);
          } else {
            sendResponse(res, ERROR_RESPONSE);
          }
        } else if (req.url === '/refresh/memberApplication') {
          const response = await new RefreshMemberApplicationHandler(
            req,
          ).handle();
          if (response) {
            sendResponse(res, response);
          } else {
            sendResponse(res, ERROR_RESPONSE);
          }
        } else if (req.url === '/refresh/server') {
          const response = await new RefreshServerHandler(req).handle();
          if (response) {
            sendResponse(res, response);
          } else {
            sendResponse(res, ERROR_RESPONSE);
          }
        } else if (req.url === '/refresh/serverChannels') {
          const response = await new RefreshServerChannelsHandler(req).handle();
          if (response) {
            sendResponse(res, response);
          } else {
            sendResponse(res, ERROR_RESPONSE);
          }
        } else if (req.url === '/refresh/serverMemberApplications') {
          const response = await new RefreshServerMemberApplicationsHandler(
            req,
          ).handle();
          if (response) {
            sendResponse(res, response);
          } else {
            sendResponse(res, ERROR_RESPONSE);
          }
        } else if (req.url === '/refresh/serverMembers') {
          const response = await new RefreshServerMembersHandler(req).handle();
          if (response) {
            sendResponse(res, response);
          } else {
            sendResponse(res, ERROR_RESPONSE);
          }
        } else if (req.url === '/refresh/user') {
          const response = await new RefreshUserHandler(req).handle();
          if (response) {
            sendResponse(res, response);
          } else {
            sendResponse(res, ERROR_RESPONSE);
          }
        } else if (req.url === '/refresh/userFriendApplications') {
          const response = await new RefreshUserFriendApplicationsHandler(
            req,
          ).handle();
          if (response) {
            sendResponse(res, response);
          } else {
            sendResponse(res, ERROR_RESPONSE);
          }
        } else if (req.url === '/refresh/userFriendGroups') {
          const response = await new RefreshUserFriendGroupsHandler(
            req,
          ).handle();
          if (response) {
            sendResponse(res, response);
          } else {
            sendResponse(res, ERROR_RESPONSE);
          }
        } else if (req.url === '/refresh/userFriends') {
          const response = await new RefreshUserFriendsHandler(req).handle();
          if (response) {
            sendResponse(res, response);
          } else {
            sendResponse(res, ERROR_RESPONSE);
          }
        } else if (req.url === '/refresh/userServers') {
          const response = await new RefreshUserServersHandler(req).handle();
          if (response) {
            sendResponse(res, response);
          } else {
            sendResponse(res, ERROR_RESPONSE);
          }
        } else if (req.url === '/images') {
          const response = await new ImagesHandler(req).handle();
          if (response) {
            sendImage(res, response);
          } else {
            sendResponse(res, ERROR_RESPONSE);
          }
        } else if (req.url === '/upload') {
          const response = await new UploadHandler(req).handle();
          if (response) {
            sendResponse(res, response);
          } else {
            sendResponse(res, ERROR_RESPONSE);
          }
        } else {
          sendResponse(res, ERROR_RESPONSE);
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
