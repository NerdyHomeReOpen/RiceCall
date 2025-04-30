// Database
import Database from '@/database';

export default class RefreshUserService {
  constructor(private userId: string) {
    this.userId = userId;
  }

  async use() {
    const user = await Database.get.user(this.userId);
    return user;
  }
}
