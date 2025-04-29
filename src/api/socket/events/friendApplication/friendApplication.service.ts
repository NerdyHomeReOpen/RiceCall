// Error
import StandardizedError from '@/error';

// Database
import Database from '@/src/database';

export class CreateFriendApplicationService {
  constructor(
    private operatorId: string,
    private senderId: string,
    private receiverId: string,
    private preset: any,
  ) {
    this.operatorId = operatorId;
    this.senderId = senderId;
    this.receiverId = receiverId;
    this.preset = preset;
  }

  async use() {
    try {
      const friendApplication = await Database.get.friendApplication(
        this.senderId,
        this.receiverId,
      );

      if (friendApplication) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '你已經發送過好友申請',
          part: 'CREATEFRIENDAPPLICATION',
          tag: 'FRIENDAPPLICATION_EXISTS',
          statusCode: 400,
        });
      }

      if (this.operatorId !== this.senderId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法新增非自己的好友',
          part: 'CREATEFRIEND',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      if (this.senderId === this.receiverId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法將自己加入好友',
          part: 'CREATEFRIEND',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      // Create friend application
      await Database.set.friendApplication(this.senderId, this.receiverId, {
        ...this.preset,
        createdAt: Date.now(),
      });

      return {
        friendApplicationsUpdate: await Database.get.userFriendApplications(
          this.senderId,
        ),
      };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `建立好友申請時發生預期外的錯誤: ${error.message}`,
        part: 'CREATEFRIENDAPPLICATION',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class UpdateFriendApplicationService {
  constructor(
    private operatorId: string,
    private senderId: string,
    private receiverId: string,
    private update: any,
  ) {
    this.operatorId = operatorId;
    this.senderId = senderId;
    this.receiverId = receiverId;
    this.update = update;
  }

  async use() {
    try {
      if (this.operatorId !== this.senderId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法修改非自己的好友申請',
          part: 'UPDATEFRIENDAPPLICATION',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      // Update friend application
      await Database.set.friendApplication(
        this.senderId,
        this.receiverId,
        this.update,
      );

      return {
        friendApplicationsUpdate: await Database.get.userFriendApplications(
          this.senderId,
        ),
      };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `更新好友申請時發生預期外的錯誤: ${error.message}`,
        part: 'UPDATEFRIENDAPPLICATION',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class DeleteFriendApplicationService {
  constructor(
    private operatorId: string,
    private senderId: string,
    private receiverId: string,
  ) {
    this.operatorId = operatorId;
    this.senderId = senderId;
    this.receiverId = receiverId;
  }

  async use() {
    try {
      if (this.operatorId !== this.senderId) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法刪除非自己的好友申請',
          part: 'DELETEFRIENDAPPLICATION',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      // Delete friend application
      await Database.delete.friendApplication(this.senderId, this.receiverId);

      return {
        friendApplicationsUpdate: await Database.get.userFriendApplications(
          this.senderId,
        ),
      };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `刪除好友申請時發生預期外的錯誤: ${error.message}`,
        part: 'DELETEFRIENDAPPLICATION',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
