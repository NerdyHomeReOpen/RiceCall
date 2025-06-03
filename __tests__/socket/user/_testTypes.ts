// User 相關的測試類型定義

export interface User {
  userId: string;
  name: string;
  avatar: string;
  status: 'online' | 'dnd' | 'offline';
  currentServerId?: string | null;
  currentChannelId?: string | null;
  lastActiveAt?: number;
  signature?: string;
}

export interface SearchUserQuery {
  query: string;
}

export interface UpdateUserData {
  userId: string;
  user: Partial<User>;
}

export interface UserSearchResult {
  userId: string;
  name: string;
  avatar: string;
  status: 'online' | 'dnd' | 'offline';
  signature?: string;
}
