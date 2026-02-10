import { io, Socket } from 'socket.io-client';
import * as Types from '@/types';
import * as Auth from '@/auth.service';
import * as Data from '@/data.service';
import { getEnv as env, loadEnv } from '@/env';
import { getToken, removeToken, setToken } from '@/auth.token';
import * as Loader from '@/loader';
import Logger from '@/logger';
import { webEventEmitter } from '@/web/event';
import { FONT_LIST, LANGUAGES } from '@/constant';
import packageJson from '../../package.json';

export function getRegion(): Types.LanguageKey {
  const language = navigator.language;
  const match = LANGUAGES.find(({ code }) => code.includes(language) || language.includes(code));
  if (!match) return 'en-US';
  return match.code;
}

// Constants
export const START_TIMESTAMP = Date.now();
export const MAIN_TITLE = 'RiceCall';
export const VERSION_TITLE = `RiceCall v${packageJson.version}`;
export const DEV = typeof process !== 'undefined' && Array.isArray(process.argv) ? process.argv.includes('--dev') : false;
export const PORT = 3000;
export const BASE_URI = `http://localhost:${PORT}`;

// Store Functions
class Store {
  private defaults: Types.StoreType;

  constructor({ defaults }: { defaults: Types.StoreType }) {
    this.defaults = defaults;
  }

  public get<T extends keyof Types.StoreType>(key: T): Types.StoreType[T] {
    const value = localStorage.getItem(key);
    if (value === null) return this.defaults[key];
    if (value === 'undefined') return this.defaults[key];

    try {
      const parsed = JSON.parse(value);
      if (parsed === null && this.defaults[key] !== null) return this.defaults[key];
      return parsed as Types.StoreType[T];
    } catch {
      return value as unknown as Types.StoreType[T];
    }
  }

  public set(key: keyof Types.StoreType, value: Types.StoreType[keyof Types.StoreType]) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

const store = new Store({
  defaults: {
    // Accounts
    accounts: {},
    // Language
    language: getRegion(),
    // Custom Themes
    customThemes: [],
    currentTheme: null,
    // Basic settings
    autoLogin: false,
    autoLaunch: false,
    alwaysOnTop: false,
    closeToTray: false,
    statusAutoIdle: false,
    statusAutoIdleMinutes: 10,
    statusAutoDnd: false,
    channelUIMode: 'classic',
    font: '',
    fontSize: 13,
    // Mix settings
    inputAudioDevice: '',
    outputAudioDevice: '',
    recordFormat: 'wav',
    recordSavePath: '',
    mixEffect: false,
    mixEffectType: '',
    autoMixSetting: false,
    echoCancellation: false,
    noiseCancellation: false,
    microphoneAmplification: false,
    manualMixMode: false,
    mixMode: 'all',
    // Voice settings
    speakingMode: 'auto',
    defaultSpeakingKey: '',
    // Privacy settings
    notSaveMessageHistory: true,
    // Hotkeys Settings
    hotKeyOpenMainWindow: '',
    hotKeyScreenshot: '',
    hotKeyIncreaseVolume: '',
    hotKeyDecreaseVolume: '',
    hotKeyToggleSpeaker: '',
    hotKeyToggleMicrophone: '',
    // SoundEffect settings
    disableAllSoundEffect: false,
    enterVoiceChannelSound: true,
    leaveVoiceChannelSound: true,
    startSpeakingSound: true,
    stopSpeakingSound: true,
    receiveDirectMessageSound: true,
    receiveChannelMessageSound: true,
    // Disclaimer settings
    dontShowDisclaimer: false,
    // Update settings
    autoCheckForUpdates: true,
    updateCheckInterval: 1 * 60 * 1000, // 1 minute
    updateChannel: 'latest',
    // Server settings
    server: 'prod',
  },
});

export function getSettings(): Types.SystemSettings {
  return {
    autoLogin: store.get('autoLogin'),
    autoLaunch: false,
    alwaysOnTop: store.get('alwaysOnTop'),
    statusAutoIdle: store.get('statusAutoIdle'),
    statusAutoIdleMinutes: store.get('statusAutoIdleMinutes'),
    statusAutoDnd: store.get('statusAutoDnd'),
    channelUIMode: store.get('channelUIMode'),
    closeToTray: store.get('closeToTray'),
    font: store.get('font'),
    fontSize: store.get('fontSize'),
    inputAudioDevice: store.get('inputAudioDevice'),
    outputAudioDevice: store.get('outputAudioDevice'),
    recordFormat: store.get('recordFormat'),
    recordSavePath: store.get('recordSavePath'),
    mixEffect: store.get('mixEffect'),
    mixEffectType: store.get('mixEffectType'),
    autoMixSetting: store.get('autoMixSetting'),
    echoCancellation: store.get('echoCancellation'),
    noiseCancellation: store.get('noiseCancellation'),
    microphoneAmplification: store.get('microphoneAmplification'),
    manualMixMode: store.get('manualMixMode'),
    mixMode: store.get('mixMode'),
    speakingMode: store.get('speakingMode'),
    defaultSpeakingKey: store.get('defaultSpeakingKey'),
    notSaveMessageHistory: store.get('notSaveMessageHistory'),
    hotKeyOpenMainWindow: store.get('hotKeyOpenMainWindow'),
    hotKeyScreenshot: store.get('hotKeyScreenshot'),
    hotKeyIncreaseVolume: store.get('hotKeyIncreaseVolume'),
    hotKeyDecreaseVolume: store.get('hotKeyDecreaseVolume'),
    hotKeyToggleSpeaker: store.get('hotKeyToggleSpeaker'),
    hotKeyToggleMicrophone: store.get('hotKeyToggleMicrophone'),
    disableAllSoundEffect: store.get('disableAllSoundEffect'),
    enterVoiceChannelSound: store.get('enterVoiceChannelSound'),
    leaveVoiceChannelSound: store.get('leaveVoiceChannelSound'),
    startSpeakingSound: store.get('startSpeakingSound'),
    stopSpeakingSound: store.get('stopSpeakingSound'),
    receiveDirectMessageSound: store.get('receiveDirectMessageSound'),
    receiveChannelMessageSound: store.get('receiveChannelMessageSound'),
    autoCheckForUpdates: store.get('autoCheckForUpdates'),
    updateCheckInterval: store.get('updateCheckInterval'),
    updateChannel: store.get('updateChannel'),
  };
}

// Windows
export function createPopup(type: Types.PopupType, id: string, initialData: unknown, force = true) {
  webEventEmitter.emit('open-popup', type, id, initialData, force);
}

export function closePopups() {
  webEventEmitter.emit('close-all-popups');
}

// Socket
const ServerToClientEventNames = [
  'actionMessage',
  'channelAdd',
  'channelMemberUpdate',
  'channelMessage',
  'channelRemove',
  'channelUpdate',
  'directMessage',
  'error',
  'friendAdd',
  'friendApplicationAdd',
  'friendApplicationRemove',
  'friendApplicationUpdate',
  'friendGroupAdd',
  'friendGroupRemove',
  'friendGroupUpdate',
  'friendRemove',
  'friendUpdate',
  'memberInvitationAdd',
  'memberInvitationRemove',
  'memberInvitationUpdate',
  'notification', // not used yet
  'openPopup',
  'playSound',
  'queueMembersSet',
  'serverAdd',
  'serverMemberAdd',
  'serverMemberApplicationAdd',
  'serverMemberApplicationRemove',
  'serverMemberApplicationUpdate',
  'serverMemberRemove',
  'serverMemberUpdate',
  'serverOnlineMemberAdd',
  'serverOnlineMemberRemove',
  'serverOnlineMemberUpdate',
  'serverRemove',
  'serverUpdate',
  'SFUJoined',
  'SFULeft',
  'SFUNewProducer',
  'SFUProducerClosed',
  'shakeWindow',
  'userUpdate',
];

const noLogEventSet = new Set<string>(['queueMembersSet', 'serverOnlineMemberUpdate']);

export let socket: Socket | null = null;
export let seq: number = 0;
export let interval: NodeJS.Timeout | null = null;

async function emitWithRetry<T>(event: string, payload: unknown, retries = 10): Promise<Types.ACK<T>> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await new Promise<Types.ACK<T>>((resolve, reject) => {
        socket?.timeout(5000).emit(event, payload, (e: unknown, ack: Types.ACK<T>) => {
          if (e) reject(e);
          else resolve(ack);
        });
      });
    } catch (e) {
      if (i === retries) throw e;
      new Logger('Socket').warn(`Retrying(#${i}) socket.emit ${event}: ${JSON.stringify(payload)}`);
    }
  }
  throw new Error('Failed to emit event with retry');
}

function sendHeartbeat() {
  const start = Date.now();
  socket?.timeout(5000).emit('heartbeat', { seq: ++seq }, (e: unknown, ack: { seq: number; t: number }) => {
    if (e) {
      new Logger('Socket').warn(`Heartbeat ${seq} timeout`);
    } else {
      const latency = Date.now() - start;
      new Logger('Socket').info(`ACK for #${ack.seq} in ${latency} ms`);
      webEventEmitter.emit('heartbeat', { seq: ack.seq, latency });
    }
  });
}

export function connectSocket(token: string) {
  if (!token) return;

  if (socket) disconnectSocket();

  seq = 0;

  socket = io(env().WS_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 20000,
    timeout: 10000,
    autoConnect: false,
    query: { token: token },
  });

  socket.on('connect', () => {
    for (const event of ServerToClientEventNames) {
      socket?.removeAllListeners(event);
    }

    ServerToClientEventNames.forEach((event) => {
      socket?.on(event, async (...args) => {
        if (!noLogEventSet.has(event)) new Logger('Socket').info(`socket.on ${event}: ${JSON.stringify(args)}`);
        webEventEmitter.emit(event, ...args);
      });
    });

    sendHeartbeat();
    if (interval) clearInterval(interval);
    interval = setInterval(sendHeartbeat, 30000);

    new Logger('Socket').info(`Socket connected`);

    webEventEmitter.emit('connect', null);
  });

  socket.on('disconnect', (reason) => {
    for (const event of ServerToClientEventNames) {
      socket?.removeAllListeners(event);
    }

    if (interval) clearInterval(interval);

    new Logger('Socket').info(`Socket disconnected, reason: ${reason}`);

    webEventEmitter.emit('disconnect', reason);
  });

  socket.on('connect_error', (e) => {
    const error = e instanceof Error ? e : new Error('Unknown error');
    new Logger('Socket').error(`Socket connect error: ${error.message}`);

    webEventEmitter.emit('connect_error', e);
  });

  socket.on('reconnect', (attemptNumber) => {
    new Logger('Socket').info(`Socket reconnected, attempt number: ${attemptNumber}`);

    webEventEmitter.emit('reconnect', attemptNumber);
  });

  socket.on('reconnect_error', (e) => {
    const error = e instanceof Error ? e : new Error('Unknown error');
    new Logger('Socket').error(`Socket reconnect error: ${error.message}`);

    webEventEmitter.emit('reconnect_error', e);
  });

  socket.connect();
}

export function disconnectSocket() {
  if (!socket) return;

  socket.emit('disconnectUser');

  for (const event of ServerToClientEventNames) {
    socket?.removeAllListeners(event);
  }

  socket.disconnect();
  socket = null;
}

export async function socketEmit<T extends keyof Types.ClientToServerEventsWithAck>(
  event: T,
  payload: Parameters<Types.ClientToServerEventsWithAck[T]>[0],
): Promise<Types.ACK<ReturnType<Types.ClientToServerEventsWithAck[T]>>> {
  new Logger('Socket').info(`socket.emit ${event}: ${JSON.stringify(payload)}`);
  return new Promise<Types.ACK<ReturnType<Types.ClientToServerEventsWithAck[T]>>>((resolve) => {
    emitWithRetry<ReturnType<Types.ClientToServerEventsWithAck[T]>>(event, payload)
      .then((ack) => {
        new Logger('Socket').info(`socket.onAck ${event}: ${JSON.stringify(ack)}`);
        resolve(ack);
      })
      .catch((e) => {
        const error = e instanceof Error ? e : new Error('Unknown error');
        new Logger('Socket').error(`socket.emit ${event} error: ${error.message}`);
        resolve({ ok: false, error: error.message });
      });
  });
}

export function socketSend(event: string, ...args: unknown[]) {
  new Logger('Socket').info(`socket.emit ${event}: ${JSON.stringify(args)}`);
  socket?.emit(event, ...args);
}

export function exit() {
  window.close();
}

// Auth handlers
export async function login(formData: { account: string; password: string }): Promise<{ success: true; token: string } | { success: false }> {
  return await Auth.login(formData)
    .then((res) => {
      if (res.success) {
        localStorage.setItem('token', res.token);
        setToken(res.token);
        window.location.href = '/';
      }
      return res as { success: true; token: string };
    })
    .catch((e) => {
      const error = e instanceof Error ? e : new Error('Unknown error');
      createPopup('dialogError', 'dialogError', { error }, true);
      return { success: false };
    });
}

export async function logout() {
  localStorage.removeItem('token');
  removeToken();
  window.location.href = '/auth';
  disconnectSocket();
}

export async function register(formData: { account: string; password: string; email: string; username: string; locale: string }): Promise<{ success: true; message: string } | { success: false }> {
  return await Auth.register(formData).catch((e) => {
    const error = e instanceof Error ? e : new Error('Unknown error');
    createPopup('dialogError', 'dialogError', { error }, true);
    return { success: false };
  });
}

export async function autoLogin(token: string): Promise<{ success: true; token: string } | { success: false }> {
  return await Auth.autoLogin(token)
    .then((res) => {
      if (res.success) {
        localStorage.setItem('token', res.token);
        setToken(res.token);
        connectSocket(token);
      } else {
        localStorage.removeItem('token');
        removeToken();
        window.location.href = '/auth';
      }
      return res;
    })
    .catch((e) => {
      localStorage.removeItem('token');
      removeToken();
      window.location.href = '/auth';
      const error = e instanceof Error ? e : new Error('Unknown error');
      createPopup('dialogError', 'dialogError', { error }, true);
      return { success: false };
    });
}

export function saveRecord(record: ArrayBuffer) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([record]));
    a.download = `recording-${timestamp}.wav`;
    a.click();
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    new Logger('System').error(`Save audio error: ${error.message}`);
  }
}

// Data handlers
export async function dataUser(params: { userId: string }) {
  return await Data.user(params);
}

export async function dataUserHotReload(params: { userId: string }) {
  if (!getToken()) return null;
  return await Data.user(params);
}

export async function dataFriend(params: { userId: string; targetId: string }) {
  return await Data.friend(params);
}

export async function dataFriends(params: { userId: string }) {
  return await Data.friends(params);
}

export async function dataFriendActivities(params: { userId: string }) {
  return await Data.friendActivities(params);
}

export async function dataFriendGroup(params: { userId: string; friendGroupId: string }) {
  return await Data.friendGroup(params);
}

export async function dataFriendGroups(params: { userId: string }) {
  return await Data.friendGroups(params);
}

export async function dataFriendApplication(params: { receiverId: string; senderId: string }) {
  return await Data.friendApplication(params);
}

export async function dataFriendApplications(params: { receiverId: string }) {
  return await Data.friendApplications(params);
}

export async function dataServer(params: { userId: string; serverId: string }) {
  return await Data.server(params);
}

export async function dataServers(params: { userId: string }) {
  return await Data.servers(params);
}

export async function dataServerMembers(params: { serverId: string }) {
  return await Data.serverMembers(params);
}

export async function dataServerOnlineMembers(params: { serverId: string }) {
  return await Data.serverOnlineMembers(params);
}

export async function dataChannel(params: { userId: string; serverId: string; channelId: string }) {
  return await Data.channel(params);
}

export async function dataChannels(params: { userId: string; serverId: string }) {
  return await Data.channels(params);
}

export async function dataChannelMembers(params: { serverId: string; channelId: string }) {
  return await Data.channelMembers(params);
}

export async function dataMember(params: { userId: string; serverId: string; channelId?: string }) {
  return await Data.member(params);
}

export async function dataMemberApplication(params: { userId: string; serverId: string }) {
  return await Data.memberApplication(params);
}

export async function dataMemberApplications(params: { serverId: string }) {
  return await Data.memberApplications(params);
}

export async function dataMemberInvitation(params: { receiverId: string; serverId: string }) {
  return await Data.memberInvitation(params);
}

export async function dataMemberInvitations(params: { receiverId: string }) {
  return await Data.memberInvitations(params);
}

export async function dataNotifications(params: { region: string }) {
  return await Data.notifications(params);
}

export async function dataAnnouncements(params: { region: string }) {
  return await Data.announcements(params);
}

export async function dataRecommendServers(params: { region: string }) {
  return await Data.recommendServers(params);
}

export async function dataUploadImage(params: { folder: string; imageName: string; imageUnit8Array: Uint8Array }) {
  return await Data.uploadImage(params);
}

export async function dataSearchServer(params: { query: string }) {
  return await Data.searchServer(params);
}

export async function dataSearchUser(params: { query: string }) {
  return await Data.searchUser(params);
}

// Accounts handlers
export function getAccounts() {
  return store.get('accounts');
}

export function addAccount(account: string, data: { autoLogin: boolean; rememberAccount: boolean; password: string }) {
  const accounts = store.get('accounts');
  accounts[account] = data;
  store.set('accounts', accounts);
  webEventEmitter.emit('accounts', accounts);
}

export function deleteAccount(account: string) {
  const accounts = store.get('accounts');
  delete accounts[account];
  store.set('accounts', accounts);
  webEventEmitter.emit('accounts', accounts);
}

// Language handlers
export function getLanguage() {
  return store.get('language');
}

export function setLanguage(language: string = getRegion()) {
  store.set('language', language);
  webEventEmitter.emit('language', language);
}

// Custom themes handlers
export function getCustomThemes() {
  const customThemes = store.get('customThemes');
  return Array.from({ length: 7 }, (_, i) => customThemes[i] ?? {});
}

export function addCustomTheme(theme: Types.Theme) {
  const customThemes = store.get('customThemes');
  // Keep total 7 themes
  customThemes.unshift(theme);
  store.set('customThemes', customThemes);
  webEventEmitter.emit(
    'custom-themes',
    Array.from({ length: 7 }, (_, i) => customThemes[i] ?? {}),
  );
}

export function deleteCustomTheme(index: number) {
  const customThemes = store.get('customThemes');
  // Keep total 7 themes
  customThemes.splice(index, 1);
  store.set('customThemes', customThemes);
  webEventEmitter.emit(
    'custom-themes',
    Array.from({ length: 7 }, (_, i) => customThemes[i] ?? {}),
  );
}

export function getCurrentTheme() {
  return store.get('currentTheme');
}

export function setCurrentTheme(theme: Types.Theme | null) {
  store.set('currentTheme', theme);
  webEventEmitter.emit('current-theme', theme);
}

export async function saveImage(buffer: ArrayBuffer): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    try {
      const blob = new Blob([buffer]);
      const reader = new FileReader();
      reader.onloadend = () => {
        new Logger('System').info(`Save image success: ${reader.result as string}`);
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        new Logger('System').error(`Save image error: unknown error`);
        resolve(null);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Unknown error');
      new Logger('System').error(`Save image error: ${error.message}`);
      resolve(null);
    }
  });
}

// Popup handlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function openPopup(type: Types.PopupType, id: string, initialData: any, force: boolean = true) {
  new Logger('System').info(`Opening ${type} (${id})...`);

  if (typeof initialData !== 'object' || initialData === null) {
    initialData = {};
  }

  const loader = Loader[type as keyof typeof Loader];
  if (loader)
    initialData = await loader({ ...initialData, systemSettings: getSettings() }).catch(() => {
      new Logger('System').error(`Cannot load ${type} data, aborting...`);
      return null;
    });
  if (!initialData) return;

  createPopup(type, id, initialData, force);
}

export function closePopup(id: string) {
  webEventEmitter.emit('close-popup', id);
}

export function windowMinimize(popupId: string) {
  webEventEmitter.emit('minimize-popup', popupId);
}

export function closeAllPopups() {
  closePopups();
}

export function popupSubmit(to: string, data: unknown | null = null) {
  webEventEmitter.emit('popup-submit', to, data);
}

// Env handlers
export function getEnv() {
  return env();
}

export function changeServer(server: 'prod' | 'dev') {
  store.set('server', server);
  loadEnv(server);
  webEventEmitter.emit('server', server);
}

// System settings handlers
export function getSystemSettings() {
  return getSettings();
}

export function getAutoLogin() {
  return store.get('autoLogin');
}

export function getAutoLaunch() {
  return false;
}

export function getAlwaysOnTop() {
  return store.get('alwaysOnTop');
}

export function getStatusAutoIdle() {
  return store.get('statusAutoIdle');
}

export function getStatusAutoIdleMinutes() {
  return store.get('statusAutoIdleMinutes');
}

export function getStatusAutoDnd() {
  return store.get('statusAutoDnd');
}

export function getChannelUIMode() {
  return store.get('channelUIMode');
}

export function getCloseToTray() {
  return store.get('closeToTray');
}

export function getFont() {
  return store.get('font');
}

export function getFontSize() {
  return store.get('fontSize');
}

export function getFontList() {
  const fonts = FONT_LIST.map((font) => font.value);
  return fonts;
}

export function getInputAudioDevice() {
  return store.get('inputAudioDevice');
}

export function getOutputAudioDevice() {
  return store.get('outputAudioDevice');
}

export function getRecordFormat() {
  return store.get('recordFormat');
}

export function getRecordSavePath() {
  return store.get('recordSavePath');
}

export function getMixEffect() {
  return store.get('mixEffect');
}

export function getMixEffectType() {
  return store.get('mixEffectType');
}

export function getAutoMixSetting() {
  return store.get('autoMixSetting');
}

export function getEchoCancellation() {
  return store.get('echoCancellation');
}

export function getNoiseCancellation() {
  return store.get('noiseCancellation');
}

export function getMicrophoneAmplification() {
  return store.get('microphoneAmplification');
}

export function getManualMixMode() {
  return store.get('manualMixMode');
}

export function getMixMode() {
  return store.get('mixMode');
}

export function getSpeakingMode() {
  return store.get('speakingMode');
}

export function getDefaultSpeakingKey() {
  return store.get('defaultSpeakingKey');
}

export function getNotSaveMessageHistory() {
  return store.get('notSaveMessageHistory');
}

export function getHotKeyOpenMainWindow() {
  return store.get('hotKeyOpenMainWindow');
}

export function getHotKeyIncreaseVolume() {
  return store.get('hotKeyIncreaseVolume');
}

export function getHotKeyDecreaseVolume() {
  return store.get('hotKeyDecreaseVolume');
}

export function getHotKeyToggleSpeaker() {
  return store.get('hotKeyToggleSpeaker');
}

export function getHotKeyToggleMicrophone() {
  return store.get('hotKeyToggleMicrophone');
}

export function getDisableAllSoundEffect() {
  return store.get('disableAllSoundEffect');
}

export function getEnterVoiceChannelSound() {
  return store.get('enterVoiceChannelSound');
}

export function getLeaveVoiceChannelSound() {
  return store.get('leaveVoiceChannelSound');
}

export function getStartSpeakingSound() {
  return store.get('startSpeakingSound');
}

export function getStopSpeakingSound() {
  return store.get('stopSpeakingSound');
}

export function getReceiveDirectMessageSound() {
  return store.get('receiveDirectMessageSound');
}

export function getReceiveChannelMessageSound() {
  return store.get('receiveChannelMessageSound');
}

export function getAutoCheckForUpdates() {
  return store.get('autoCheckForUpdates');
}

export function getUpdateCheckInterval() {
  return store.get('updateCheckInterval');
}

export function getUpdateChannel() {
  return store.get('updateChannel');
}

export function setAutoLogin(enable: boolean = false) {
  store.set('autoLogin', enable);
  webEventEmitter.emit('auto-login', enable);
}

export function setAutoLaunch(enable: boolean = false) {
  store.set('autoLaunch', enable);
  webEventEmitter.emit('auto-launch', enable);
}

export function setAlwaysOnTop(enable: boolean = false) {
  store.set('alwaysOnTop', enable);
  webEventEmitter.emit('always-on-top', enable);
}

export function setStatusAutoIdle(enable: boolean = false) {
  store.set('statusAutoIdle', enable);
  webEventEmitter.emit('status-auto-idle', enable);
}

export function setStatusAutoIdleMinutes(minutes: number = 10) {
  store.set('statusAutoIdleMinutes', minutes);
  webEventEmitter.emit('status-auto-idle-minutes', minutes);
}

export function setStatusAutoDnd(enable: boolean = false) {
  store.set('statusAutoDnd', enable);
  webEventEmitter.emit('status-auto-dnd', enable);
}

export function setChannelUIMode(mode: Types.ChannelUIMode = 'classic') {
  store.set('channelUIMode', mode);
  webEventEmitter.emit('channel-ui-mode', mode);
}

export function setCloseToTray(enable: boolean = false) {
  store.set('closeToTray', enable);
  webEventEmitter.emit('close-to-tray', enable);
}

export function setFont(font: string = '') {
  store.set('font', font);
  webEventEmitter.emit('font', font);
}

export function setFontSize(fontSize: number = 13) {
  store.set('fontSize', fontSize);
  webEventEmitter.emit('font-size', fontSize);
}

export function setInputAudioDevice(deviceId: string = '') {
  store.set('inputAudioDevice', deviceId);
  webEventEmitter.emit('input-audio-device', deviceId);
}

export function setOutputAudioDevice(deviceId: string = '') {
  store.set('outputAudioDevice', deviceId);
  webEventEmitter.emit('output-audio-device', deviceId);
}

export function setRecordFormat(format: Types.RecordFormat = 'wav') {
  store.set('recordFormat', format);
  webEventEmitter.emit('record-format', format);
}

export function setRecordSavePath(path: string = '') {
  store.set('recordSavePath', path);
  webEventEmitter.emit('record-save-path', path);
}

export function setMixEffect(enable: boolean = false) {
  store.set('mixEffect', enable);
  webEventEmitter.emit('mix-effect', enable);
}

export function setMixEffectType(type: string = '') {
  store.set('mixEffectType', type);
  webEventEmitter.emit('mix-effect-type', type);
}

export function setAutoMixSetting(enable: boolean = false) {
  store.set('autoMixSetting', enable);
  webEventEmitter.emit('auto-mix-setting', enable);
}

export function setEchoCancellation(enable: boolean = false) {
  store.set('echoCancellation', enable);
  webEventEmitter.emit('echo-cancellation', enable);
}

export function setNoiseCancellation(enable: boolean = false) {
  store.set('noiseCancellation', enable);
  webEventEmitter.emit('noise-cancellation', enable);
}

export function setMicrophoneAmplification(enable: boolean = false) {
  store.set('microphoneAmplification', enable);
  webEventEmitter.emit('microphone-amplification', enable);
}

export function setManualMixMode(enable: boolean = false) {
  store.set('manualMixMode', enable);
  webEventEmitter.emit('manual-mix-mode', enable);
}

export function setMixMode(mode: Types.MixMode = 'all') {
  store.set('mixMode', mode);
  webEventEmitter.emit('mix-mode', mode);
}

export function setSpeakingMode(mode: 'key' | 'auto' = 'key') {
  store.set('speakingMode', mode);
  webEventEmitter.emit('speaking-mode', mode);
}

export function setDefaultSpeakingKey(key: string = '') {
  store.set('defaultSpeakingKey', key);
  webEventEmitter.emit('default-speaking-key', key);
}

export function setNotSaveMessageHistory(enable: boolean = false) {
  store.set('notSaveMessageHistory', enable);
  webEventEmitter.emit('not-save-message-history', enable);
}

export function setHotKeyOpenMainWindow(key: string = '') {
  store.set('hotKeyOpenMainWindow', key);
  webEventEmitter.emit('hot-key-open-main-window', key);
}

export function setHotKeyIncreaseVolume(key: string = '') {
  store.set('hotKeyIncreaseVolume', key);
  webEventEmitter.emit('hot-key-increase-volume', key);
}

export function setHotKeyDecreaseVolume(key: string = '') {
  store.set('hotKeyDecreaseVolume', key);
  webEventEmitter.emit('hot-key-decrease-volume', key);
}

export function setHotKeyToggleSpeaker(key: string = '') {
  store.set('hotKeyToggleSpeaker', key);
  webEventEmitter.emit('hot-key-toggle-speaker', key);
}

export function setHotKeyToggleMicrophone(key: string = '') {
  store.set('hotKeyToggleMicrophone', key);
  webEventEmitter.emit('hot-key-toggle-microphone', key);
}

export function setDisableAllSoundEffect(enable: boolean = false) {
  store.set('disableAllSoundEffect', enable);
  webEventEmitter.emit('disable-all-sound-effect', enable);
}

export function setEnterVoiceChannelSound(enable: boolean = false) {
  store.set('enterVoiceChannelSound', enable);
  webEventEmitter.emit('enter-voice-channel-sound', enable);
}

export function setLeaveVoiceChannelSound(enable: boolean = false) {
  store.set('leaveVoiceChannelSound', enable);
  webEventEmitter.emit('leave-voice-channel-sound', enable);
}

export function setStartSpeakingSound(enable: boolean = false) {
  store.set('startSpeakingSound', enable);
  webEventEmitter.emit('start-speaking-sound', enable);
}

export function setStopSpeakingSound(enable: boolean = false) {
  store.set('stopSpeakingSound', enable);
  webEventEmitter.emit('stop-speaking-sound', enable);
}

export function setReceiveDirectMessageSound(enable: boolean = false) {
  store.set('receiveDirectMessageSound', enable);
  webEventEmitter.emit('receive-direct-message-sound', enable);
}

export function setReceiveChannelMessageSound(enable: boolean = false) {
  store.set('receiveChannelMessageSound', enable);
  webEventEmitter.emit('receive-channel-message-sound', enable);
}

export function setAutoCheckForUpdates(enable: boolean = false) {
  store.set('autoCheckForUpdates', enable);
  webEventEmitter.emit('auto-check-for-updates', enable);
}

export function setUpdateCheckInterval(interval: number = 1 * 60 * 1000) {
  store.set('updateCheckInterval', interval);
  webEventEmitter.emit('update-check-interval', interval);
}

export function setUpdateChannel(channel: string = 'latest') {
  store.set('updateChannel', channel);
  webEventEmitter.emit('update-channel', channel);
}

// Disclaimer handlers
export function dontShowDisclaimerNextTime(enable: boolean = false) {
  store.set('dontShowDisclaimer', enable);
  webEventEmitter.emit('dont-show-disclaimer-next-time', enable);
}

// Error submission handler
export function errorSubmit(errorId: string, error: Error) {
  fetch(env().ERROR_SUBMISSION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: null,
      embeds: [
        {
          title: 'Error Submission',
          color: 14286900,
          fields: [
            { name: 'Error Message', value: JSON.stringify(error.message) || 'Unknown', inline: true },
            { name: 'Error Cause', value: JSON.stringify(error.cause) || 'Unknown', inline: true },
            { name: 'Error Detail', value: JSON.stringify(error.stack) || 'Unknown' },
          ],
          footer: {
            text: `Error ID: ${errorId}`,
          },
          timestamp: new Date().toISOString(),
        },
      ],
      attachments: [],
    }),
  })
    .then((response) => {
      if (response.ok) {
        new Logger('Error').error(`(${errorId}), Error submitted: ${error.message}`);
      } else {
        new Logger('Error').error(`(${errorId}), Failed to submit error: ${response.statusText}`);
      }
    })
    .catch((e) => {
      const error = e instanceof Error ? e : new Error('Unknown error');
      new Logger('Error').error(`(${errorId}), Failed to submit error: ${error.message}`);
    });
}

export { webEventEmitter };
