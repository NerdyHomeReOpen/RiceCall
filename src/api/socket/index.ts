import http from 'http';
import { Server, Socket } from 'socket.io';

// Error
import StandardizedError from '@/error';

// Validators
import AuthValidator from '@/middleware/auth.validator';

// Handlers
import {
  ConnectUserHandler,
  DisconnectUserHandler,
  UpdateUserHandler,
} from '@/api/socket/events/user/user.handler';
import {
  ConnectServerHandler,
  CreateServerHandler,
  DisconnectServerHandler,
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

        const userId = await new AuthValidator(token as string).validate();

        socket.data.userId = userId;

        if (SocketServer.userSocketMap.has(userId)) {
          const socketId = SocketServer.userSocketMap.get(userId);

          if (socketId) {
            io.to(socketId).emit('openPopup', {
              type: 'dialogAlert',
              initialData: {
                title: '另一個設備已登入',
                content: '請重新登入',
                submitTo: 'dialogAlert',
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
      SocketServer.userSocketMap.set(socket.data.userId, socket.id);
      new ConnectUserHandler(io, socket).handle();

      socket.on('disconnect', () => {
        SocketServer.userSocketMap.delete(socket.data.userId);
        new DisconnectUserHandler(io, socket).handle();
      });

      // User
      socket.on('updateUser', async (data) => {
        new UpdateUserHandler(io, socket).handle(data);
      });

      // Server
      socket.on('connectServer', async (data) => {
        new ConnectServerHandler(io, socket).handle(data);
      });
      socket.on('disconnectServer', async (data) => {
        new DisconnectServerHandler(io, socket).handle(data);
      });
      socket.on('createServer', async (data) => {
        new CreateServerHandler(io, socket).handle(data);
      });
      socket.on('updateServer', async (data) => {
        new UpdateServerHandler(io, socket).handle(data);
      });

      // Channel
      socket.on('connectChannel', async (data) =>
        new ConnectChannelHandler(io, socket).handle(data),
      );
      socket.on('disconnectChannel', async (data) =>
        new DisconnectChannelHandler(io, socket).handle(data),
      );
      socket.on('createChannel', async (data) =>
        new CreateChannelHandler(io, socket).handle(data),
      );
      socket.on('updateChannel', async (data) =>
        new UpdateChannelHandler(io, socket).handle(data),
      );
      socket.on('updateChannels', async (data) =>
        new UpdateChannelsHandler(io, socket).handle(data),
      );
      socket.on('deleteChannel', async (data) =>
        new DeleteChannelHandler(io, socket).handle(data),
      );

      // Friend Group
      socket.on('createFriendGroup', async (data) =>
        new CreateFriendGroupHandler(io, socket).handle(data),
      );
      socket.on('updateFriendGroup', async (data) =>
        new UpdateFriendGroupHandler(io, socket).handle(data),
      );
      socket.on('deleteFriendGroup', async (data) =>
        new DeleteFriendGroupHandler(io, socket).handle(data),
      );

      // Member
      socket.on('createMember', async (data) =>
        new CreateMemberHandler(io, socket).handle(data),
      );
      socket.on('updateMember', async (data) =>
        new UpdateMemberHandler(io, socket).handle(data),
      );
      socket.on('deleteMember', async (data) =>
        new DeleteMemberHandler(io, socket).handle(data),
      );

      // Member Application
      socket.on('createMemberApplication', async (data) =>
        new CreateMemberApplicationHandler(io, socket).handle(data),
      );
      socket.on('updateMemberApplication', async (data) =>
        new UpdateMemberApplicationHandler(io, socket).handle(data),
      );
      socket.on('deleteMemberApplication', async (data) =>
        new DeleteMemberApplicationHandler(io, socket).handle(data),
      );

      // Friend
      socket.on('createFriend', async (data) =>
        new CreateFriendHandler(io, socket).handle(data),
      );
      socket.on('updateFriend', async (data) =>
        new UpdateFriendHandler(io, socket).handle(data),
      );
      socket.on('deleteFriend', async (data) =>
        new DeleteFriendHandler(io, socket).handle(data),
      );

      // Friend Application
      socket.on('createFriendApplication', async (data) =>
        new CreateFriendApplicationHandler(io, socket).handle(data),
      );
      socket.on('updateFriendApplication', async (data) =>
        new UpdateFriendApplicationHandler(io, socket).handle(data),
      );
      socket.on('deleteFriendApplication', async (data) =>
        new DeleteFriendApplicationHandler(io, socket).handle(data),
      );

      // Message
      socket.on('message', async (data) =>
        new SendMessageHandler(io, socket).handle(data),
      );
      socket.on('directMessage', async (data) =>
        new SendDirectMessageHandler(io, socket).handle(data),
      );

      // RTC
      socket.on('RTCOffer', async (data) =>
        new RTCOfferHandler(io, socket).handle(data),
      );
      socket.on('RTCAnswer', async (data) =>
        new RTCAnswerHandler(io, socket).handle(data),
      );
      socket.on('RTCIceCandidate', async (data) =>
        new RTCCandidateHandler(io, socket).handle(data),
      );

      // Echo
      socket.on('ping', async () => {
        socket.emit('pong');
      });
    });

    SocketServer.io = io;

    return io;
  }
}
