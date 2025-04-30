// Database
import Database from '@/database';

export default class RefreshUserServersService {
  constructor(private userId: string) {
    this.userId = userId;
  }

  async use() {
    const userServers = await Database.get.userServers(this.userId);
    return userServers;
  }
}
