import { v4 as uuidv4 } from 'uuid';

// Error
import StandardizedError from '@/error';

// Database
import Database from '@/database';

export class CreateMemberService {
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
    const server = await Database.get.server(this.serverId);
    const operatorMember = await Database.get.member(
      this.operatorId,
      this.serverId,
    );

    if (this.operatorId !== this.userId) {
      if (operatorMember.permissionLevel < 5) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '你沒有足夠的權限新增成員',
          part: 'CREATEMEMBER',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }
      if (this.preset.permissionLevel >= operatorMember.permissionLevel) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法給予高於自己的權限',
          part: 'CREATEMEMBER',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }
      if (this.preset.permissionLevel > 5) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '權限等級過高',
          part: 'CREATEMEMBER',
          tag: 'PERMISSION_TOO_HIGH',
          statusCode: 403,
        });
      }
    } else {
      if (
        this.preset.permissionLevel !== 1 &&
        server.ownerId !== this.operatorId
      ) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '必須是遊客',
          part: 'CREATEMEMBER',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }
      if (
        this.preset.permissionLevel !== 6 &&
        server.ownerId === this.operatorId
      ) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '必須是群組創建者',
          part: 'CREATEMEMBER',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }
    }

    // Create member
    await Database.set.member(this.userId, this.serverId, {
      ...this.preset,
      createdAt: Date.now(),
    });

    return {
      memberAdd: await Database.get.member(this.userId, this.serverId),
      serverUpdate: await Database.get.serverMembers(this.serverId),
    };
  }
}

export class UpdateMemberService {
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
    const userMember = await Database.get.member(this.userId, this.serverId);
    const operatorMember = await Database.get.member(
      this.operatorId,
      this.serverId,
    );

    if (this.operatorId !== this.userId) {
      if (operatorMember.permissionLevel < 3) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '你沒有足夠的權限更改其他成員',
          part: 'UPDATEMEMBER',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      if (operatorMember.permissionLevel <= userMember.permissionLevel) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '你沒有足夠的權限編輯權限高於自己的成員',
          part: 'UPDATEMEMBER',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      if (userMember.permissionLevel > 5) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法更改群組創建者的權限',
          part: 'UPDATEMEMBER',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      if (
        userMember.permissionLevel === 1 &&
        this.update.permissionLevel &&
        operatorMember.permissionLevel < 5
      ) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '你沒有足夠的權限更改遊客的權限',
          part: 'UPDATEMEMBER',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      if (
        this.update.permissionLevel === 1 &&
        operatorMember.permissionLevel < 5
      ) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '你沒有足夠的權限更改會員至遊客',
          part: 'UPDATEMEMBER',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      if (this.update.nickname && operatorMember.permissionLevel < 5) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '你沒有足夠的權限更改其他成員的暱稱',
          part: 'UPDATEMEMBER',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      if (this.update.permissionLevel >= operatorMember.permissionLevel) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法給予高於自己的權限',
          part: 'UPDATEMEMBER',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      if (this.update.permissionLevel > 5) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '權限等級過高',
          part: 'UPDATEMEMBER',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }
    } else {
      if (this.update.permissionLevel) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法更改自己的權限',
          part: 'UPDATEMEMBER',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }
    }

    // Update member
    await Database.set.member(this.userId, this.serverId, this.update);

    return {};
  }
}

export class DeleteMemberService {
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
    const userMember = await Database.get.member(this.userId, this.serverId);
    const operatorMember = await Database.get.member(
      this.operatorId,
      this.serverId,
    );

    if (this.operatorId !== this.userId) {
      if (operatorMember.permissionLevel < 3) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '你沒有足夠的權限刪除其他成員',
          part: 'DELETEMEMBER',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      if (operatorMember.permissionLevel <= userMember.permissionLevel) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '你沒有足夠的權限刪除權限高於自己的成員',
          part: 'DELETEMEMBER',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }

      if (userMember.permissionLevel > 5) {
        throw new StandardizedError({
          name: 'PermissionError',
          message: '無法刪除群組創建者',
          part: 'DELETEMEMBER',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
      }
    } else {
      throw new StandardizedError({
        name: 'PermissionError',
        message: '無法刪除自己的成員',
        part: 'DELETEMEMBER',
        tag: 'PERMISSION_DENIED',
        statusCode: 403,
      });
    }

    // Delete member
    await Database.delete.member(this.userId, this.serverId);

    return {};
  }
}
