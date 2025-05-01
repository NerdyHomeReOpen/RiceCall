import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

// Error
import StandardizedError from '@/error';

// Database
import Database from '@/database';

// Systems
import xpSystem from '@/systems/xp';

// Handlers
import {
  ConnectChannelHandler,
  DisconnectChannelHandler,
} from '@/api/socket/events/channel/channel.handler';
import {
  RTCJoinHandler,
  RTCLeaveHandler,
} from '@/api/socket/events/rtc/rtc.handler';

export class ConnectChannelService {
  constructor(
    private operatorId: string,
    private userId: string,
    private channelId: string,
    private serverId: string,
    private password?: string,
  ) {
    this.operatorId = operatorId;
    this.userId = userId;
    this.channelId = channelId;
    this.serverId = serverId;
    this.password = password;
  }

  async use() {
    const actions: any[] = [];
    const user = await Database.get.user(this.userId);
    const server = await Database.get.server(this.serverId);
    const channel = await Database.get.channel(this.channelId);
    const channelUsers = await Database.get.channelUsers(this.channelId);
    const userMember = await Database.get.member(this.userId, this.serverId);
    const operatorMember = await Database.get.member(
      this.operatorId,
      this.serverId,
    );

    if (!channel.isLobby) {
      if (this.operatorId !== this.userId) {
        if (
          operatorMember.permissionLevel < 5 ||
          operatorMember.permissionLevel <= userMember.permissionLevel
        ) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '你沒有足夠的權限移動其他用戶',
            part: 'CONNECTCHANNEL',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
        if (channel.visibility === 'readonly') {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '該頻道為唯獨頻道',
            part: 'CONNECTCHANNEL',
            tag: 'CHANNEL_IS_READONLY',
            statusCode: 403,
          });
        }
        if (user.currentServerId !== this.serverId) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '用戶不在該語音群中',
            part: 'CONNECTCHANNEL',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
      } else {
        if (channel.visibility === 'readonly') {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '該頻道為唯獨頻道',
            part: 'CONNECTCHANNEL',
            tag: 'CHANNEL_IS_READONLY',
            statusCode: 403,
          });
        }
        if (
          (server.visibility === 'private' ||
            channel.visibility === 'member') &&
          operatorMember.permissionLevel < 2
        ) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '你需要成為該群組的會員才能加入該頻道',
            part: 'CONNECTCHANNEL',
            tag: 'PERMISSION_DENIED',
            statusCode: 403,
          });
        }
        if (
          channel.password &&
          this.password !== channel.password &&
          operatorMember.permissionLevel < 3
        ) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '你需要輸入正確的密碼才能加入該頻道',
            part: 'CONNECTCHANNEL',
            tag: 'PASSWORD_INCORRECT',
            statusCode: 403,
          });
        }
        if (
          channel.userLimit &&
          channelUsers &&
          channelUsers.length >= channel.userLimit &&
          operatorMember.permissionLevel < 5
        ) {
          throw new StandardizedError({
            name: 'PermissionError',
            message: '該頻道已達人數上限',
            part: 'CONNECTCHANNEL',
            tag: 'CHANNEL_USER_LIMIT_REACHED',
            statusCode: 403,
          });
        }
      }
    }

    // Update user
    const updatedUser = {
      currentServerId: this.serverId,
      currentChannelId: this.channelId,
      lastActiveAt: Date.now(),
    };
    await Database.set.user(this.userId, updatedUser);

    // Update Member
    const updatedMember = {
      lastJoinChannelTime: Date.now(),
    };
    await Database.set.member(this.userId, this.serverId, updatedMember);

    // Disconnect previous channel
    if (user.currentChannelId) {
      // Leave RTC channel
      actions.push({
        handler: (io: Server, socket: Socket) =>
          new RTCLeaveHandler(io, socket),
        data: {
          channelId: user.currentChannelId,
        },
      });
    } else {
      // Setup user xp interval
      await xpSystem.create(this.userId);
    }

    // Join RTC channel
    actions.push({
      handler: (io: Server, socket: Socket) => new RTCJoinHandler(io, socket),
      data: {
        channelId: this.channelId,
      },
    });

    return {
      userUpdate: updatedUser,
      memberUpdate: updatedUser,
      actions,
    };
  }
}

export class DisconnectChannelService {
  constructor(
    private operatorId: string,
    private userId: string,
    private channelId: string,
    private serverId: string,
  ) {
    this.operatorId = operatorId;
    this.userId = userId;
    this.channelId = channelId;
    this.serverId = serverId;
  }

  async use() {
    const actions: any[] = [];
    const userMember = await Database.get.member(this.userId, this.serverId);
    const operatorMember = await Database.get.member(
      this.operatorId,
      this.serverId,
    );

    if (this.operatorId !== this.userId) {
      if (
        operatorMember.permissionLevel < 5 ||
        operatorMember.permissionLevel <= userMember.permissionLevel
      )
        throw new StandardizedError({
          name: 'PermissionError',
          message: '你沒有足夠的權限踢除其他用戶',
          part: 'DISCONNECTCHANNEL',
          tag: 'PERMISSION_DENIED',
          statusCode: 403,
        });
    }

    // Update user
    const updatedUser = {
      currentServerId: null,
      currentChannelId: null,
      lastActiveAt: Date.now(),
    };
    await Database.set.user(this.userId, updatedUser);

    // Clear user xp interval
    await xpSystem.delete(this.userId);

    // Leave RTC channel
    actions.push({
      handler: (io: Server, socket: Socket) => new RTCLeaveHandler(io, socket),
      data: {
        channelId: this.channelId,
      },
    });

    return {
      userUpdate: updatedUser,
      memberUpdate: updatedUser,
      actions,
    };
  }
}

export class CreateChannelService {
  constructor(
    private operatorId: string,
    private serverId: string,
    private channel: any,
  ) {
    this.operatorId = operatorId;
    this.serverId = serverId;
    this.channel = channel;
  }

  async use() {
    const category = await Database.get.channel(this.channel.categoryId);
    const serverChannels = await Database.get.serverChannels(this.serverId);
    const operatorMember = await Database.get.member(
      this.operatorId,
      this.serverId,
    );

    if (operatorMember.permissionLevel < 5) {
      throw new StandardizedError({
        name: 'PermissionError',
        message: '你沒有足夠的權限創建頻道',
        part: 'CREATECHANNEL',
        tag: 'PERMISSION_DENIED',
        statusCode: 403,
      });
    }

    if (category && category.categoryId) {
      throw new StandardizedError({
        name: 'PermissionError',
        message: '無法在二級頻道下創建頻道',
        part: 'CREATECHANNEL',
        tag: 'PERMISSION_DENIED',
        statusCode: 403,
      });
    }

    if (category && !category.categoryId) {
      await Database.set.channel(category.channelId, {
        type: 'category',
      });
    }

    // Create new channel
    const channelId = uuidv4();
    await Database.set.channel(channelId, {
      ...this.channel,
      serverId: this.serverId,
      order: serverChannels
        ? serverChannels.filter((ch: any) =>
            this.channel.categoryId
              ? ch.categoryId === this.channel.categoryId
              : !ch.categoryId,
          ).length
        : 0,
      createdAt: Date.now(),
    });

    return {
      channelAdd: await Database.get.channel(channelId),
    };
  }
}

export class UpdateChannelService {
  constructor(
    private operatorId: string,
    private serverId: string,
    private channelId: string,
    private update: any,
  ) {
    this.operatorId = operatorId;
    this.serverId = serverId;
    this.channelId = channelId;
    this.update = update;
  }

  async use() {
    const messages: any[] = [];
    const channel = await Database.get.channel(this.channelId);
    const operatorMember = await Database.get.member(
      this.operatorId,
      this.serverId,
    );

    if (operatorMember.permissionLevel < 5) {
      throw new StandardizedError({
        name: 'PermissionError',
        message: '你沒有足夠的權限編輯頻道',
        part: 'UPDATECHANNEL',
        tag: 'PERMISSION_DENIED',
        statusCode: 403,
      });
    }

    if (this.update.voiceMode !== channel.voiceMode) {
      messages.push({
        message: {
          type: 'info',
          content:
            this.update.voiceMode === 'free'
              ? 'VOICE_CHANGE_TO_FREE_SPEECH'
              : this.update.voiceMode === 'forbidden'
              ? 'VOICE_CHANGE_TO_FORBIDDEN_SPEECH'
              : 'VOICE_CHANGE_TO_QUEUE',
          timestamp: Date.now().valueOf(),
        },
        userId: this.operatorId,
        serverId: this.serverId,
        channelId: this.channelId,
      });
    }

    if (this.update.forbidText !== channel.forbidText) {
      messages.push({
        message: {
          type: 'info',
          content: this.update.forbidText
            ? 'TEXT_CHANGE_TO_FORBIDDEN_SPEECH'
            : 'TEXT_CHANGE_TO_FREE_SPEECH',
          timestamp: Date.now().valueOf(),
        },
        userId: this.operatorId,
        serverId: this.serverId,
        channelId: this.channelId,
      });
    }

    if (this.update.forbidGuestText !== channel.forbidGuestText) {
      messages.push({
        message: {
          type: 'info',
          content: this.update.forbidGuestText
            ? 'TEXT_CHANGE_TO_FORBIDDEN_TEXT'
            : 'TEXT_CHANGE_TO_ALLOWED_TEXT',
          timestamp: Date.now().valueOf(),
        },
        userId: this.operatorId,
        serverId: this.serverId,
        channelId: this.channelId,
      });
    }

    if (this.update.forbidGuestUrl !== channel.forbidGuestUrl) {
      messages.push({
        message: {
          type: 'info',
          content: this.update.forbidGuestUrl
            ? 'TEXT_CHANGE_TO_FORBIDDEN_URL'
            : 'TEXT_CHANGE_TO_ALLOWED_URL',
          timestamp: Date.now().valueOf(),
        },
        userId: this.operatorId,
        serverId: this.serverId,
        channelId: this.channelId,
      });
    }

    if (this.update.guestTextMaxLength !== channel.guestTextMaxLength) {
      messages.push({
        message: {
          type: 'info',
          content: `TEXT_CHANGE_TO_MAX_LENGTH ${this.update.guestTextMaxLength}`,
          timestamp: Date.now().valueOf(),
        },
        userId: this.operatorId,
        serverId: this.serverId,
        channelId: this.channelId,
      });
    }

    if (this.update.guestTextWaitTime !== channel.guestTextWaitTime) {
      messages.push({
        message: {
          type: 'info',
          content: `TEXT_CHANGE_TO_WAIT_TIME ${this.update.guestTextWaitTime}`,
          timestamp: Date.now().valueOf(),
        },
        userId: this.operatorId,
        serverId: this.serverId,
        channelId: this.channelId,
      });
    }

    if (this.update.guestTextGapTime !== channel.guestTextGapTime) {
      messages.push({
        message: {
          type: 'info',
          content: `TEXT_CHANGE_TO_GAP_TIME ${this.update.guestTextGapTime}`,
          timestamp: Date.now().valueOf(),
        },
        userId: this.operatorId,
        serverId: this.serverId,
        channelId: this.channelId,
      });
    }

    // Update channel
    await Database.set.channel(this.channelId, this.update);

    return {
      channelUpdate: this.update,
      onMessage: messages,
    };
  }
}

export class DeleteChannelService {
  constructor(
    private operatorId: string,
    private serverId: string,
    private channelId: string,
  ) {
    this.operatorId = operatorId;
    this.serverId = serverId;
    this.channelId = channelId;
  }

  async use() {
    const actions: any[] = [];
    const channel = await Database.get.channel(this.channelId);
    const channelUsers = await Database.get.channelUsers(this.channelId);
    const channelChildren = await Database.get.channelChildren(this.channelId);
    const operatorMember = await Database.get.member(
      this.operatorId,
      this.serverId,
    );

    if (operatorMember.permissionLevel < 5) {
      throw new StandardizedError({
        name: 'PermissionError',
        message: '你沒有足夠的權限刪除頻道',
        part: 'DELETECHANNEL',
        tag: 'PERMISSION_DENIED',
        statusCode: 403,
      });
    }

    if (channel.categoryId) {
      const categoryChildren = await Database.get.channelChildren(
        channel.categoryId,
      );
      if (categoryChildren && categoryChildren.length <= 1) {
        await Database.set.channel(channel.categoryId, {
          type: 'channel',
        });
      }
    }

    if (channelChildren && channelChildren.length) {
      const serverChannels = await Database.get.serverChannels(this.serverId);
      await Promise.all(
        channelChildren.map(
          async (child: any, index: number) =>
            await Database.set.channel(child.channelId, {
              categoryId: null,
              order: serverChannels ? serverChannels.length + index : 0,
            }),
        ),
      );
    }

    if (channelUsers && channelUsers.length) {
      const server = await Database.get.server(this.serverId);
      channelUsers.map((user: any) =>
        actions.push({
          handler: (io: Server, socket: Socket) =>
            new ConnectChannelHandler(io, socket),
          data: {
            userId: user.userId,
            channelId: server.lobbyId,
            serverId: this.serverId,
          },
        }),
      );
    }

    // Delete channel
    await Database.delete.channel(this.channelId);

    return {
      actions,
    };
  }
}
