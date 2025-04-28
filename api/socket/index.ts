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
} from './events/user/user.handler';
import {
  ConnectServerHandler,
  CreateServerHandler,
  DisconnectServerHandler,
  UpdateServerHandler,
} from './events/server/server.handler';
import {
  RTCOfferHandler,
  RTCAnswerHandler,
  RTCCandidateHandler,
} from './events/rtc/rtc.handler';
import {
  ConnectChannelHandler,
  DeleteChannelHandler,
  UpdateChannelsHandler,
  UpdateChannelHandler,
  CreateChannelHandler,
  DisconnectChannelHandler,
} from './events/channel/channel.handler';
import {
  SendMessageHandler,
  SendDirectMessageHandler,
} from './events/message/message.handler';

export default class SocketServer {
  static io: Server;
  static socket: Socket;
  static userSocketMap: Map<string, string> = new Map(); // userId -> socketId

  constructor(private server: http.Server) {
    this.server = server;
  }

  static getSocket(io: Server, userId: string) {
    const socketId = SocketServer.userSocketMap.get(userId);

    if (!socketId) return null;

    const socket = io.sockets.sockets.get(socketId);

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
        const { token, sessionId } = socket.handshake.query;

        // Validate
        const userId = await new AuthValidator(
          token as string,
          sessionId as string,
        ).validate();

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
        new DisconnectUserHandler(io, socket).handle();
        SocketServer.userSocketMap.delete(socket.data.userId);
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

export abstract class SocketHandler {
  constructor(protected io: Server, protected socket: Socket) {
    this.io = io;
    this.socket = socket;
  }

  abstract handle(data: any): Promise<void>;
}
