// FriendGroup 相關的測試類型定義

export interface FriendGroup {
  friendGroupId?: string;
  userId: string;
  name: string;
  order?: number;
  createdAt?: number;
}

export interface User {
  userId: string;
  username: string;
  email: string;
  currentServerId?: string | null;
  currentChannelId?: string | null;
  lastActiveAt?: number;
}

export interface Friend {
  userId: string;
  targetId: string;
  isBlocked: boolean;
  friendGroupId?: string | null;
  createdAt?: number;
}

export interface FriendGroupFriend {
  userId: string;
  targetId: string;
  friendGroupId: string;
}
