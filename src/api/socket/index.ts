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
// Logger
import Logger from '@/utils/logger';
import { EventRouters } from './EventRoutes';

import EventRouteInitializer from './events/routes';


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
          new Logger('SocketServer').error(error.message);

          error = new StandardizedError({
            name: 'ServerError',
            message: `驗證失敗，請稍後再試`,
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

      // 路由定義已改到 ./events/routes.ts
      EventRouteInitializer(new EventRouters(io, socket));
      

      // Echo
      socket.on('ping', async () => {
        socket.emit('pong');
      });
    });

    SocketServer.io = io;

    return io;
  }
}
