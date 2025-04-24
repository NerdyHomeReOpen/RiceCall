import http from 'http';
import { Server, Socket } from 'socket.io';

// Error
import StandardizedError from '@/error';

// Validators
import AuthValidator from '@/middleware/auth.validator';

// Handlers
import UserHandler from './events/user.socket';
import ServerHandler from './events/server.socket';
import ChannelHandler from './events/channel.socket';
import FriendGroupHandler from './events/friendGroup.socket';
import FriendHandler from './events/friend.socket';
import FriendApplicationHandler from './events/friendApplication.socket';
import MemberHandler from './events/member.socket';
import MemberApplicationHandler from './events/memberApplication.socket';
import MessageHandler from './events/message.socket';
import RTCHandler from './events/rtc.socket';

export default class SocketServer {
  static userSocketMap: Map<string, string> = new Map(); // userId -> socketId

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

    io.use(async (socket: Socket, next: (err?: StandardizedError) => void) => {
      try {
        const { jwt, sessionId } = socket.handshake.query;

        // Validate
        const userId = await new AuthValidator(
          jwt as string,
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

      io.on('disconnect', () => {
        SocketServer.userSocketMap.delete(socket.data.userId);
      });

      new UserHandler(io, socket).register();

      new ServerHandler(io, socket).register();

      new ChannelHandler(io, socket).register();

      new FriendGroupHandler(io, socket).register();

      new FriendHandler(io, socket).register();

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
