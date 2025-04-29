import { Server, Socket } from 'socket.io';

export abstract class SocketHandler {
  constructor(protected io: Server, protected socket: Socket) {
    this.io = io;
    this.socket = socket;
  }

  abstract handle(data: any): Promise<void>;
}
