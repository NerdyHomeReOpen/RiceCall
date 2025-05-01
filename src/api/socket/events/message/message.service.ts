// Error
import StandardizedError from '@/error';

// Database
import Database from '@/database';

export class SendMessageService {
  constructor(
    private operatorId: string,
    private userId: string,
    private serverId: string,
    private channelId: string,
    private message: any,
  ) {
    this.operatorId = operatorId;
    this.userId = userId;
    this.serverId = serverId;
    this.channelId = channelId;
    this.message = message;
  }

  async use() {
    const channel = await Database.get.channel(this.channelId);
    const operatorMember = await Database.get.member(
      this.operatorId,
      this.serverId,
    );

    if (this.operatorId !== this.userId) {
      throw new StandardizedError({
        name: 'PermissionError',
        message: '無法傳送非自己的訊息',
        part: 'SENDMESSAGE',
        tag: 'PERMISSION_DENIED',
        statusCode: 403,
      });
    }

    if (channel.forbidGuestUrl && operatorMember.permissionLevel === 1) {
      this.message.content = this.message.content.replace(
        /https?:\/\/[^\s]+/g,
        '{{GUEST_SEND_AN_EXTERNAL_LINK}}',
      );
    }

    // Create new message
    const message = {
      ...this.message,
      ...(await Database.get.member(this.userId, this.serverId)),
      ...(await Database.get.user(this.userId)),
      senderId: this.userId,
      serverId: this.serverId,
      channelId: this.channelId,
      timestamp: Date.now().valueOf(),
    };

    // Update member
    const updatedMember = {
      lastMessageTime: Date.now().valueOf(),
    };
    await Database.set.member(this.operatorId, this.serverId, updatedMember);

    return {
      onMessage: message,
      serverUpdate: updatedMember,
    };
  }
}

export class SendDirectMessageService {
  constructor(
    private operatorId: string,
    private userId: string,
    private targetId: string,
    private directMessage: any,
  ) {
    this.operatorId = operatorId;
    this.userId = userId;
    this.targetId = targetId;
    this.directMessage = directMessage;
  }

  async use() {
    if (this.operatorId !== this.userId) {
      throw new StandardizedError({
        name: 'PermissionError',
        message: '無法傳送非自己的私訊',
        part: 'SENDDIRECTMESSAGE',
        tag: 'PERMISSION_DENIED',
        statusCode: 403,
      });
    }

    // Create new message
    const directMessage = {
      ...this.directMessage,
      ...(await Database.get.user(this.userId)),
      senderId: this.userId,
      user1Id:
        this.userId.localeCompare(this.targetId) < 0
          ? this.userId
          : this.targetId,
      user2Id:
        this.userId.localeCompare(this.targetId) < 0
          ? this.targetId
          : this.userId,
      timestamp: Date.now().valueOf(),
    };

    return {
      onDirectMessage: directMessage,
    };
  }
}
