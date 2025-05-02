// Database
import Database from '@/database';

export class RefreshServerService {
  constructor(private serverId: string) {
    this.serverId = serverId;
  }

  async use() {
    const server = await Database.get.server(this.serverId);
    return server;
  }
}

export class RefreshServerChannelsService {
  constructor(private serverId: string) {
    this.serverId = serverId;
  }

  async use() {
    const serverChannels = await Database.get.serverChannels(this.serverId);
    return serverChannels;
  }
}

export class RefreshServerMemberApplicationsService {
  constructor(private serverId: string) {
    this.serverId = serverId;
  }

  async use() {
    const serverMemberApplications =
      await Database.get.serverMemberApplications(this.serverId);
    return serverMemberApplications;
  }
}

export class RefreshServerMembersService {
  constructor(private serverId: string) {
    this.serverId = serverId;
  }

  async use() {
    const serverMembers = await Database.get.serverMembers(this.serverId);
    return serverMembers;
  }
}
