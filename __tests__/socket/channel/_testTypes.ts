export interface User {
  userId: string;
  name: string;
  currentServerId: string | null;
  currentChannelId: string | null;
  lastActiveAt: number;
}

export interface ServerType {
  serverId: string;
  name: string;
  visibility: 'public' | 'private';
  lobbyId: string;
  ownerId: string;
}

export enum ChannelType {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
  CATEGORY = 'CATEGORY',
}

export enum ChannelVisibility {
  PUBLIC = 'public',
  MEMBER = 'member',
  PRIVATE = 'private',
  READONLY = 'readonly',
}

export enum VoiceMode {
  FREE = 'free',
  QUEUE = 'queue',
  FORBIDDEN = 'forbidden',
}

export interface Channel {
  channelId: string;
  name: string;
  type: ChannelType;
  serverId: string;
  isLobby?: boolean;
  visibility?: ChannelVisibility;
  voiceMode?: VoiceMode;
  userLimit?: number | null;
  password?: string | null;
  categoryId?: string | null;
}

export interface Member {
  userId: string;
  serverId: string;
  permissionLevel: number;
}
