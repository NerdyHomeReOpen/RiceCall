import { v4 as uuidv4 } from 'uuid';

// Error
import StandardizedError from '@/error';

// Database
import Database from '@/database';

export class CreateFriendGroupService {
  constructor(
    private operatorId: string,
    private userId: string,
    private preset: any,
  ) {
    this.operatorId = operatorId;
    this.userId = userId;
    this.preset = preset;
  }

  async use() {
    try {
      if (this.operatorId !== this.userId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法新增非自己的好友群組',
          part: 'CREATEFRIENDGROUP',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      // Create friend group
      const friendGroupId = uuidv4();
      await Database.set.friendGroup(friendGroupId, {
        ...this.preset,
        userId: this.userId,
        createdAt: Date.now(),
      });

      return {
        friendGroupsUpdate: await Database.get.userFriendGroups(this.userId),
      };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `新增好友群組時發生預期外的錯誤: ${error.message}`,
        part: 'CREATEFRIENDGROUP',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class UpdateFriendGroupService {
  constructor(
    private operatorId: string,
    private userId: string,
    private friendGroupId: string,
    private update: any,
  ) {
    this.operatorId = operatorId;
    this.userId = userId;
    this.friendGroupId = friendGroupId;
    this.update = update;
  }

  async use() {
    try {
      if (this.operatorId !== this.userId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法更新非自己的好友群組',
          part: 'UPDATEFRIENDGROUP',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      // Update friend group
      await Database.set.friendGroup(this.friendGroupId, this.update);

      return {
        friendGroupsUpdate: await Database.get.userFriendGroups(this.userId),
      };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `更新好友群組時發生預期外的錯誤: ${error.message}`,
        part: 'UPDATEFRIENDGROUP',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class DeleteFriendGroupService {
  constructor(
    private operatorId: string,
    private userId: string,
    private friendGroupId: string,
  ) {
    this.operatorId = operatorId;
    this.userId = userId;
    this.friendGroupId = friendGroupId;
  }

  async use() {
    try {
      if (this.operatorId !== this.userId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法刪除非自己的好友群組',
          part: 'DELETEFRIENDGROUP',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      // Delete friend group
      await Database.delete.friendGroup(this.friendGroupId);

      return {
        friendGroupsUpdate: await Database.get.userFriendGroups(this.userId),
      };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `刪除好友群組時發生預期外的錯誤: ${error.message}`,
        part: 'DELETEFRIENDGROUP',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
