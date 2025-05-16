import { ResponseType } from '@/api/http';
import { Server, Socket } from 'socket.io';
export interface RequestHandler {
    handle: (data: any) => Promise<ResponseType>;
    [key: string]: any;
}

export interface SocketRequestHandler {
    handle(io: Server, socket: Socket, data?: any): Promise<void>;
    [key: string]: any;
}