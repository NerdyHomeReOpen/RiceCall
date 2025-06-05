// Server 相關的測試類型定義

// 基礎資料類型
export interface User {
  userId: string;
  username: string;
  email?: string;
  displayName?: string;
  level: number;
  currentServerId?: string | null;
  currentChannelId?: string | null;
  lastActiveAt?: number;
}

export interface Server {
  serverId: string;
  name: string;
  description?: string;
  type: 'game' | 'entertainment' | 'study' | 'other';
  visibility: 'public' | 'private' | 'invisible';
  displayId?: string;
  ownerId: string;
  lobbyId?: string;
  receptionLobbyId?: string;
  createdAt?: number;
}

export interface Member {
  userId: string;
  serverId: string;
  permissionLevel: number;
  nickname?: string | null;
  isBlocked: number;
  createdAt?: number;
  lastMessageTime?: number;
}

export interface Channel {
  channelId: string;
  serverId: string;
  categoryId?: string | null;
  name: string;
  description?: string;
  isLobby?: boolean;
  createdAt?: number;
}

export interface UserServer {
  userId: string;
  serverId: string;
  owned?: boolean;
  favorite?: boolean;
  recent?: boolean;
  timestamp?: number;
}

// 請求資料結構
export interface CreateServerRequest {
  server: {
    name: string;
    description?: string;
    type: 'game' | 'entertainment' | 'study' | 'other';
    visibility: 'public' | 'private' | 'invisible';
  };
}

export interface ConnectServerRequest {
  userId: string;
  serverId: string;
}

export interface DisconnectServerRequest {
  userId: string;
  serverId: string;
}

export interface UpdateServerRequest {
  serverId: string;
  server: {
    name?: string;
    description?: string;
    type?: 'game' | 'entertainment' | 'study' | 'other';
    visibility?: 'public' | 'private' | 'invisible';
  };
}

export interface SearchServerRequest {
  query: string;
}

export interface FavoriteServerRequest {
  serverId: string;
  favorite?: boolean;
}

// 回應資料結構
export interface ServerSearchResult {
  serverId: string;
  name: string;
  description?: string;
  type: string;
  visibility: string;
  displayId?: string;
}

export interface MemberData {
  userId: string;
  serverId: string;
  permissionLevel: number;
  nickname?: string | null;
  isBlocked: number;
  username?: string;
  displayName?: string;
}
