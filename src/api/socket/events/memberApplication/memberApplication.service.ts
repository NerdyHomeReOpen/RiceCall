// Error
import StandardizedError from '@/error';

// Database
import Database from '@/src/database';

export class CreateMemberApplicationService {
  constructor(
    private operatorId: string,
    private userId: string,
    private serverId: string,
    private preset: any,
  ) {
    this.operatorId = operatorId;
    this.userId = userId;
    this.serverId = serverId;
    this.preset = preset;
  }

  async use() {
    try {
      const operatorMember = await Database.get.member(
        this.operatorId,
        this.serverId,
      );

      if (this.operatorId !== this.userId) {
        throw new StandardizedError({
          name: 'ValidationError',
          message: '無法創建非自己的會員申請',
          part: 'CREATEMEMBERAPPLICATION',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      } else {
        if (operatorMember.permissionLevel !== 1) {
          throw new StandardizedError({
            name: 'ValidationError',
            message: '非遊客無法創建會員申請',
            part: 'CREATEMEMBERAPPLICATION',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
      }

      // Create member application
      await Database.set.memberApplication(this.userId, this.serverId, {
        ...this.preset,
        createdAt: Date.now(),
      });

      return {
        serverMemberApplicationsUpdate:
          await Database.get.serverMemberApplications(this.serverId),
      };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `創建會員申請時發生預期外的錯誤: ${error.message}`,
        part: 'CREATEMEMBERAPPLICATION',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class UpdateMemberApplicationService {
  constructor(
    private operatorId: string,
    private userId: string,
    private serverId: string,
    private update: any,
  ) {
    this.operatorId = operatorId;
    this.userId = userId;
    this.serverId = serverId;
    this.update = update;
  }

  async use() {
    try {
      const operatorMember = await Database.get.member(
        this.operatorId,
        this.serverId,
      );

      if (this.operatorId !== this.userId) {
        if (operatorMember.permissionLevel < 5) {
          throw new StandardizedError({
            name: 'ValidationError',
            message: '你沒有足夠的權限更新其他成員的會員申請',
            part: 'UPDATEMEMBERAPPLICATION',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
      }

      // Update member application
      await Database.set.memberApplication(
        this.userId,
        this.serverId,
        this.update,
      );

      return {
        serverMemberApplicationsUpdate:
          await Database.get.serverMemberApplications(this.serverId),
      };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `更新會員申請時發生預期外的錯誤: ${error.message}`,
        part: 'UPDATEMEMBERAPPLICATION',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}

export class DeleteMemberApplicationService {
  constructor(
    private operatorId: string,
    private userId: string,
    private serverId: string,
  ) {
    this.operatorId = operatorId;
    this.userId = userId;
    this.serverId = serverId;
  }

  async use() {
    try {
      const operatorMember = await Database.get.member(
        this.operatorId,
        this.serverId,
      );

      if (this.operatorId !== this.userId) {
        if (operatorMember.permissionLevel < 5) {
          throw new StandardizedError({
            name: 'ValidationError',
            message: '你沒有足夠的權限刪除其他成員的會員申請',
            part: 'DELETEMEMBERAPPLICATION',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
      }

      // Delete member application
      await Database.delete.memberApplication(this.userId, this.serverId);

      return {
        serverMemberApplicationsUpdate:
          await Database.get.serverMemberApplications(this.serverId),
      };
    } catch (error: any) {
      throw new StandardizedError({
        name: 'ServerError',
        message: `刪除會員申請時發生預期外的錯誤: ${error.message}`,
        part: 'DELETEMEMBERAPPLICATION',
        tag: 'SERVER_ERROR',
        statusCode: 500,
      });
    }
  }
}
