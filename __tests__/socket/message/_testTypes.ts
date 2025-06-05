// Message 相關的測試類型定義

export interface User {
  userId: string;
  username: string;
  email?: string;
  displayName?: string;
  currentServerId?: string | null;
  currentChannelId?: string | null;
  lastActiveAt?: number;
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
  forbidGuestUrl: boolean;
  createdAt?: number;
}

export interface ServerChannel {
  channelId: string;
  serverId: string;
  categoryId?: string | null;
  name: string;
  description?: string;
}

export interface Friend {
  userId: string;
  friendId: string;
  friendGroupId: string;
  displayName?: string;
  addedAt: number;
}

export interface UserFriend {
  userId: string;
  friendId: string;
  friendGroupId: string;
  displayName?: string;
  addedAt: number;
}

// 訊息相關類型
export interface MessageContent {
  content: string;
  type: 'general' | 'image' | 'file' | 'url';
}

export interface DirectMessageContent {
  content: string;
  type: 'dm' | 'image' | 'file';
}

export interface ActionMessageContent {
  content: string;
  type: 'info' | 'warning' | 'error' | 'alert';
}

export interface MessageData {
  content: string;
  type: string;
  sender: any;
  receiver: any;
  serverId: string;
  channelId?: string | null;
  timestamp: number;
}

export interface DirectMessageData {
  content: string;
  type: string;
  senderId: string;
  user1Id: string;
  user2Id: string;
  timestamp: number;
  userId?: string;
  username?: string;
  displayName?: string;
}

// 請求資料結構
export interface SendMessageRequest {
  userId: string;
  serverId: string;
  channelId: string;
  message: MessageContent;
}

export interface SendDirectMessageRequest {
  userId: string;
  targetId: string;
  directMessage: DirectMessageContent;
}

export interface SendActionMessageRequest {
  serverId: string;
  channelId?: string | null;
  message: ActionMessageContent;
}

export interface ShakeWindowRequest {
  userId: string;
  targetId: string;
}
