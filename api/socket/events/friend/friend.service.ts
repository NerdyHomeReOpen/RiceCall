// Error
import StandardizedError from '@/error';

// Database
import Database from '@/database';

export class CreateFriendService {
  constructor(
    private operatorId: string,
    private userId: string,
    private targetId: string,
    private preset: any,
  ) {
    this.operatorId = operatorId;
    this.userId = userId;
    this.targetId = targetId;
    this.preset = preset;
  }

  async use() {
    try {
      const friend = await Database.get.friend(this.userId, this.targetId);

      if (friend) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '你已經是對方的好友',
          part: 'CREATEFRIEND',
          tag: 'FRIEND_EXISTS',
          statusCode: 400,
        });
      }

      if (this.operatorId !== this.userId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法新增非自己的好友',
          part: 'CREATEFRIEND',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      if (this.userId === this.targetId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法將自己加入好友',
          part: 'CREATEFRIEND',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      // Create friend
      await Database.set.friend(this.userId, this.targetId, {
        ...this.preset,
        createdAt: Date.now(),
      });

      // Create friend (reverse)
      await Database.set.friend(this.targetId, this.userId, {
        ...this.preset,
        createdAt: Date.now(),
      });

      return {
        userFriendsUpdate: await Database.get.userFriends(this.userId),
        targetFriendsUpdate: await Database.get.userFriends(this.targetId),
      };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `建立好友時發生預期外的錯誤: ${error.message}`,
        part: 'CREATEFRIEND',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class UpdateFriendService {
  constructor(
    private operatorId: string,
    private userId: string,
    private targetId: string,
    private update: any,
  ) {
    this.operatorId = operatorId;
    this.userId = userId;
    this.targetId = targetId;
    this.update = update;
  }

  async use() {
    try {
      if (this.operatorId !== this.userId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法修改非自己的好友',
          part: 'UPDATEFRIEND',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      // Update friend
      await Database.set.friend(this.userId, this.targetId, this.update);

      return {
        userFriendsUpdate: await Database.get.userFriends(this.userId),
        targetFriendsUpdate: await Database.get.userFriends(this.targetId),
      };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `更新好友時發生預期外的錯誤: ${error.message}`,
        part: 'UPDATEFRIEND',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class DeleteFriendService {
  constructor(
    private operatorId: string,
    private userId: string,
    private targetId: string,
  ) {
    this.operatorId = operatorId;
    this.userId = userId;
    this.targetId = targetId;
  }

  async use() {
    try {
      if (this.operatorId !== this.userId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法刪除非自己的好友',
          part: 'DELETEFRIEND',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      // Delete friend
      await Database.delete.friend(this.userId, this.targetId);

      // Delete friend (reverse)
      await Database.delete.friend(this.targetId, this.userId);

      return {
        userFriendsUpdate: await Database.get.userFriends(this.userId),
        targetFriendsUpdate: await Database.get.userFriends(this.targetId),
      };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `刪除好友時發生預期外的錯誤: ${error.message}`,
        part: 'DELETEFRIEND',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
