import { Server, Socket } from 'socket.io';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Socket
import SocketServer from '@/api/socket';

// Schemas
import {
  CreateFriendSchema,
  UpdateFriendSchema,
  DeleteFriendSchema,
} from '@/api/socket/events/friend/friend.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

// Database
import { database } from '@/index';
import { SocketRequestHandler } from '@/handler';
import { biDirectionalAsyncOperation } from '@/utils';
import AlreadyFriendError from '@/errors/AlreadyFriendError';
import FriendNotFoundError from '@/errors/FriendNotFoundError';
import FriendGroupNotFoundError from '@/errors/FriendGroupNotFoundError';

enum FriendDatabaseOperator {
  SET = 'set',
  DELETE = 'delete',
}

async function operateFriendBiDirection(usersId: string[], operator: FriendDatabaseOperator, preset: any) {
  let dbExec = async (a: string, b: string) => {
    if (operator === FriendDatabaseOperator.SET) await database[operator].friend(a, b, {
      ...preset,
      createdAt: Date.now(),
    });
    if (operator === FriendDatabaseOperator.DELETE) await database[operator].friend(a, b);
  }
  
  await biDirectionalAsyncOperation(dbExec, usersId);
}


export const FriendHandlerServerSide = {
  // 本函式觸發條件:
  // 1. 應呼叫於雙向 FriendApplication 偵測到時(在處理新的 FriendApplication 時，發現已經有來自對方的 FriendApplication) (好友分組設為 null)
  // 2. 應呼叫於處理 FriendApproval 時 

  // 觸發條件1保證 userId1 和 userId2 此時一定存在並且[還不是好友] (舊版 client 主導的操作邏輯上仍然需要判斷兩者是否為好友)
  // 觸發條件1保證 userId1 !== userId2
  // 觸發條件2保證 userId1 和 userId2 皆存在並且還不是好友
  // 觸發條件2保證 userId1 !== userId2
  createFriend: async (userId1: string, userId2: string) => {

    // == the logic is for old version friend application support, should remove in future ==
    const friend = await database.get.friend(userId1, userId2);
    if (friend) throw new AlreadyFriendError(userId1, userId2);
    // == end of the old version compatibility logic ==


    await operateFriendBiDirection([userId1, userId2], FriendDatabaseOperator.SET, {
      createdAt: Date.now(),
      friend: {
        firendGroup: null
      }
    });
    
    const emitEvent = async (userId: string, targetId: string) => {
      const targetSocket = SocketServer.getSocket(targetId);
      if (targetSocket) {
        targetSocket.emit(
          'friendAdd',
          await database.get.userFriend(targetId, userId),
        );
      }
    }
    await biDirectionalAsyncOperation(emitEvent, [userId1, userId2]);
    
    new Logger('CreateFriend').info(
      `Friend peer (${userId1}, ${userId2}) created`,
    );
  },

  updateFriendGroup: async (userId: string, targetId: string, friendGroupId: string) => {
    const friend = await database.get.friend(userId, targetId);
    if (!friend) throw new FriendNotFoundError(userId, targetId);

    const friendGroup = await database.get.friendGroup(friendGroupId);
    if (!friendGroup) throw new FriendGroupNotFoundError(friendGroupId);
    
    await database.set.friend(userId, targetId, {
      ...friend,
      friendGroupId,
    });
  }


}

export const CreateFriendHandler : SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const {
        userId,
        targetId,
        friend: preset,
      } = await DataValidator.validate(
        CreateFriendSchema,
        data,
        'CREATEFRIEND',
      );

      const friend = await database.get.friend(userId, targetId);

      if (friend) reason = 'Already friends';

      if (operatorId !== userId) reason = 'Cannot add non-self friends';

      if (userId === targetId) reason = 'Cannot add self as a friend';

      if (reason) {
        new Logger('CreateFriend').warn(
          `User(${userId}) failed to add friend(${targetId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      await operateFriendBiDirection([userId, targetId], FriendDatabaseOperator.SET, preset);

      const targetSocket = SocketServer.getSocket(targetId);

      // Send socket event
      socket.emit('friendAdd', await database.get.userFriend(userId, targetId));
      if (targetSocket) {
        targetSocket.emit(
          'friendAdd',
          await database.get.userFriend(targetId, userId),
        );
      }

      /* ========== End of Handling ========== */

      new Logger('CreateFriend').info(
        `User(${userId}) added friend(${targetId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('CreateFriend').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `建立好友失敗，請稍後再試`,
          part: 'CREATEFRIEND',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const UpdateFriendHandler : SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const { userId, targetId, friend } = await DataValidator.validate(
        UpdateFriendSchema,
        data,
        'UPDATEFRIEND',
      );

      if (operatorId !== userId) reason = 'Cannot modify non-self friends';

      if (reason) {
        new Logger('UpdateFriend').warn(
          `User(${userId}) failed to update friend(${targetId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      // Update friend
      await database.set.friend(userId, targetId, friend);

      // Send socket event
      socket.emit('friendUpdate', userId, targetId, friend);

      /* ========== End of Handling ========== */

      new Logger('UpdateFriend').info(
        `User(${userId}) updated friend(${targetId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('UpdateFriend').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `更新好友失敗，請稍後再試`,
          part: 'UPDATEFRIEND',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const DeleteFriendHandler : SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const { userId, targetId } = await DataValidator.validate(
        DeleteFriendSchema,
        data,
        'DELETEFRIEND',
      );

      if (operatorId !== userId) reason = 'Cannot delete non-self friends';

      if (reason) {
        new Logger('DeleteFriend').warn(
          `User(${userId}) failed to delete friend(${targetId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */
      await operateFriendBiDirection([userId, targetId], FriendDatabaseOperator.DELETE, {});

      // Send socket event
      const targetSocket = SocketServer.getSocket(targetId);

      socket.emit('friendDelete', userId, targetId);
      if (targetSocket) {
        targetSocket.emit('friendDelete', targetId, userId);
      }

      /* ========== End of Handling ========== */

      new Logger('DeleteFriend').info(
        `User(${userId}) deleted friend(${targetId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('DeleteFriend').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `刪除好友失敗，請稍後再試`,
          part: 'DELETEFRIEND',
          tag: 'EXCEPTION_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};
