import { Server, Socket } from 'socket.io';

// Error
import RouteNotFoundError from '@/errors/RouteNotFoundError';

// Socket
import { SocketRequestHandler } from '@/handler';

interface EventRoutes {
  [key: string]: SocketRequestHandler;
}

export class EventRouters {
  private io: Server;
  private socket: Socket;

  constructor(io: Server, socket: Socket) {
    this.io = io;
    this.socket = socket;
  }

  addRoute(path: string, handler: SocketRequestHandler) {
    this.socket.on(
      path,
      async (data: any) => await handler.handle(this.io, this.socket, data),
    );
  }
}
