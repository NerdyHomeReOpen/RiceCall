import { Server, Socket } from 'socket.io';

// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Socket
import SocketServer from '@/api/socket';
import { SocketRequestHandler } from '@/handler';

// Database
import { database } from '@/index';

// Schemas
import {
  CreateMemberSchema,
  UpdateMemberSchema,
  DeleteMemberSchema,
} from '@/api/socket/events/member/member.schema';

// Middleware
import { DataValidator } from '@/middleware/data.validator';

export const CreateMemberHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    const part = 'CREATEMEMBER';
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const {
        userId,
        serverId,
        member: preset,
      } = await DataValidator.validate(
        CreateMemberSchema,
        data,
        part,
      );

      const server = await database.get.server(serverId);
      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorId !== userId) {
        if (operatorMember.permissionLevel < 5)
          reason = 'Not enough permission';

        if (preset.permissionLevel >= operatorMember.permissionLevel)
          reason = 'Cannot give permission higher than self';

        if (preset.permissionLevel > 5) reason = 'Permission level too high';
      } else {
        if (preset.permissionLevel !== 1 && server.ownerId !== operatorId)
          reason = 'Permission level must be 1';

        if (preset.permissionLevel !== 6 && server.ownerId === operatorId)
          reason = 'Permission level must be 6';
      }

      if (reason) {
        new Logger('CreateMember').warn(
          `User(${userId}) failed to create member(${serverId}) (Operator: ${operatorId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      // Create member
      await database.set.member(userId, serverId, {
        ...preset,
        createdAt: Date.now(),
      });

      await database.set.userServer(userId, serverId, {
        timestamp: Date.now(),
      });

      // Send socket event
      const targetSocket =
        operatorId === userId ? socket : SocketServer.getSocket(userId);

      if (targetSocket) {
        targetSocket.emit(
          'serverAdd',
          await database.get.userServer(userId, serverId),
        );
      }

      io.to(`server_${serverId}`).emit(
        'serverMemberAdd',
        await database.get.serverMember(serverId, userId),
      );

      /* ========== End of Handling ========== */

      new Logger('CreateMember').info(
        `User(${userId}) created member(${serverId}) (Operator: ${operatorId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('CreateMember').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `建立成員失敗，請稍後再試`,
          part: part,
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const UpdateMemberHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    const part = 'UPDATEMEMBER';
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const {
        userId,
        serverId,
        member: update,
      } = await DataValidator.validate(
        UpdateMemberSchema,
        data,
        part,
      );

      // Target User
      const userMember = await database.get.member(userId, serverId);
      const user = await database.get.user(userId);

      // Operator
      const operatorMember = await database.get.member(operatorId, serverId);
      const operator = await database.get.user(operatorId);

      if (operatorId !== userId) {
        if (operatorMember.permissionLevel < 3)
          reason = 'Not enough permission';

        if (operatorMember.permissionLevel <= userMember.permissionLevel)
          reason = 'Permission lower than the target';

        if (userMember.permissionLevel > 5)
          reason = "Cannot edit group creator's permission";

        if (
          userMember.permissionLevel === 1 &&
          update.permissionLevel &&
          operatorMember.permissionLevel < 5
        )
          reason =
            'Cannot edit guest permission as while permission is lower than 5';

        if (update.permissionLevel === 1 && operatorMember.permissionLevel < 5)
          reason =
            'Cannot set target to guest as while permission is lower than 5';

        if (update.nickname && operatorMember.permissionLevel < 5)
          reason =
            'Cannot edit target nickname while permission is lower than 5';

        if (update.permissionLevel >= operatorMember.permissionLevel)
          reason = 'Cannot give permission higher than self';

        if (update.permissionLevel > 5) reason = 'Permission level too high';

      } else { // update Self Member Data
        if (update.permissionLevel) {
          if (update.permissionLevel == 1) {  // Remove self membership
            if (operatorMember.permissionLevel == 1) {
              reason = 'not a member';
            }

            if (operatorMember.permissionLevel > 5) {
              reason = 'Cannot remove self membership';
            }
          }

          if (update.permissionLevel !== 1) reason = 'Cannot edit self permission';
        }
      }

      if (reason) {
        new Logger('UpdateMember').warn(
          `User(${userId}) failed to update member(${serverId}) (Operator: ${operatorId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      // Update member
      await database.set.member(userId, serverId, update);

      // Updated member Data
      const updatedUserMember = {
        ...userMember,
        ...update,
      };
      const userCurrentChannelId = updatedUserMember.currentChannelId;

      // Send socket event
      const targetSocket =
        operatorId === userId ? socket : SocketServer.getSocket(userId);

      if (targetSocket) {
        targetSocket.emit('serverUpdate', serverId, update);

        // Send event messages to self
        if (update.permissionLevel) {
          if (update.permissionLevel === 2 || userMember.permissionLevel > 2) { // Target User set to Member
            if (userCurrentChannelId && (userMember.permissionLevel === 3 || userMember.permissionLevel === 4)) {
              // Original PermissionLevel is Channel Manager or Category Manager
              targetSocket.emit('onActionMessage', {
                serverId: serverId,
                channelId: null,
                sender: {
                  ...operatorMember,
                  ...operator
                },
                receiver: {
                  ...userMember,
                  ...user
                },
                type: 'event',
                content: 'removeFromChannelManagerMessage',
                timestamp: Date.now().valueOf(),
              });

            } else if (userMember.permissionLevel === 5) {
              // Original PermissionLevel is Server Manager
              targetSocket.emit('onActionMessage', {
                serverId: serverId,
                channelId: null,
                sender: {
                  ...operatorMember,
                  ...operator
                },
                receiver: {
                  ...userMember,
                  ...user
                },
                type: 'event',
                content: 'removeFromServerManagerMessage',
                timestamp: Date.now().valueOf(),
              });
            }

          } else if (update.permissionLevel === 1) { // Target User set to Guest
            // Original PermissionLevel is above Guest
            targetSocket.emit('onActionMessage', {
              serverId: serverId,
              channelId: null,
              sender: {
                ...operatorMember,
                ...operator
              },
              receiver: {
                ...userMember,
                ...user
              },
              type: 'event',
              content: 'removeFromMemberMessage',
              timestamp: Date.now().valueOf(),
            });
          }
        }
      }

      // Send event messages to all channel
      if (update.permissionLevel) {
        if (update.permissionLevel === 3 || update.permissionLevel === 4) {
          // update member to Channel Manager or Category Manager
          if (userCurrentChannelId) { // If user in channel
            if (targetSocket) {
              targetSocket.emit('onActionMessage', {
                serverId: serverId,
                channelId: null,
                sender: {
                  ...operatorMember,
                  ...operator
                },
                receiver: {
                  ...updatedUserMember,
                  ...user
                },
                type: 'info',
                content: 'upgradeChannelManagerMessage',
                timestamp: Date.now().valueOf(),
              });
            }

            io.to(`channel_${userCurrentChannelId}`).emit('onMessage', {
              serverId: serverId,
              channelId: userCurrentChannelId,
              sender: {
                ...operatorMember,
                ...operator
              },
              receiver: {
                ...updatedUserMember,
                ...user
              },
              type: 'event',
              content: 'updateChannelManagerMessage',
              timestamp: Date.now().valueOf(),
            });
          }

        } else if (update.permissionLevel === 5) {
          // update member to Server Manager
          if (targetSocket) {
            targetSocket.emit('onActionMessage', {
              serverId: serverId,
              channelId: null,
              sender: {
                ...operatorMember,
                ...operator
              },
              receiver: {
                ...updatedUserMember,
                ...user
              },
              type: 'info',
              content: 'upgradeServerManagerMessage',
              timestamp: Date.now().valueOf(),
            });
          }
          
          io.to(`server_${serverId}`).emit('onMessage', {
            serverId: serverId,
            channelId: null,
            sender: {
              ...operatorMember,
              ...operator
            },
            receiver: {
              ...updatedUserMember,
              ...user
            },
            type: 'event',
            content: 'updateServerManagerMessage',
            timestamp: Date.now().valueOf(),
          });
        }
      }

      // Blocked member Message
      if (update.isBlocked && update.isBlocked !== 0) {
        if (update.isBlocked === -1) { // Ban member
          io.to(`server_${serverId}`).emit('onMessage', {
            serverId: serverId,
            channelId: null,
            sender: {
              ...operatorMember,
              ...operator
            },
            receiver: {
              ...updatedUserMember,
              ...user
            },
            type: 'warn',
            content: 'blockedMemberMessage',
            timestamp: Date.now().valueOf(),
          });

        } else { // Timeout member
          io.to(`server_${serverId}`).emit('onMessage', {
            serverId: serverId,
            channelId: null,
            sender: {
              ...operatorMember, 
              ...operator
            },
            receiver: {
              ...updatedUserMember,
              ...user
            },
            type: 'warn',
            content: 'timeoutMemberMessage',
            timestamp: Date.now().valueOf(),
          });
        }
      }

      io.to(`server_${serverId}`).emit(
        'serverMemberUpdate',
        userId,
        serverId,
        update,
      );

      /* ========== End of Handling ========== */

      new Logger('UpdateMember').info(
        `User(${userId}) updated member(${serverId}) (Operator: ${operatorId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('UpdateMember').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `更新成員失敗，請稍後再試`,
          part: part,
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};

export const DeleteMemberHandler: SocketRequestHandler = {
  async handle(io: Server, socket: Socket, data: any) {
    const part = 'DELETEMEMBER';
    try {
      /* ========== Start of Handling ========== */

      let reason: string | null = null;

      const operatorId = socket.data.userId;

      const { userId, serverId } = await DataValidator.validate(
        DeleteMemberSchema,
        data,
        part,
      );

      const userMember = await database.get.member(userId, serverId);
      const operatorMember = await database.get.member(operatorId, serverId);

      if (operatorId !== userId) {
        if (operatorMember.permissionLevel < 3) {
          reason = 'Not enough permission';
        }

        if (operatorMember.permissionLevel <= userMember.permissionLevel) {
          reason = 'Permission lower than the target';
        }

        if (userMember.permissionLevel > 5) {
          reason = "Cannot delete group creator's member";
        }
      } else {
        reason = 'Cannot delete self member';
      }

      if (reason) {
        new Logger('DeleteMember').warn(
          `User(${userId}) failed to delete member(${serverId}) (Operator: ${operatorId}): ${reason}`,
        );
        return;
      }

      /* ========== Start of Main Logic ========== */

      // Delete member
      await database.delete.member(userId, serverId);

      // Send socket event
      const targetSocket =
        operatorId === userId ? socket : SocketServer.getSocket(userId);

      io.to(`server_${serverId}`).emit('serverMemberDelete', userId, serverId);

      if (targetSocket) {
        targetSocket.emit('serverDelete', serverId); // TODO: Need to kick user from server
      }

      /* ========== End of Handling ========== */

      new Logger('DeleteMember').info(
        `User(${userId}) deleted member(${serverId}) (Operator: ${operatorId})`,
      );
    } catch (error: any) {
      if (!(error instanceof StandardizedError)) {
        new Logger('DeleteMember').error(error.message);

        error = new StandardizedError({
          name: 'ServerError',
          message: `刪除成員失敗，請稍後再試`,
          part: part,
          tag: 'SERVER_ERROR',
          statusCode: 500,
        });
      }

      socket.emit('error', error);
    }
  },
};
