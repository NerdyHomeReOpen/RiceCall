import http from 'http';
import { Server, Socket } from 'socket.io';

// Error
import StandardizedError from '@/error';

// Validators
import { AuthValidator } from '@/middleware/auth.validator';

// Handlers
import {
  ConnectUserHandler,
  DisconnectUserHandler,
  SearchUserHandler,
  UpdateUserHandler,
} from '@/api/socket/events/user/user.handler';
import {
  ConnectServerHandler,
  CreateServerHandler,
  DisconnectServerHandler,
  SearchServerHandler,
  UpdateServerHandler,
} from '@/api/socket/events/server/server.handler';
import {
  ConnectChannelHandler,
  DisconnectChannelHandler,
  CreateChannelHandler,
  UpdateChannelsHandler,
  UpdateChannelHandler,
  DeleteChannelHandler,
} from '@/api/socket/events/channel/channel.handler';
import {
  CreateFriendGroupHandler,
  DeleteFriendGroupHandler,
  UpdateFriendGroupHandler,
} from '@/api/socket/events/friendGroup/friendGroup.handler';
import {
  CreateFriendHandler,
  UpdateFriendHandler,
  DeleteFriendHandler,
} from '@/api/socket/events/friend/friend.handler';
import {
  CreateMemberApplicationHandler,
  UpdateMemberApplicationHandler,
  DeleteMemberApplicationHandler,
} from '@/api/socket/events/memberApplication/memberApplication.handler';
import {
  CreateMemberHandler,
  DeleteMemberHandler,
  UpdateMemberHandler,
} from '@/api/socket/events/member/member.handler';
import {
  CreateFriendApplicationHandler,
  UpdateFriendApplicationHandler,
  DeleteFriendApplicationHandler,
} from '@/api/socket/events/friendApplication/friendApplication.handler';
import {
  SendMessageHandler,
  SendDirectMessageHandler,
  ShakeWindowHandler,
} from '@/api/socket/events/message/message.handler';
import {
  RTCOfferHandler,
  RTCAnswerHandler,
  RTCCandidateHandler,
} from '@/api/socket/events/rtc/rtc.handler';

export default class SocketServer {
  static io: Server;
  static socket: Socket;
  static userSocketMap: Map<string, string> = new Map(); // userId -> socketId

  constructor(private server: http.Server) {
    this.server = server;
  }

  static getSocket(userId: string) {
    const socketId = SocketServer.userSocketMap.get(userId);

    if (!socketId) return null;

    const socket = SocketServer.io.sockets.sockets.get(socketId);

    if (!socket) return null;

    return socket;
  }

  setup() {
    const io = new Server(this.server, {
      cors: {
        origin: '*', // Allow all origins
        methods: ['GET', 'POST'],
      },
    });

    io.use(async (socket: Socket, next: (err?: StandardizedError) => void) => {
      try {
        const { token } = socket.handshake.query;

        const userId = await AuthValidator.validate(token as string);

        socket.data.userId = userId;

        if (SocketServer.userSocketMap.has(userId)) {
          const socketId = SocketServer.userSocketMap.get(userId);

          if (socketId) {
            io.to(socketId).emit('openPopup', {
              type: 'dialogAlert',
              id: 'logout',
              initialData: {
                title: '另一個設備已登入，請重新登入',
                submitTo: 'logout',
              },
            });
            io.to(socketId).disconnectSockets();
          }
        }

        return next();
      } catch (error: any) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError({
            name: 'ServerError',
            message: `驗證時發生無法預期的錯誤，請稍後再試`,
            part: 'AUTH',
            tag: 'EXCEPTION_ERROR',
            statusCode: 500,
          });
        }

        socket.emit('openPopup', {
          type: 'dialogAlert',
          id: 'logout',
          initialData: {
            title: error.message || '發生錯誤，請重新登入',
            submitTo: 'logout',
          },
        });

        return next(error);
      }
    });

    io.on('connection', async (socket: Socket) => {
      SocketServer.userSocketMap.set(socket.data.userId, socket.id);
      await ConnectUserHandler.handle(io, socket);

      socket.on('disconnecting', async () => {
        socket.removeAllListeners();
        SocketServer.userSocketMap.delete(socket.data.userId);
        await DisconnectUserHandler.handle(io, socket);
      });

      socket.on('disconnect', async () => {
        socket.removeAllListeners();
        SocketServer.userSocketMap.delete(socket.data.userId);
        await DisconnectUserHandler.handle(io, socket);
      });

      // User
      socket.on(
        'searchUser',
        async (data) => await SearchUserHandler.handle(io, socket, data),
      );
      socket.on('updateUser', async (data) => {
        await UpdateUserHandler.handle(io, socket, data);
      });

      // Server
      socket.on('searchServer', async (data) => {
        await SearchServerHandler.handle(io, socket, data);
      });
      socket.on('connectServer', async (data) => {
        await ConnectServerHandler.handle(io, socket, data);
      });
      socket.on('disconnectServer', async (data) => {
        await DisconnectServerHandler.handle(io, socket, data);
      });
      socket.on('createServer', async (data) => {
        await CreateServerHandler.handle(io, socket, data);
      });
      socket.on('updateServer', async (data) => {
        await UpdateServerHandler.handle(io, socket, data);
      });

      // Channel
      socket.on('connectChannel', async (data) => {
        await ConnectChannelHandler.handle(io, socket, data);
      });
      socket.on('disconnectChannel', async (data) => {
        await DisconnectChannelHandler.handle(io, socket, data);
      });
      socket.on('createChannel', async (data) => {
        await CreateChannelHandler.handle(io, socket, data);
      });
      socket.on('updateChannel', async (data) => {
        await UpdateChannelHandler.handle(io, socket, data);
      });
      socket.on('updateChannels', async (data) => {
        await UpdateChannelsHandler.handle(io, socket, data);
      });
      socket.on('deleteChannel', async (data) => {
        await DeleteChannelHandler.handle(io, socket, data);
      });

      // Friend Group
      socket.on('createFriendGroup', async (data) => {
        await CreateFriendGroupHandler.handle(io, socket, data);
      });
      socket.on('updateFriendGroup', async (data) => {
        await UpdateFriendGroupHandler.handle(io, socket, data);
      });
      socket.on('deleteFriendGroup', async (data) => {
        await DeleteFriendGroupHandler.handle(io, socket, data);
      });

      // Member
      socket.on('createMember', async (data) => {
        await CreateMemberHandler.handle(io, socket, data);
      });
      socket.on('updateMember', async (data) => {
        await UpdateMemberHandler.handle(io, socket, data);
      });
      socket.on('deleteMember', async (data) => {
        await DeleteMemberHandler.handle(io, socket, data);
      });

      // Member Application
      socket.on('createMemberApplication', async (data) => {
        await CreateMemberApplicationHandler.handle(io, socket, data);
      });
      socket.on('updateMemberApplication', async (data) => {
        await UpdateMemberApplicationHandler.handle(io, socket, data);
      });
      socket.on('deleteMemberApplication', async (data) => {
        await DeleteMemberApplicationHandler.handle(io, socket, data);
      });

      // Friend
      socket.on('createFriend', async (data) => {
        await CreateFriendHandler.handle(io, socket, data);
      });
      socket.on('updateFriend', async (data) => {
        await UpdateFriendHandler.handle(io, socket, data);
      });
      socket.on('deleteFriend', async (data) => {
        await DeleteFriendHandler.handle(io, socket, data);
      });

      // Friend Application
      socket.on('createFriendApplication', async (data) => {
        await CreateFriendApplicationHandler.handle(io, socket, data);
      });
      socket.on('updateFriendApplication', async (data) => {
        await UpdateFriendApplicationHandler.handle(io, socket, data);
      });
      socket.on('deleteFriendApplication', async (data) => {
        await DeleteFriendApplicationHandler.handle(io, socket, data);
      });

      // Message
      socket.on('message', async (data) => {
        await SendMessageHandler.handle(io, socket, data);
      });
      socket.on('directMessage', async (data) => {
        await SendDirectMessageHandler.handle(io, socket, data);
      });
      socket.on('shakeWindow', async (data) => {
        await ShakeWindowHandler.handle(io, socket, data);
      });

      // RTC
      socket.on('RTCOffer', async (data) => {
        await RTCOfferHandler.handle(io, socket, data);
      });
      socket.on('RTCAnswer', async (data) => {
        await RTCAnswerHandler.handle(io, socket, data);
      });
      socket.on('RTCIceCandidate', async (data) => {
        await RTCCandidateHandler.handle(io, socket, data);
      });

      // Echo
      socket.on('ping', async () => {
        socket.emit('pong');
      });
    });

    SocketServer.io = io;

    return io;
  }
}
