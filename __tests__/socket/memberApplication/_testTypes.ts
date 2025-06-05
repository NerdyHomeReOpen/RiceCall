// MemberApplication 相關的測試類型定義

export interface MemberApplication {
  userId: string;
  serverId: string;
  description?: string;
  createdAt?: number;
}

export interface Member {
  userId: string;
  serverId: string;
  permissionLevel: number;
  nickname?: string | null;
  isBlocked: number;
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

export interface Server {
  serverId: string;
  ownerId: string;
  name: string;
  description?: string;
  createdAt?: number;
}

export interface ServerMemberApplication {
  userId: string;
  serverId: string;
  description?: string;
  createdAt?: number;
}

// 常用的訊息類型
export interface ActionMessage {
  serverId: string;
  type: 'info' | 'warning' | 'error';
  content: string;
}

export interface EventMessage {
  serverId: string;
  type: 'event';
  content: string;
}
