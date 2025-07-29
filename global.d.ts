/* eslint-disable @typescript-eslint/no-explicit-any */

/* -------- 全域型別 -------- */
type Permission = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type User = {
  userId: string;
  name: string;
  avatar: string;
  avatarUrl: string;
  signature: string;
  country: string;
  level: number;
  vip: number;
  vxp: number; // New: VIP Experience Points
  xp: number;
  requiredXp: number;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  status: 'online' | 'dnd' | 'idle' | 'gn' | 'offline';
  gender: 'Male' | 'Female';
  currentChannelId: string;
  currentServerId: string;
  lastActiveAt: number;
  createdAt: number;
  badges: Badge[];
};

type Badge = {
  badgeId: string;
  name: string;
  rare: string;
  description: string;
  order: number;
  createdAt: number;
};

type FriendGroup = {
  friendGroupId: string;
  name: string;
  order: number;
  userId: string;
  createdAt: number;
};

type Friend = {
  userId: string;
  targetId: string;
  isBlocked: boolean;
  friendGroupId: string | null;
  createdAt: number;
};

type FriendApplication = User & {
  // Change name to UserFriendApplication and separate
  senderId: string;
  receiverId: string;
  description: string;
  createdAt: number;
};

type RecommendedServers = {
  [category: string]: Server[];
};

type Server = {
  serverId: string;
  name: string;
  avatar: string;
  avatarUrl: string;
  announcement: string;
  applyNotice: string;
  description: string;
  displayId: string;
  slogan: string;
  level: number;
  wealth: number;
  receiveApply: boolean;
  type: 'game' | 'entertainment' | 'other';
  visibility: 'public' | 'private' | 'invisible';
  lobbyId: string;
  receptionLobbyId: string | null;
  ownerId: string;
  createdAt: number;
  // online: number;
};

type BaseChannel = {
  channelId: string;
  name: string;
  announcement: string;
  password: string;
  order: number;
  bitrate: number;
  userLimit: number;
  guestTextGapTime: number;
  guestTextWaitTime: number;
  guestTextMaxLength: number;
  isLobby: boolean;
  forbidText: boolean;
  forbidGuestText: boolean;
  forbidGuestUrl: boolean;
  type: 'category' | 'channel';
  visibility: 'public' | 'member' | 'private' | 'readonly';
  voiceMode: 'free' | 'queue' | 'forbidden';
  categoryId: string | null;
  serverId: string;
  createdAt: number;
};

type Category = BaseChannel & {
  type: 'category';
};

type Channel = BaseChannel & {
  type: 'channel';
};

type ApproveMemberApplicationPayload = {
  userId: string;
  serverId: string;
  member?: Partial<Member>;
};

type Member = {
  userId: string;
  serverId: string;
  nickname: string | null;
  contribution: number;
  lastMessageTime: number;
  lastJoinChannelTime: number;
  isBlocked: number; // New: Change to number
  permissionLevel: Permission;
  createdAt: number;
};

type MemberApplication = User & {
  // Change name to ServerMemberApplication and separate
  userId: string;
  serverId: string;
  description: string;
  createdAt: number;
};

type Message = {
  // Change name to BaseMessage
  parameter: Record<string, string>;
  contentMetadata: Record<string, string>;
  content: string;
  type: 'general' | 'info' | 'warn' | 'event' | 'alert' | 'dm';
  timestamp: number;
};

type ChannelMessage = Message &
  ServerMember & {
    type: 'general';
  };

type DirectMessage = Message &
  UserFriend & {
    type: 'dm';
    user1Id: string;
    user2Id: string;
  };

type PromptMessage = Message & {
  type: 'alert' | 'info' | 'warn' | 'event';
};

type UserServerStatus = {
  recent: boolean;
  owned: boolean;
  favorite: boolean;
  timestamp: number;
};

type UserServer = Server & Member & UserServerStatus;

type UserFriend = User & Friend;

type ServerMember = User & Member;

type ContextMenuItem = {
  id: string;
  label: string;
  show?: boolean;
  disabled?: boolean;
  hasSubmenu?: boolean;
  submenuItems?: ContextMenuItem[];
  icon?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
};

type Emoji = {
  id: number;
  alt: string;
  path: string;
};

type DiscordPresence = {
  details: string;
  state: string;
  largeImageKey: string;
  largeImageText: string;
  smallImageKey: string;
  smallImageText: string;
  timestamp: number;
  buttons: {
    label: string;
    url: string;
  }[];
};

type SpeakingMode = 'key' | 'auto';

type MixMode = 'all' | 'app';

/* -------- 事件對應表 -------- */
/** renderer -> main，需回傳（invoke/handle） */
interface R2MInvoke {
  'file:open': (path: string) => Promise<boolean>;
}

/** renderer -> main，單向 send/on */
interface R2MSend {
  /** Socket */
  // User
  'searchUser': (args: [{ query: string }]) => void;
  'editUser': (args: [{ update: Partial<User> }]) => void;
  // Friend Group
  'createFriendGroup': (args: [{ preset: Partial<FriendGroup> }]) => void;
  'editFriendGroup': (args: [{ friendGroupId: string; update: Partial<FriendGroup> }]) => void;
  'deleteFriendGroup': (args: [{ friendGroupId: string }]) => void;
  // Friend
  'editFriend': (args: [{ friendId: string; update: Partial<Friend> }]) => void;
  'deleteFriend': (args: [{ friendId: string }]) => void;
  // Friend Application
  'sendFriendApplication': (args: [{ receiverId: string; preset: Partial<FriendApplication> }]) => void;
  'editFriendApplication': (args: [{ receiverId: string; update: Partial<FriendApplication> }]) => void;
  'deleteFriendApplication': (args: [{ receiverId: string }]) => void;
  'approveFriendApplication': (args: [{ senderId: string }]) => void;
  // Server
  'favoriteServer': (args: [{ serverId: string }]) => void;
  'searchServer': (args: [{ query: string }]) => void;
  'connectServer': (args: [{ serverId: string }]) => void;
  'disconnectServer': (args: [{ serverId: string }]) => void;
  'kickServer': (args: [{ userId: string; serverId: string }]) => void;
  'createServer': (args: [{ preset: Partial<Server> }]) => void;
  'editServer': (args: [{ serverId: string; update: Partial<Server> }]) => void;
  'deleteServer': (args: [{ serverId: string }]) => void;
  // Channel
  'connectChannel': (args: [{ serverId: string; channelId: string }]) => void;
  'moveChannel': (args: [{ userId: string; serverId: string; channelId: string }]) => void;
  'disconnectChannel': (args: [{ serverId: string; channelId: string }]) => void;
  'kickChannel': (args: [{ userId: string; serverId: string; channelId: string }]) => void;
  'createChannel': (args: [{ preset: Partial<Channel> }]) => void;
  'editChannel': (args: [{ channelId: string; update: Partial<Channel> }]) => void;
  'deleteChannel': (args: [{ channelId: string }]) => void;
  // Member
  'editMember': (args: [{ userId: string; serverId: string; update: Partial<Member> }]) => void;
  'deleteMember': (args: [{ userId: string; serverId: string }]) => void;
  // Member Application
  'sendMemberApplication': (args: [{ serverId: string; preset: Partial<MemberApplication> }]) => void;
  'editMemberApplication': (args: [{ serverId: string; update: Partial<MemberApplication> }]) => void;
  'deleteMemberApplication': (args: [{ serverId: string }]) => void;
  'approveMemberApplication': (args: [{ userId: string; serverId: string }]) => void;
  // Member Invitation
  'sendMemberInvitation': (args: [{ receiverId: string; serverId: string; preset: Partial<MemberInvitation> }]) => void;
  'editMemberInvitation': (args: [{ receiverId: string; serverId: string; update: Partial<MemberInvitation> }]) => void;
  'deleteMemberInvitation': (args: [{ receiverId: string; serverId: string }]) => void;
  'acceptMemberInvitation': (args: [{ serverId: string }]) => void;
  'rejectMemberInvitation': (args: [{ serverId: string }]) => void;
  // Message
  'channelMessage': (args: [{ channelId: string; preset: Partial<Message> }]) => void;
  'actionMessage': (args: [{ serverId: string; channelId?: string; preset: Partial<Message> }]) => void;
  'directMessage': (args: [{ userId: string; preset: Partial<Message> }]) => void;
  'shakeWindow': (args: [{ targetId: string }]) => void;
  // RTC
  'rtcOffer': (offer: string) => void;
  'rtcAnswer': (answer: string) => void;
  'rtcIceCandidate': (candidate: string) => void;
  // Echo
  'ping': () => void;
  // Popup
  'openPopup': (popupType: PopupType) => void;

  /** Auth */
  'login': ({ token }: { token: string }) => void;
  'logout': () => void;
  'exit': () => void;

  /** Initial data */
  'request-initial-data': (to: string) => void;
  'response-initial-data': (to: string, data: any) => void;

  /** Popup */
  'open-popup': (popupType: PopupType) => void;
  'close-popup': (id: string) => void;
  'close-all-popups': () => void;
  'popup-submit': (to: string, data?: any) => void;

  /** Window control */
  'window-control': (command: string) => void;

  /** Discord RPC */
  'update-discord-presence': (updatePresence: UpdatePresence) => void;

  /** System settings */
  'get-system-settings': () => void;
  'get-auto-launch': () => void;
  'set-auto-launch': (autoLaunch: boolean) => void;
  'get-font': () => void;
  'set-font': (font: string) => void;
  'get-font-size': () => void;
  'set-font-size': (fontSize: number) => void;
  'get-font-list': () => void;
  'set-font-list': (fontList: string[]) => void;
  'get-input-audio-device': () => void;
  'set-input-audio-device': (inputAudioDevice: string) => void;
  'get-output-audio-device': () => void;
  'set-output-audio-device': (outputAudioDevice: string) => void;
  'get-mix-effect': () => void;
  'get-mix-effect-type': () => void;
  'set-mix-effect-type': (mixEffectType: string) => void;
  'get-auto-mix-setting': () => void;
  'set-auto-mix-setting': (autoMixSetting: boolean) => void;
  'get-echo-cancellation': () => void;
  'set-echo-cancellation': (echoCancellation: boolean) => void;
  'get-noise-cancellation': () => void;
  'set-noise-cancellation': (noiseCancellation: boolean) => void;
  'get-microphone-amplification': () => void;
  'set-microphone-amplification': (microphoneAmplification: boolean) => void;
  'get-manual-mix-mode': () => void;
  'set-manual-mix-mode': (manualMixMode: boolean) => void;
  'get-mix-mode': () => void;
  'set-mix-mode': (mixMode: string) => void;
  'get-speaking-mode': () => void;
  'set-speaking-mode': (speakingMode: string) => void;
  'get-default-speaking-key': () => void;
  'set-default-speaking-key': (defaultSpeakingKey: string) => void;
  'get-speaking-mode-auto-key': () => void;
  'set-speaking-mode-auto-key': (speakingModeAutoKey: boolean) => void;
  'get-not-save-message-history': () => void;
  'set-not-save-message-history': (notSaveMessageHistory: boolean) => void;
  'get-hot-key-open-main-window': () => void;
  'set-hot-key-open-main-window': (hotKeyOpenMainWindow: string) => void;
  'get-hot-key-increase-volume': () => void;
  'set-hot-key-increase-volume': (hotKeyIncreaseVolume: string) => void;
  'get-hot-key-decrease-volume': () => void;
  'set-hot-key-decrease-volume': (hotKeyDecreaseVolume: string) => void;
  'get-hot-key-toggle-speaker': () => void;
  'set-hot-key-toggle-speaker': (hotKeyToggleSpeaker: string) => void;
  'get-hot-key-toggle-microphone': () => void;
  'set-hot-key-toggle-microphone': (hotKeyToggleMicrophone: string) => void;
  'get-disable-all-sound-effect': () => void;
  'set-disable-all-sound-effect': (disableAllSoundEffect: boolean) => void;
  'get-enter-voice-channel-sound': () => void;
  'set-enter-voice-channel-sound': (enterVoiceChannelSound: boolean) => void;
  'get-leave-voice-channel-sound': () => void;
  'set-leave-voice-channel-sound': (leaveVoiceChannelSound: boolean) => void;
  'get-start-speaking-sound': () => void;
  'set-start-speaking-sound': (startSpeakingSound: boolean) => void;
  'get-stop-speaking-sound': () => void;
  'set-stop-speaking-sound': (stopSpeakingSound: boolean) => void;
  'get-receive-direct-message-sound': () => void;
  'set-receive-direct-message-sound': (receiveDirectMessageSound: boolean) => void;
  'get-receive-channel-message-sound': () => void;
  'set-receive-channel-message-sound': (receiveChannelMessageSound: boolean) => void;
  'get-dont-show-disclaimer': () => void;
  'set-dont-show-disclaimer': (dontShowDisclaimer: boolean) => void;
}

/** main -> renderer（webContents.send / ipcRenderer.on） */
interface M2RSend {
  log: (level: 'info' | 'warn' | 'error', message: string) => void;
}

/* -------- Electron 模組 augmentation -------- */
declare module 'electron' {
  /* ---------- Renderer 端 ---------- */
  interface IpcRenderer {
    /** invoke：帶回傳值型別 */
    invoke<C extends keyof R2MInvoke>(channel: C, ...args: Parameters<R2MInvoke[C]>): ReturnType<R2MInvoke[C]>;

    /** send：單向 */
    send<C extends keyof R2MSend>(channel: C, ...args: Parameters<R2MSend[C]>): void;

    /** on：接 main 推播 */
    on<C extends keyof M2RSend>(channel: C, listener: (event: IpcRendererEvent, ...args: Parameters<M2RSend[C]>) => void): this;
  }

  /* ---------- Main 端 ---------- */
  interface IpcMain {
    /** handle：對應 invoke */
    handle<C extends keyof R2MInvoke>(channel: C, listener: (event: IpcMainInvokeEvent, ...args: Parameters<R2MInvoke[C]>) => ReturnType<R2MInvoke[C]> | Promise<ReturnType<R2MInvoke[C]>>): this;

    /** on：對應 renderer 單向 send */
    on<C extends keyof R2MSend>(channel: C, listener: (event: IpcMainEvent, ...args: Parameters<R2MSend[C]>) => void): this;
  }

  /* webContents.send → main 推播到 renderer */
  interface WebContents {
    send<C extends keyof M2RSend>(channel: C, ...args: Parameters<M2RSend[C]>): void;
  }
}
