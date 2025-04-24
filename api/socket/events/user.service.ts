// Database
import Database from '@/database';

export default class UserService {
  async searchUser(query: string) {
    const users = await Database.get.searchUser(query);

    return users;
  }

  async getUser(userId: string) {
    const user = await Database.get.user(userId);

    return user;
  }

  async connectUser(userId: string) {
    const user = await Database.get.user(userId);

    // Reconnect user to server and channel
    if (user.currentServerId) {
      await ServerService.connectServer(user.currentServerId, user.userId);
    }
    if (user.currentChannelId) {
      await ChannelService.connectChannel(
        user.currentChannelId,
        user.currentServerId,
        user.userId,
      );
    }

    await Database.set.user(userId, {
      lastActiveAt: Date.now(),
    });

    return user;
  }

  async disconnectUser(userId: string) {
    const user = await Database.get.user(userId);

    // Disconnect user from server and channel
    if (user.currentServerId) {
      await ServerService.disconnectServer(user.currentServerId, user.userId);
    }
    if (user.currentChannelId) {
      await ChannelService.disconnectChannel(
        user.currentChannelId,
        user.currentServerId,
        user.userId,
      );
    }

    await Database.set.user(userId, {
      lastActiveAt: Date.now(),
    });
  }

  async updateUser(userId: string, data: any) {
    await Database.set.user(userId, data);

    return data;
  }
}
