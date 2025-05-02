// Database
import Database from '@/database';

export class RefreshUserService {
  constructor(private userId: string) {
    this.userId = userId;
  }

  async use() {
    const user = await Database.get.user(this.userId);
    return user;
  }
}

export class RefreshUserFriendApplicationsService {
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

export class RefreshUserFriendGroupsService {
  constructor(private userId: string) {
    this.userId = userId;
  }

  async use() {
    const userFriendGroups = await Database.get.userFriendGroups(this.userId);
    return userFriendGroups;
  }
}

export class RefreshUserFriendsService {
  constructor(private userId: string) {
    this.userId = userId;
  }

  async use() {
    const userFriends = await Database.get.userFriends(this.userId);
    return userFriends;
  }
}

export class RefreshUserServersService {
  constructor(private userId: string) {
    this.userId = userId;
  }

  async use() {
    const userServers = await Database.get.userServers(this.userId);
    return userServers;
  }
}
