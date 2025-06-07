// Member 相關的測試類型定義

export interface Member {
  userId: string;
  serverId: string;
  permissionLevel: number;
  nickname?: string | null;
  isBlocked: number;
  createdAt?: number;
}

export interface Server {
  serverId: string;
  ownerId: string;
  name: string;
  description?: string;
  createdAt?: number;
}

export interface User {
  userId: string;
  username: string;
  email?: string;
  displayName?: string;
  currentServerId?: string | null;
  currentChannelId?: string | null;
  lastActiveAt?: number;
}

export interface UserServer {
  userId: string;
  serverId: string;
  timestamp: number;
}

export interface ServerMember {
  userId: string;
  serverId: string;
  permissionLevel: number;
  nickname?: string | null;
  isBlocked: number;
}

export interface MemberApplication {
  userId: string;
  serverId: string;
  message?: string;
  createdAt?: number;
}
