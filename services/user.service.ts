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
    Database.set.user(userId, {
      lastActiveAt: Date.now(),
    });
  }

  async disconnectUser(userId: string) {
    Database.set.user(userId, {
      lastActiveAt: null,
    });
  }

  async updateUser(userId: string, data: any) {
    return Database.set.user(userId, data);
  }

  async createUser(data: any) {
    return Database.set.user(data.userId, data);
  }

  async deleteUser(userId: string) {
    return Database.delete.user(userId);
  }
}
