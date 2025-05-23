import { Server, Socket } from 'socket.io';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Socket
import SocketServer from '@/api/socket';

// Database
import { database } from '@/index';

export const MemberHandlerServerSide = {
  createMember: async (userId: string, serverId: string, preset: any) => {
    // Create member
    await database.set.member(userId, serverId, {
      ...preset,
      createdAt: Date.now(),
    });

    await database.set.userServer(userId, serverId, {
      timestamp: Date.now(),
    });

    const targetSocket = SocketServer.getSocket(userId);

    if (targetSocket) {
      targetSocket.emit(
        'serverAdd',
        await database.get.userServer(userId, serverId),
      );
    }

    SocketServer.io
      .to(`server_${serverId}`)
      .emit('serverMemberAdd', await database.get.serverMember(serverId, userId));

    new Logger('CreateMemberServerSide').info(
      `User(${userId}) created member(${serverId})`,
    );
  },

  updateMember: async (userId: string, serverId: string, update: any) => {
    // Update member
    await database.set.member(userId, serverId, update);

    const targetSocket = SocketServer.getSocket(userId);

    if (targetSocket) {
      targetSocket.emit('serverUpdate', serverId, update);
    }

    SocketServer.io
      .to(`server_${serverId}`)
      .emit('serverMemberUpdate', userId, serverId, update);

    new Logger('UpdateMemberServerSide').info(
      `User(${userId}) updated member(${serverId})`,
    );
  },
};
