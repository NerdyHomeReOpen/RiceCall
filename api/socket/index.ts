/* eslint-disable @typescript-eslint/no-require-imports */
import http from 'http';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

// Error
import StandardizedError from '@/error';

// Utils
import { Session, JWT } from '@/utils';

// Handlers
import userHandler from './handlers/user.socket';
import serverHandler from './handlers/server.handler';
import memberHandler from './handlers/member.handler';
import channelHandler from './handlers/channel.handler';
import messageHandler from './handlers/message.handler';
import friendGroupHandler from './handlers/friendGroup.handler';
import friendHandler from './handlers/friend.handler';
import friendApplicationHandler from './handlers/friendApplication.handler';
import memberApplicationHandler from './handlers/memberApplication.handler';
import rtcHandler from './handlers/rtc.handler';
import UserHandler from './handlers/user.socket';

export default class SocketServer {
  constructor(private server: http.Server) {
    this.server = server;
  }

  setup() {
    const io = new Server(this.server, {
      cors: {
        origin: '*', // Allow all origins
        methods: ['GET', 'POST'],
      },
    });

    io.use((socket: Socket, next: (err?: StandardizedError) => void) => {
      try {
        const jwt = socket.handshake.query.jwt;
        if (!jwt) {
          return next(
            new StandardizedError({
              name: 'ValidationError',
              message: '無可用的 JWT',
              part: 'AUTH',
              tag: 'TOKEN_MISSING',
              statusCode: 401,
            }),
          );
        }
        const result = JWT.verifyToken(jwt);
        if (!result.valid) {
          return next(
            new StandardizedError({
              name: 'ValidationError',
              message: '無效的 token',
              part: 'AUTH',
              tag: 'TOKEN_INVALID',
              statusCode: 401,
            }),
          );
        }
        const userId = result.userId;
        if (!userId) {
          return next(
            new StandardizedError({
              name: 'ValidationError',
              message: '無效的 token',
              part: 'AUTH',
              tag: 'TOKEN_INVALID',
              statusCode: 401,
            }),
          );
        }

        // Generate a new session ID
        const sessionId = uuidv4();

        socket.jwt = jwt;
        socket.userId = userId;
        socket.sessionId = sessionId;

        // Save maps
        Session.createUserIdSessionIdMap(userId, sessionId);

        return next();
      } catch (error: any) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError({
            name: 'ServerError',
            message: `驗證時發生無法預期的錯誤: ${error.message}`,
            part: 'AUTH',
            tag: 'EXCEPTION_ERROR',
            statusCode: 500,
          });
        }

        return next(error);
      }
    });

    io.on('connection', (socket: Socket) => {
      new UserHandler(io, socket).register();

      // Server
      socket.on('searchServer', async (data: any) =>
        serverHandler.searchServer(io, socket, data),
      );
      socket.on('connectServer', async (data: any) =>
        serverHandler.connectServer(io, socket, data),
      );
      socket.on('disconnectServer', async (data: any) =>
        serverHandler.disconnectServer(io, socket, data),
      );
      socket.on('createServer', async (data: any) =>
        serverHandler.createServer(io, socket, data),
      );
      socket.on('updateServer', async (data) =>
        serverHandler.updateServer(io, socket, data),
      );
      // Channel
      socket.on('connectChannel', async (data) =>
        channelHandler.connectChannel(io, socket, data),
      );
      socket.on('disconnectChannel', async (data) =>
        channelHandler.disconnectChannel(io, socket, data),
      );
      socket.on('createChannel', async (data) =>
        channelHandler.createChannel(io, socket, data),
      );
      socket.on('updateChannel', async (data) =>
        channelHandler.updateChannel(io, socket, data),
      );
      socket.on('updateChannels', async (data) =>
        channelHandler.updateChannels(io, socket, data),
      );
      socket.on('deleteChannel', async (data) =>
        channelHandler.deleteChannel(io, socket, data),
      );
      // Friend Group
      socket.on('createFriendGroup', async (data) =>
        friendGroupHandler.createFriendGroup(io, socket, data),
      );
      socket.on('updateFriendGroup', async (data) =>
        friendGroupHandler.updateFriendGroup(io, socket, data),
      );
      socket.on('deleteFriendGroup', async (data) =>
        friendGroupHandler.deleteFriendGroup(io, socket, data),
      );
      // Member
      socket.on('createMember', async (data) =>
        memberHandler.createMember(io, socket, data),
      );
      socket.on('updateMember', async (data) =>
        memberHandler.updateMember(io, socket, data),
      );
      socket.on('deleteMember', async (data) =>
        memberHandler.deleteMember(io, socket, data),
      );
      // Friend
      socket.on('createFriend', async (data) =>
        friendHandler.createFriend(io, socket, data),
      );
      socket.on('updateFriend', async (data) =>
        friendHandler.updateFriend(io, socket, data),
      );
      socket.on('deleteFriend', async (data) =>
        friendHandler.deleteFriend(io, socket, data),
      );
      // Member Application
      socket.on('createMemberApplication', async (data) =>
        memberApplicationHandler.createMemberApplication(io, socket, data),
      );
      socket.on('updateMemberApplication', async (data) =>
        memberApplicationHandler.updateMemberApplication(io, socket, data),
      );
      socket.on('deleteMemberApplication', async (data) =>
        memberApplicationHandler.deleteMemberApplication(io, socket, data),
      );
      // Friend Application
      socket.on('createFriendApplication', async (data) =>
        friendApplicationHandler.createFriendApplication(io, socket, data),
      );
      socket.on('updateFriendApplication', async (data) =>
        friendApplicationHandler.updateFriendApplication(io, socket, data),
      );
      socket.on('deleteFriendApplication', async (data) =>
        friendApplicationHandler.deleteFriendApplication(io, socket, data),
      );
      // Message
      socket.on('message', async (data) =>
        messageHandler.sendMessage(io, socket, data),
      );
      socket.on('directMessage', async (data) =>
        messageHandler.sendDirectMessage(io, socket, data),
      );
      // RTC
      socket.on('RTCOffer', async (data) => rtcHandler.offer(io, socket, data));
      socket.on('RTCAnswer', async (data) =>
        rtcHandler.answer(io, socket, data),
      );
      socket.on('RTCIceCandidate', async (data) =>
        rtcHandler.candidate(io, socket, data),
      );
      // Echo
      socket.on('ping', async () => {
        socket.emit('pong');
      });
    });

    return io;
  }
}
