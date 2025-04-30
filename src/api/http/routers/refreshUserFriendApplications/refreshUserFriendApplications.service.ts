// Database
import Database from '@/database';

export default class RefreshUserFriendApplicationsService {
  constructor(private userId: string) {
    this.userId = userId;
  }

  async use() {
    const userFriendApplications = await Database.get.userFriendApplications(
      this.userId,
    );
    return userFriendApplications;
  }
}
