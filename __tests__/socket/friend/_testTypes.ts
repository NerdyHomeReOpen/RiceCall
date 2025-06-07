// Friend 相關的測試類型定義

export interface Friend {
  userId: string;
  targetId: string;
  isBlocked: boolean;
  friendGroupId: string | null;
  createdAt?: number;
}

export interface FriendGroup {
  friendGroupId: string;
  userId: string;
  name: string;
  createdAt: number;
}

export interface User {
  userId: string;
  username: string;
  email: string;
  currentServerId?: string | null;
  currentChannelId?: string | null;
  lastActiveAt?: number;
}

export interface FriendApplication {
  applicationId: string;
  senderId: string;
  receiverId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}
