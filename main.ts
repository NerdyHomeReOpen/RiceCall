/* eslint-disable @typescript-eslint/no-explicit-any */
import net from 'net';
import path from 'path';
import fontList from 'font-list';
import { io, Socket } from 'socket.io-client';
import DiscordRPC from 'discord-rpc';
import dotenv from 'dotenv';
import serve from 'electron-serve';
import Store from 'electron-store';
import ElectronUpdater from 'electron-updater';
import { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu, nativeImage } from 'electron';

dotenv.config();

let tray: Tray | null = null;
let isLogin: boolean = false;

// AutoUpdater
const { autoUpdater } = ElectronUpdater;

// Store
type StoreSchema = {
  theme: string;
  audioInputDevice: string;
  audioOutputDevice: string;
  dontShowDisclaimer: boolean;
};
const store = new Store<StoreSchema>();

export enum PopupType {
  AVATAR_CROPPER = 'avatarCropper',
  USER_INFO = 'userInfo',
  USER_SETTING = 'userSetting',
  CHANNEL_SETTING = 'channelSetting',
  CHANNEL_PASSWORD = 'channelPassword',
  SERVER_SETTING = 'serverSetting',
  SERVER_BROADCAST = 'serverBroadcast',
  BLOCK_MEMBER = 'blockMember',
  SYSTEM_SETTING = 'systemSetting',
  MEMBER_APPLY_SETTING = 'memberApplySetting',
  CREATE_SERVER = 'createServer',
  CREATE_CHANNEL = 'createChannel',
  CREATE_FRIENDGROUP = 'createFriendGroup',
  EDIT_CHANNEL_ORDER = 'editChannelOrder',
  EDIT_CHANNEL_NAME = 'editChannelName',
  EDIT_NICKNAME = 'editNickname',
  EDIT_FRIENDGROUP = 'editFriendGroup',
  EDIT_FRIEND = 'editFriend',
  APPLY_MEMBER = 'applyMember',
  APPLY_FRIEND = 'applyFriend',
  SEARCH_USER = 'searchUser',
  DIRECT_MESSAGE = 'directMessage',
  DIALOG_ALERT = 'dialogAlert',
  DIALOG_ALERT2 = 'dialogAlert2',
  DIALOG_SUCCESS = 'dialogSuccess',
  DIALOG_WARNING = 'dialogWarning',
  DIALOG_ERROR = 'dialogError',
  DIALOG_INFO = 'dialogInfo',
  CHANGE_THEME = 'changeTheme',
  ABOUTUS = 'aboutus',
  FRIEND_VERIFICATION = 'friendVerification',
}

export enum SocketClientEvent {
  // User
  SEARCH_USER = 'searchUser',
  EDIT_USER = 'editUser',
  // Friend Group
  CREATE_FRIEND_GROUP = 'createFriendGroup',
  EDIT_FRIEND_GROUP = 'editFriendGroup',
  DELETE_FRIEND_GROUP = 'deleteFriendGroup',
  // Friend
  CREATE_FRIEND = 'createFriend',
  EDIT_FRIEND = 'editFriend',
  DELETE_FRIEND = 'deleteFriend',
  // Friend Application
  CREATE_FRIEND_APPLICATION = 'createFriendApplication',
  EDIT_FRIEND_APPLICATION = 'editFriendApplication',
  DELETE_FRIEND_APPLICATION = 'deleteFriendApplication',
  APPROVE_FRIEND_APPLICATION = 'approveFriendApplication',
  // Server
  FAVORITE_SERVER = 'favoriteServer',
  SEARCH_SERVER = 'searchServer',
  CONNECT_SERVER = 'connectServer',
  DISCONNECT_SERVER = 'disconnectServer',
  CREATE_SERVER = 'createServer',
  EDIT_SERVER = 'editServer',
  DELETE_SERVER = 'deleteServer',
  // Channel
  CONNECT_CHANNEL = 'connectChannel',
  DISCONNECT_CHANNEL = 'disconnectChannel',
  CREATE_CHANNEL = 'createChannel',
  EDIT_CHANNEL = 'editChannel',
  EDIT_CHANNELS = 'editChannels',
  DELETE_CHANNEL = 'deleteChannel',
  // Member
  CREATE_MEMBER = 'createMember',
  EDIT_MEMBER = 'editMember',
  DELETE_MEMBER = 'deleteMember',
  // Member Application
  CREATE_MEMBER_APPLICATION = 'createMemberApplication',
  EDIT_MEMBER_APPLICATION = 'editMemberApplication',
  DELETE_MEMBER_APPLICATION = 'deleteMemberApplication',
  APPROVE_MEMBER_APPLICATION = 'approveMemberApplication',
  // Message
  CHANNEL_MESSAGE = 'channelMessage',
  ACTION_MESSAGE = 'actionMessage',
  DIRECT_MESSAGE = 'directMessage',
  SHAKE_WINDOW = 'shakeWindow',
  // RTC
  RTC_OFFER = 'RTCOffer',
  RTC_ANSWER = 'RTCAnswer',
  RTC_ICE_CANDIDATE = 'RTCIceCandidate',
  // Echo
  PING = 'ping',
}

export enum SocketServerEvent {
  // Notification
  NOTIFICATION = 'notification', // not used yet
  // User
  USER_SEARCH = 'userSearch',
  USER_UPDATE = 'userUpdate',
  // Friend Group
  FRIEND_GROUPS_SET = 'friendGroupsSet',
  FRIEND_GROUP_ADD = 'friendGroupAdd',
  FRIEND_GROUP_UPDATE = 'friendGroupUpdate',
  FRIEND_GROUP_REMOVE = 'friendGroupRemove',
  // Friend
  FRIENDS_SET = 'friendsSet',
  FRIEND_ADD = 'friendAdd',
  FRIEND_UPDATE = 'friendUpdate',
  FRIEND_REMOVE = 'friendRemove',
  // Friend Application
  FRIEND_APPLICATIONS_SET = 'friendApplicationsSet',
  FRIEND_APPLICATION_ADD = 'friendApplicationAdd',
  FRIEND_APPLICATION_UPDATE = 'friendApplicationUpdate',
  FRIEND_APPLICATION_REMOVE = 'friendApplicationRemove',
  // Server
  SERVER_SEARCH = 'serverSearch',
  SERVERS_SET = 'serversSet',
  SERVER_ADD = 'serverAdd',
  SERVER_UPDATE = 'serverUpdate',
  SERVER_REMOVE = 'serverRemove',
  // Channel
  SERVER_CHANNELS_SET = 'serverChannelsSet',
  SERVER_CHANNEL_ADD = 'serverChannelAdd',
  SERVER_CHANNEL_UPDATE = 'serverChannelUpdate',
  SERVER_CHANNEL_REMOVE = 'serverChannelRemove',
  // Member
  SERVER_MEMBERS_SET = 'serverMembersSet',
  SERVER_MEMBER_ADD = 'serverMemberAdd',
  SERVER_MEMBER_UPDATE = 'serverMemberUpdate',
  SERVER_MEMBER_REMOVE = 'serverMemberRemove',
  SERVER_ONLINE_MEMBERS_SET = 'serverOnlineMembersSet',
  SERVER_ONLINE_MEMBER_ADD = 'serverOnlineMemberAdd',
  SERVER_ONLINE_MEMBER_REMOVE = 'serverOnlineMemberRemove',
  // Member Application
  SERVER_MEMBER_APPLICATIONS_SET = 'serverMemberApplicationsSet',
  SERVER_MEMBER_APPLICATION_ADD = 'serverMemberApplicationAdd',
  SERVER_MEMBER_APPLICATION_UPDATE = 'serverMemberApplicationUpdate',
  SERVER_MEMBER_APPLICATION_REMOVE = 'serverMemberApplicationRemove',
  MEMBER_APPROVAL = 'memberApproval',
  // Message
  CHANNEL_MESSAGE = 'channelMessage',
  ACTION_MESSAGE = 'actionMessage',
  DIRECT_MESSAGE = 'directMessage',
  SHAKE_WINDOW = 'shakeWindow',
  // RTC
  RTC_OFFER = 'RTCOffer',
  RTC_ANSWER = 'RTCAnswer',
  RTC_ICE_CANDIDATE = 'RTCIceCandidate',
  RTC_JOIN = 'RTCJoin',
  RTC_LEAVE = 'RTCLeave',
  // Play Sound
  PLAY_SOUND = 'playSound',
  // Echo
  PONG = 'pong',
  // Popup
  OPEN_POPUP = 'openPopup',
}

export const PopupSize = {
  [PopupType.ABOUTUS]: { height: 750, width: 500 },
  [PopupType.APPLY_FRIEND]: { height: 320, width: 500 },
  [PopupType.APPLY_MEMBER]: { height: 320, width: 500 },
  [PopupType.AVATAR_CROPPER]: { height: 520, width: 610 },
  [PopupType.BLOCK_MEMBER]: { height: 250, width: 400 },
  [PopupType.CHANNEL_SETTING]: { height: 520, width: 600 },
  [PopupType.CHANNEL_PASSWORD]: { height: 200, width: 370 },
  [PopupType.CHANGE_THEME]: { height: 340, width: 480 },
  [PopupType.CREATE_SERVER]: { height: 436, width: 478 },
  [PopupType.CREATE_CHANNEL]: { height: 200, width: 370 },
  [PopupType.CREATE_FRIENDGROUP]: { height: 200, width: 370 },
  [PopupType.DIRECT_MESSAGE]: { height: 550, width: 650 },
  [PopupType.DIALOG_ALERT]: { height: 200, width: 370 },
  [PopupType.DIALOG_ALERT2]: { height: 200, width: 370 },
  [PopupType.DIALOG_SUCCESS]: { height: 200, width: 370 },
  [PopupType.DIALOG_WARNING]: { height: 200, width: 370 },
  [PopupType.DIALOG_ERROR]: { height: 200, width: 370 },
  [PopupType.DIALOG_INFO]: { height: 200, width: 370 },
  [PopupType.EDIT_CHANNEL_ORDER]: { height: 550, width: 500 },
  [PopupType.EDIT_CHANNEL_NAME]: { height: 200, width: 370 },
  [PopupType.EDIT_NICKNAME]: { height: 200, width: 370 },
  [PopupType.EDIT_FRIENDGROUP]: { height: 200, width: 370 },
  [PopupType.EDIT_FRIEND]: { height: 200, width: 370 },
  [PopupType.FRIEND_VERIFICATION]: { height: 550, width: 500 },
  [PopupType.MEMBER_APPLY_SETTING]: { height: 250, width: 370 },
  [PopupType.SEARCH_USER]: { height: 200, width: 370 },
  [PopupType.SERVER_SETTING]: { height: 520, width: 600 },
  [PopupType.SERVER_BROADCAST]: { height: 300, width: 450 },
  [PopupType.SYSTEM_SETTING]: { height: 520, width: 600 },
  [PopupType.USER_INFO]: { height: 630, width: 440 },
  [PopupType.USER_SETTING]: { height: 700, width: 500 },
  Settings: { height: 520, width: 600 },
  Apply: { height: 320, width: 500 },
  Small: { height: 200, width: 370 },
};

// Constants
const DEV = process.argv.includes('--dev');
const PORT = 3000;
const BASE_URI = DEV ? `http://localhost:${PORT}` : 'app://-';
const DISCORD_RPC_CLIENT_ID = '1242441392341516288';
const APP_ICON = process.platform === 'win32' ? path.join(app.getAppPath(), 'resources', 'icon.ico') : path.join(app.getAppPath(), 'resources', 'icon.png');
const APP_TRAY_ICON = {
  gray: process.platform === 'win32' ? path.join(app.getAppPath(), 'resources', 'tray_gray.ico') : path.join(app.getAppPath(), 'resources', 'tray_gray.png'),
  normal: process.platform === 'win32' ? path.join(app.getAppPath(), 'resources', 'tray.ico') : path.join(app.getAppPath(), 'resources', 'tray.png'),
};

// Windows
let mainWindow: BrowserWindow;
let authWindow: BrowserWindow;
let popups: Record<string, BrowserWindow> = {};

// Socket
const websocketUrl = process.env.NEXT_PUBLIC_WS_URL;
let socketInstance: Socket | null = null;

// Discord RPC
let rpc: DiscordRPC.Client | null = null;

const defaultPrecence = {
  details: '正在使用應用',
  state: '準備中',
  startTimestamp: Date.now(),
  largeImageKey: 'app_icon',
  largeImageText: '應用名稱',
  smallImageKey: 'status_icon',
  smallImageText: '狀態說明',
  instance: false,
  buttons: [
    {
      label: '加入我們的Discord伺服器',
      url: 'https://discord.gg/adCWzv6wwS',
    },
  ],
};

const appServe = serve({ directory: path.join(app.getAppPath(), 'out') });

// Functions
// async function checkIsHinet() {
//   const ipData = await fetch('https://ipinfo.io/json').then((res) => res.json());
//   return ipData.org.startsWith('AS3462');
// }

function waitForPort(port: number) {
  return new Promise((resolve, reject) => {
    let timeout = 30000; // 30 seconds timeout

    function tryConnect() {
      const client = new net.Socket();

      client.once('connect', () => {
        client.destroy();
        resolve(null);
      });

      client.once('error', () => {
        client.destroy();
        if (timeout <= 0) {
          reject(new Error('Timeout waiting for port'));
          return;
        }
        setTimeout(tryConnect, 1000);
        timeout -= 1000;
      });

      client.connect({ port: port, host: 'localhost' });
    }
    tryConnect();
  });
}

function focusWindow() {
  const window = authWindow.isDestroyed() === false ? authWindow : mainWindow.isDestroyed() === false ? mainWindow : null;
  if (window) {
    if (window.isMinimized()) window.restore();
    window.focus();
  }
}

function closePopups() {
  Object.values(popups).forEach((popup) => {
    if (popup && !popup.isDestroyed()) {
      popup.close();
    }
  });
  popups = {};
}

// Store Functions
function setAutoLaunch(enable: boolean) {
  try {
    app.setLoginItemSettings({
      openAtLogin: enable,
      openAsHidden: false,
    });
  } catch (error) {
    console.error('設置開機自動啟動時出錯:', error);
  }
}

function isAutoLaunchEnabled(): boolean {
  try {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  } catch (error) {
    console.error('讀取開機自動啟動狀態時出錯:', error);
    return false;
  }
}

// Windows Functions
async function createMainWindow(): Promise<BrowserWindow | null> {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    return mainWindow;
  }

  if (DEV) {
    waitForPort(PORT).catch((err) => {
      console.error('Cannot connect to Next.js server:', err);
      app.exit();
    });
  }

  mainWindow = new BrowserWindow({
    title: `Raidcall v${app.getVersion()}`,
    width: 1080,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    thickFrame: true,
    titleBarStyle: 'hidden',
    maximizable: true,
    resizable: true,
    fullscreen: false,
    hasShadow: true,
    icon: APP_ICON,
    webPreferences: {
      webviewTag: true,
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
    },
  });

  if (app.isPackaged || !DEV) {
    appServe(mainWindow).then(() => {
      mainWindow.loadURL(`${BASE_URI}`);
    });
  } else {
    mainWindow.loadURL(`${BASE_URI}`);
    // mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('maximize');
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('unmaximize');
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send(mainWindow.isMaximized() ? 'maximize' : 'unmaximize');
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.show();
  mainWindow.focus();
  mainWindow.setAlwaysOnTop(true);
  mainWindow.setAlwaysOnTop(false);

  return mainWindow;
}

async function createAuthWindow() {
  if (authWindow && !authWindow.isDestroyed()) {
    authWindow.focus();
    return authWindow;
  }

  if (DEV) {
    waitForPort(PORT).catch((err) => {
      console.error('Cannot connect to Next.js server:', err);
      app.quit();
    });
  }

  authWindow = new BrowserWindow({
    title: `Raidcall v${app.getVersion()}`,
    width: 640,
    height: 480,
    thickFrame: true,
    titleBarStyle: 'hidden',
    maximizable: false,
    resizable: false,
    fullscreen: false,
    hasShadow: true,
    icon: APP_ICON,
    webPreferences: {
      webviewTag: true,
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
    },
  });

  if (app.isPackaged || !DEV) {
    appServe(authWindow).then(() => {
      authWindow.loadURL(`${BASE_URI}/auth.html`);
    });
  } else {
    authWindow.loadURL(`${BASE_URI}/auth`);
    // authWindow.webContents.openDevTools();
  }

  authWindow.on('close', (e) => {
    e.preventDefault();
    app.exit();
  });

  authWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  authWindow.show();
  authWindow.focus();
  authWindow.setAlwaysOnTop(true);
  authWindow.setAlwaysOnTop(false);

  return authWindow;
}

async function createPopup(type: PopupType, id: string, force = true): Promise<BrowserWindow | null> {
  // If force is true, destroy the popup
  if (force) {
    if (popups[id] && !popups[id].isDestroyed()) {
      popups[id].destroy();
    }
  } else {
    if (popups[id] && !popups[id].isDestroyed()) {
      popups[id].show();
      popups[id].focus();
      popups[id].setAlwaysOnTop(true);
      popups[id].setAlwaysOnTop(false);
      return popups[id];
    }
  }

  if (DEV) {
    waitForPort(PORT).catch((err) => {
      console.error('Cannot connect to Next.js server:', err);
      app.exit();
    });
  }

  popups[id] = new BrowserWindow({
    title: `Raidcall v${app.getVersion()}`,
    width: PopupSize[type].width,
    height: PopupSize[type].height,
    thickFrame: true,
    titleBarStyle: 'hidden',
    maximizable: false,
    resizable: false,
    fullscreen: false,
    hasShadow: true,
    icon: APP_ICON,
    webPreferences: {
      webviewTag: true,
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
    },
    modal: true,
  });

  if (app.isPackaged || !DEV) {
    appServe(popups[id]).then(() => {
      popups[id].loadURL(`${BASE_URI}/popup.html?type=${type}&id=${id}`);
    });
  } else {
    popups[id].loadURL(`${BASE_URI}/popup?type=${type}&id=${id}`);
    // popups[id].webContents.openDevTools();
  }

  popups[id].webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  popups[id].show();
  popups[id].focus();
  popups[id].setAlwaysOnTop(true);
  popups[id].setAlwaysOnTop(false);

  return popups[id];
}

// Socket Functions
function connectSocket(token: string): Socket | null {
  if (!token) return null;

  if (socketInstance) {
    socketInstance = disconnectSocket();
  }

  const socket = io(websocketUrl, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 20000,
    timeout: 10000,
    autoConnect: false,
    query: {
      token: token,
    },
  });

  socket.on('connect', () => {
    for (const event of Object.values(SocketClientEvent)) {
      ipcMain.removeAllListeners(event);
    }

    for (const event of Object.values(SocketServerEvent)) {
      socket.removeAllListeners(event);
    }

    Object.values(SocketClientEvent).forEach((event) => {
      ipcMain.on(event, (_, ...args) => {
        // console.log('socket.emit', event, ...args);
        console.log('socket.emit', event);
        socket.emit(event, ...args);
      });
    });

    Object.values(SocketServerEvent).forEach((event) => {
      socket.on(event, (...args) => {
        // console.log('socket.on', event, ...args);
        console.log('socket.on', event);
        BrowserWindow.getAllWindows().forEach((window) => {
          window.webContents.send(event, ...args);
        });
      });
    });

    console.info('Socket connected');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('connect', null);
    });
  });

  socket.on('disconnect', (reason) => {
    console.info('Socket disconnected, reason:', reason);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('disconnect', reason);
    });
  });

  socket.on('reconnect', (attemptNumber) => {
    console.info('Socket reconnected, attempt number:', attemptNumber);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('reconnect', attemptNumber);
    });
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error.message);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('error', error);
    });
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connect error:', error.message);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('connect_error', error);
    });
  });

  socket.on('reconnect_error', (error) => {
    console.error('Socket reconnect error:', error.message);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('reconnect_error', error);
    });
  });

  socket.connect();

  return socket;
}

function disconnectSocket(): Socket | null {
  if (!socketInstance) return null;

  for (const event of Object.values(SocketClientEvent)) {
    ipcMain.removeAllListeners(event);
  }

  for (const event of Object.values(SocketServerEvent)) {
    socketInstance.removeAllListeners(event);
  }

  socketInstance.disconnect();

  return null;
}

// Auto Updater
function checkUpdate() {
  if (DEV) return;
  autoUpdater.checkForUpdates().catch((error) => {
    console.error('Cannot check for updates:', error);
  });
}

function configureAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;

  if (DEV) {
    autoUpdater.forceDevUpdateConfig = true;
    autoUpdater.updateConfigPath = path.join(app.getAppPath(), 'dev-app-update.yml');
  }

  autoUpdater.on('error', (error: any) => {
    if (DEV && error.message.includes('dev-app-update.yml')) {
      console.info('Skip update check in development environment');
      return;
    }
    console.error('Cannot check for updates:', error.message);
  });

  autoUpdater.on('update-available', (info: any) => {
    dialog.showMessageBox({
      type: 'info',
      title: '有新版本可用',
      message: `新版本 ${info.version} 發布於 ${new Date(info.releaseDate).toLocaleDateString()}，點擊確認後將開始下載...`,
    });
  });

  autoUpdater.on('update-not-available', () => {
    console.info('目前是最新版本');
  });

  autoUpdater.on('download-progress', (progressObj: any) => {
    let message = `下載速度: ${progressObj.bytesPerSecond}`;
    message = `${message} - 已下載 ${progressObj.percent}%`;
    message = `${message} (${progressObj.transferred}/${progressObj.total})`;
    console.info(message);
  });

  autoUpdater.on('update-downloaded', (info: any) => {
    dialog
      .showMessageBox({
        type: 'info',
        title: '安裝更新',
        message: `版本 ${info.version} 已下載完成，請點擊立即安裝按鈕進行安裝`,
        buttons: ['立即安裝'],
      })
      .then((buttonIndex) => {
        if (buttonIndex.response === 0) {
          autoUpdater.quitAndInstall(false, true);
        }
      });
  });

  // Check update every minute
  setInterval(checkUpdate, 60 * 1000);
  checkUpdate();
}

// Discord RPC Functions
async function setActivity(presence: DiscordRPC.Presence) {
  if (!rpc) return;
  await rpc.setActivity(presence).catch((error) => {
    console.error('Cannot set activity:', error);
  });
}

async function configureDiscordRPC() {
  DiscordRPC.register(DISCORD_RPC_CLIENT_ID);
  rpc = new DiscordRPC.Client({ transport: 'ipc' });

  rpc = await rpc.login({ clientId: DISCORD_RPC_CLIENT_ID }).catch(() => {
    console.warn('Cannot login to Discord RPC, will not show Discord status');
    return null;
  });

  if (!rpc) return;

  rpc.on('ready', () => {
    setActivity(defaultPrecence);
  });
}

// Tray Icon Functions
function setTrayIcon(isLogin: boolean) {
  if (!tray) return;
  const trayIconPath = isLogin ? APP_TRAY_ICON.normal : APP_TRAY_ICON.gray;
  const contextMenu = Menu.buildFromTemplate([
    {
      id: 'open-main-window',
      label: '打開主視窗',
      type: 'normal',
      click: () => {
        if (isLogin) {
          mainWindow.show();
        } else {
          authWindow.show();
        }
      },
    },
    { type: 'separator' },
    {
      id: 'logout',
      label: '登出',
      type: 'normal',
      enabled: isLogin,
      click: () => {
        closePopups();
        ipcMain.emit('logout');
      },
    },
    {
      id: 'exit',
      label: '退出',
      type: 'normal',
      click: () => app.exit(),
    },
  ]);

  tray.setImage(nativeImage.createFromPath(trayIconPath));
  tray.setContextMenu(contextMenu);
}

function configureTray() {
  if (tray) tray.destroy();

  const trayIconPath = APP_TRAY_ICON.gray;

  tray = new Tray(nativeImage.createFromPath(trayIconPath));

  tray.on('click', () => {
    if (isLogin) {
      mainWindow.show();
    } else {
      authWindow.show();
    }
  });

  tray.setToolTip(`RiceCall v${app.getVersion()}`);

  setTrayIcon(isLogin);
}

app.on('ready', async () => {
  configureAutoUpdater();
  configureDiscordRPC();
  configureTray();

  // if (await checkIsHinet()) websocketUrl = WS_URL;

  await createAuthWindow();
  await createMainWindow();

  if (!store.get('dontShowDisclaimer')) {
    await createPopup(PopupType.ABOUTUS, 'aboutUs');

    popups['aboutUs'].setAlwaysOnTop(true);
  }

  mainWindow.hide();
  authWindow.show();

  app.on('before-quit', () => {
    if (rpc) {
      rpc.destroy().catch((error) => {
        console.error('Cannot destroy Discord RPC:', error);
      });
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  // Auth handlers
  ipcMain.on('login', (_, token) => {
    mainWindow.show();
    authWindow.hide();
    socketInstance = connectSocket(token);
    isLogin = true;
    setTrayIcon(isLogin);
  });

  ipcMain.on('logout', () => {
    if (rpc) {
      rpc.clearActivity().catch((error) => {
        console.error('Cannot clear activity:', error);
      });
    }
    closePopups();
    mainWindow.hide();
    authWindow.show();
    socketInstance = disconnectSocket();
    isLogin = false;
    setTrayIcon(isLogin);
  });

  ipcMain.on('exit', () => {
    app.exit();
  });

  ipcMain.on('get-socket-status', () => {
    return socketInstance && socketInstance.connected ? 'connected' : 'disconnected';
  });

  // Initial data request handlers
  ipcMain.on('request-initial-data', (_, to) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('request-initial-data', to);
    });
  });

  ipcMain.on('response-initial-data', (_, to, data) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('response-initial-data', to, data);
    });
  });

  // Popup handlers
  ipcMain.on('open-popup', (_, type, id, force = true) => {
    createPopup(type, id, force);
  });

  ipcMain.on('close-popup', (_, id) => {
    if (popups[id] && !popups[id].isDestroyed()) {
      popups[id].close();
    }
  });

  ipcMain.on('close-all-popups', () => {
    closePopups();
  });

  ipcMain.on('popup-submit', (_, to, data?: any) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('popup-submit', to, data ?? null);
    });
  });

  // Window control event handlers
  ipcMain.on('window-control', (event, command) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;
    window.webContents.send(command);
    switch (command) {
      case 'minimize':
        window.minimize();
        break;
      case 'maximize':
        window.maximize();
        break;
      case 'unmaximize':
        window.unmaximize();
        break;
      case 'close':
        window.close();
        break;
    }
  });

  // Discord RPC handlers
  ipcMain.on('update-discord-presence', (_, updatePresence) => {
    setActivity(updatePresence);
  });

  // System settings handlers
  ipcMain.on('get-system-settings', (event) => {
    const settings = {
      // Basic settings
      autoLaunch: isAutoLaunchEnabled(),
      dontShowDisclaimer: store.get('dontShowDisclaimer') ?? false,
      font: store.get('font') || '',
      fontSize: store.get('fontSize') || 13,
      // Mix settings
      inputAudioDevice: store.get('audioInputDevice') || '',
      outputAudioDevice: store.get('audioOutputDevice') || '',
      mixEffect: store.get('mixEffect') ?? false,
      mixEffectType: store.get('mixEffectType') || '',
      autoMixSetting: store.get('autoMixSetting') ?? false,
      echoCancellation: store.get('echoCancellation') ?? false,
      noiseCancellation: store.get('noiseCancellation') ?? false,
      microphoneAmplification: store.get('microphoneAmplification') ?? false,
      manualMixMode: store.get('manualMixMode') ?? false,
      mixMode: store.get('mixMode') || 'all',
      // Voice settings
      speakingMode: store.get('speakingMode') || 'key',
      defaultSpeakingKey: store.get('defaultSpeakingKey') || '',
      peakingModeAutoKey: store.get('peakingModeAutoKey') ?? false,
      // Privacy settings
      notSaveMessageHistory: store.get('notSaveMessageHistory') ?? true,
      // Hotkeys Settings
      hotKeyOpenMainWindow: store.get('hotKeyOpenMainWindow') || '',
      hotKeyScreenshot: store.get('hotKeyScreenshot') || '',
      hotKeyIncreaseVolume: store.get('hotKeyIncreaseVolume') || '',
      hotKeyDecreaseVolume: store.get('hotKeyDecreaseVolume') || '',
      hotKeyToggleSpeaker: store.get('hotKeyToggleSpeaker') || '',
      hotKeyToggleMicrophone: store.get('hotKeyToggleMicrophone') || '',
      // SoundEffect settings
      disableAllSoundEffect: store.get('disableAllSoundEffect') ?? false,
      enterVoiceChannelSound: store.get('enterVoiceChannelSound') ?? true,
      leaveVoiceChannelSound: store.get('leaveVoiceChannelSound') ?? true,
      startSpeakingSound: store.get('startSpeakingSound') ?? true,
      stopSpeakingSound: store.get('stopSpeakingSound') ?? true,
      receiveDirectMessageSound: store.get('receiveDirectMessageSound') ?? true,
      receiveChannelMessageSound: store.get('receiveChannelMessageSound') ?? true,
    };
    event.reply('system-settings', settings);
  });

  // Basic
  ipcMain.on('get-auto-launch', (event) => {
    event.reply('auto-launch', isAutoLaunchEnabled());
  });

  ipcMain.on('get-font', (event) => {
    event.reply('font', store.get('font') || 'Arial');
  });

  ipcMain.on('get-font-size', (event) => {
    event.reply('font-size', store.get('fontSize') || 13);
  });

  ipcMain.on('get-font-list', async (event) => {
    const fonts = await fontList.getFonts();
    event.reply('font-list', fonts);
  });

  ipcMain.on('get-not-save-message-history', (event) => {
    event.reply('not-save-message-history', store.get('notSaveMessageHistory') || true);
  });

  // Mix
  ipcMain.on('get-input-audio-device', (event) => {
    event.reply('input-audio-device', store.get('audioInputDevice') || '');
  });

  ipcMain.on('get-output-audio-device', (event) => {
    event.reply('output-audio-device', store.get('audioOutputDevice') || '');
  });

  ipcMain.on('get-mix-effect', (event) => {
    event.reply('mix-effect', store.get('mixEffect') ?? false);
  });

  ipcMain.on('get-mix-effect-type', (event) => {
    event.reply('mix-effect-type', store.get('mixEffectType') || '');
  });

  ipcMain.on('get-auto-mix-setting', (event) => {
    event.reply('auto-mix-setting', store.get('autoMixSetting') ?? false);
  });

  ipcMain.on('get-echo-cancellation', (event) => {
    event.reply('echo-cancellation', store.get('echoCancellation') ?? false);
  });

  ipcMain.on('get-noise-cancellation', (event) => {
    event.reply('noise-cancellation', store.get('noiseCancellation') ?? false);
  });

  ipcMain.on('get-microphone-amplification', (event) => {
    event.reply('microphone-amplification', store.get('microphoneAmplification') ?? false);
  });

  ipcMain.on('get-manual-mix-mode', (event) => {
    event.reply('manual-mix-mode', store.get('manualMixMode') ?? false);
  });

  ipcMain.on('get-mix-mode', (event) => {
    event.reply('mix-mode', store.get('mixMode') || 'all');
  });

  // Voice
  ipcMain.on('get-speaking-mode', (event) => {
    event.reply('speaking-mode', store.get('speakingMode') || 'key');
  });

  ipcMain.on('get-default-speaking-key', (event) => {
    event.reply('default-speaking-key', store.get('defaultSpeakingKey') || '');
  });

  ipcMain.on('get-speaking-mode-auto-key', (event) => {
    event.reply('speaking-mode-auto-key', store.get('speakingModeAutoKey') ?? false);
  });

  // Privacy
  ipcMain.on('get-not-save-message-history', (event) => {
    event.reply('notSaveMessageHistory', store.get('not-save-message-history') ?? true);
  });

  // HotKey
  ipcMain.on('get-hot-key-open-main-window', (event) => {
    event.reply('hot-key-open-main-window', store.get('hotKeyOpenMainWindow') || '');
  });

  ipcMain.on('get-hot-key-increase-volume', (event) => {
    event.reply('hot-key-increase-volume', store.get('hotKeyIncreaseVolume') || '');
  });

  ipcMain.on('get-hot-key-decrease-volume', (event) => {
    event.reply('hot-key-decrease-volume', store.get('hotKeyDecreaseVolume') || '');
  });

  ipcMain.on('get-hot-key-disable-speaker', (event) => {
    event.reply('hot-key-disable-speaker', store.get('hotKeyDisableSpeaker') || '');
  });

  ipcMain.on('get-hot-key-disable-microphone', (event) => {
    event.reply('hot-key-disable-microphone', store.get('hotKeyDisableMicrophone') || '');
  });

  // SoundEffect
  ipcMain.on('get-disable-all-sound-effect', (event) => {
    event.reply('disable-all-sound-effect', store.get('disableAllSoundEffect') ?? false);
  });

  ipcMain.on('get-enter-voice-channel-sound', (event) => {
    event.reply('enter-voice-channel-sound', store.get('enterVoiceChannelSound') ?? true);
  });

  ipcMain.on('get-leave-voice-channel-sound', (event) => {
    event.reply('leave-voice-channel-sound', store.get('leaveVoiceChannelSound') ?? true);
  });

  ipcMain.on('get-start-speaking-sound', (event) => {
    event.reply('start-speaking-sound', store.get('startSpeakingSound') ?? true);
  });

  ipcMain.on('get-stop-speaking-sound', (event) => {
    event.reply('stop-speaking-sound', store.get('stopSpeakingSound') ?? true);
  });

  ipcMain.on('get-receive-direct-message-sound', (event) => {
    event.reply('receive-direct-message-sound', store.get('receiveDirectMessageSound') ?? true);
  });

  ipcMain.on('get-receive-channel-message-sound', (event) => {
    event.reply('receive-channel-message-sound', store.get('receiveChannelMessageSound') ?? true);
  });

  // Basic
  ipcMain.on('set-auto-launch', (_, enable) => {
    setAutoLaunch(enable);
  });

  ipcMain.on('set-font', (_, font) => {
    store.set('font', font || 'Arial');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('font', font);
    });
  });

  ipcMain.on('set-font-size', (_, fontSize) => {
    store.set('fontSize', fontSize || 13);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('font-size', fontSize);
    });
  });

  // Mix
  ipcMain.on('set-input-audio-device', (_, deviceId) => {
    store.set('audioInputDevice', deviceId || '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('input-audio-device', deviceId);
    });
  });

  ipcMain.on('set-output-audio-device', (_, deviceId) => {
    store.set('audioOutputDevice', deviceId || '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('output-audio-device', deviceId);
    });
  });

  ipcMain.on('set-mix-effect', (_, deviceId) => {
    store.set('mixEffect', deviceId ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('mix-effect', deviceId);
    });
  });

  ipcMain.on('set-mix-effect-type', (_, deviceId) => {
    store.set('mixEffectType', deviceId || '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('mix-effect-type', deviceId);
    });
  });

  ipcMain.on('set-auto-mix-setting', (_, deviceId) => {
    store.set('autoMixSetting', deviceId ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('auto-mix-setting', deviceId);
    });
  });

  ipcMain.on('set-echo-cancellation', (_, deviceId) => {
    store.set('echoCancellation', deviceId ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('echo-cancellation', deviceId);
    });
  });

  ipcMain.on('set-noise-cancellation', (_, deviceId) => {
    store.set('noiseCancellation', deviceId ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('noise-cancellation', deviceId);
    });
  });

  ipcMain.on('set-microphone-amplification', (_, deviceId) => {
    store.set('microphoneAmplification', deviceId ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('microphone-amplification', deviceId);
    });
  });

  ipcMain.on('set-manual-mix-mode', (_, deviceId) => {
    store.set('manualMixMode', deviceId ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('manual-mix-mode', deviceId);
    });
  });

  ipcMain.on('set-mix-mode', (_, deviceId) => {
    store.set('mixMode', deviceId || 'all');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('mix-mode', deviceId);
    });
  });

  // Voice
  ipcMain.on('set-speaking-mode', (_, key) => {
    store.set('speakingMode', key || 'key');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('speaking-mode', key);
    });
  });

  ipcMain.on('set-default-speaking-key', (_, key) => {
    store.set('defaultSpeakingKey', key || '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('default-speaking-key', key);
    });
  });

  ipcMain.on('set-speaking-mode-auto-key', (_, key) => {
    store.set('speakingModeAutoKey', key ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('speaking-mode-auto-key', key);
    });
  });

  // Privacy
  ipcMain.on('set-not-save-message-history', (_, enable) => {
    store.set('notSaveMessageHistory', enable ?? true);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('not-save-message-history', enable);
    });
  });

  // HotKey
  ipcMain.on('set-hot-key-open-main-window', (_, key) => {
    store.set('hotKeyOpenMainWindow', key || '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-open-main-window', key);
    });
  });

  ipcMain.on('set-hot-key-increase-volume', (_, key) => {
    store.set('hotKeyIncreaseVolume', key || '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-increase-volume', key);
    });
  });

  ipcMain.on('set-hot-key-decrease-volume', (_, key) => {
    store.set('hotKeyDecreaseVolume', key || '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-decrease-volume', key);
    });
  });

  ipcMain.on('set-hot-key-toggle-speaker', (_, key) => {
    store.set('hotKeyToggleSpeaker', key || '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-toggle-speaker', key);
    });
  });

  ipcMain.on('set-hot-key-toggle-microphone', (_, key) => {
    store.set('hotKeyToggleMicrophone', key || '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-toggle-microphone', key);
    });
  });

  // SoundEffect
  ipcMain.on('set-disable-all-sound-effect', (_, enable) => {
    store.set('disableAllSoundEffect', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('disable-all-sound-effect', enable);
    });
  });

  ipcMain.on('set-enter-voice-channel-sound', (_, enable) => {
    store.set('enterVoiceChannelSound', enable ?? true);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('enter-voice-channel-sound', enable);
    });
  });

  ipcMain.on('set-leave-voice-channel-sound', (_, enable) => {
    store.set('leaveVoiceChannelSound', enable ?? true);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('leave-voice-channel-sound', enable);
    });
  });

  ipcMain.on('set-start-speaking-sound', (_, enable) => {
    store.set('startSpeakingSound', enable ?? true);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('start-speaking-sound', enable);
    });
  });

  ipcMain.on('set-stop-speaking-sound', (_, enable) => {
    store.set('stopSpeakingSound', enable ?? true);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('stop-speaking-sound', enable);
    });
  });

  ipcMain.on('set-receive-direct-message-sound', (_, enable) => {
    store.set('receiveDirectMessageSound', enable ?? true);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('receive-direct-message-sound', enable);
    });
  });

  ipcMain.on('set-receive-channel-message-sound', (_, enable) => {
    store.set('receiveChannelMessageSound', enable ?? true);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('receive-channel-message-sound', enable);
    });
  });

  ipcMain.on('dont-show-disclaimer-next-time', () => {
    store.set('dontShowDisclaimer', true);
  });

  // Open external url handlers
  ipcMain.on('open-external', (_, url) => {
    shell.openExternal(url);
  });
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createAuthWindow();
    await createMainWindow();

    mainWindow.hide();
    authWindow.show();
  }
});

app.whenReady().then(() => {
  const protocolClient = process.execPath;
  const args = process.platform === 'win32' ? [path.resolve(process.argv[1])] : undefined;

  app.setAsDefaultProtocolClient('ricecall', app.isPackaged ? undefined : protocolClient, args);
});

if (!app.requestSingleInstanceLock()) {
  const hasDeepLink = process.argv.find((arg) => arg.startsWith('ricecall://'));
  if (hasDeepLink) {
    app.quit();
  }
} else {
  app.on('second-instance', (_, argv) => {
    const url = argv.find((arg) => arg.startsWith('ricecall://'));
    if (url) {
      handleDeepLink(url);
    } else {
      focusWindow();
    }
  });
}

app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// DeepLink Handler
async function handleDeepLink(url: string) {
  if (!url) return;
  try {
    const { hostname } = new URL(url);
    switch (hostname) {
      case 'join':
        const serverId = new URL(url).searchParams.get('serverId');
        BrowserWindow.getAllWindows().forEach((window) => {
          window.webContents.send('deepLink', serverId);
        });
        break;
    }
  } catch (error) {
    console.error('解析deeplink錯誤:', error);
  }
}
