import { Server, Socket } from 'socket.io';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Socket
import SocketServer from '@/api/socket';

// Database
import { database } from '@/index';

export const MemberApplicationHandlerServerSide = {
  deleteMemberApplication: async (userId: string, serverId: string) => {
    // Delete member application
    await database.delete.memberApplication(userId, serverId);

    // Send socket event
    SocketServer.io
      .to(`server_${serverId}`)
      .emit('serverMemberApplicationDelete', userId, serverId);

    new Logger('DeleteMemberApplicationServerSide').info(
      `User(${userId}) deleted member application(${serverId})`,
    );
  },
};
