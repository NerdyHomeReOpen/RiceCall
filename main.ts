/* eslint-disable @typescript-eslint/no-explicit-any */
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import { io, Socket } from 'socket.io-client';
import DiscordRPC from 'discord-rpc';
import dotenv from 'dotenv';
import serve from 'electron-serve';
import Store from 'electron-store';
import ElectronUpdater from 'electron-updater';
import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  Tray,
  Menu,
  nativeImage,
} from 'electron';

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
  USER_INFO = 'userInfo',
  USER_SETTING = 'userSetting',
  CHANNEL_SETTING = 'channelSetting',
  CHANNEL_PASSWORD = 'channelPassword',
  SERVER_SETTING = 'serverSetting',
  SERVER_BROADCAST = 'serverBroadcast',
  BLOCK_MEMBER = 'blockMember',
  SYSTEM_SETTING = 'systemSetting',
  MEMBERAPPLY_SETTING = 'memberApplySetting',
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
  [PopupType.MEMBERAPPLY_SETTING]: { height: 200, width: 370 },
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
// const WS_URL = process.env.NEXT_PUBLIC_SERVER_URL;
const WS_URL_SECONDARY = process.env.NEXT_PUBLIC_SERVER_URL_SECONDARY;
const BASE_URI = DEV ? 'http://localhost:3000' : 'app://-';
const FILE_PATH = fileURLToPath(import.meta.url);
const DIR_PATH = path.dirname(FILE_PATH);
const ROOT_PATH = DEV ? DIR_PATH : path.join(DIR_PATH, '../');
const DISCORD_RPC_CLIENT_ID = '1242441392341516288';
const APP_ICON =
  process.platform === 'win32'
    ? path.join(ROOT_PATH, 'resources', 'icon.ico')
    : path.join(ROOT_PATH, 'resources', 'icon.png');
const APP_TRAY_ICON = {
  gray:
    process.platform === 'win32'
      ? path.join(ROOT_PATH, 'resources', 'tray_gray.ico')
      : path.join(ROOT_PATH, 'resources', 'tray_gray.png'),
  normal:
    process.platform === 'win32'
      ? path.join(ROOT_PATH, 'resources', 'tray.ico')
      : path.join(ROOT_PATH, 'resources', 'tray.png'),
};

// Windows
let mainWindow: BrowserWindow;
let authWindow: BrowserWindow;
let popups: Record<string, BrowserWindow> = {};

// Socket
let websocketUrl = WS_URL_SECONDARY;
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

const appServe = serve({ directory: path.join(ROOT_PATH, 'out') });

// Functions
async function checkIsHinet() {
  const ipData = await fetch('https://ipinfo.io/json').then((res) =>
    res.json(),
  );
  return ipData.org.startsWith('AS3462');
}

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
  const window =
    authWindow.isDestroyed() === false
      ? authWindow
      : mainWindow.isDestroyed() === false
      ? mainWindow
      : null;
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
    waitForPort(3000).catch((err) => {
      console.error('Cannot connect to Next.js server:', err);
      app.exit();
    });
  }

  mainWindow = new BrowserWindow({
    width: 1080,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    transparent: true,
    resizable: true,
    hasShadow: true,
    icon: APP_ICON,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
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

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send(
      mainWindow.isMaximized() ? 'window-maximized' : 'window-unmaximized',
    );
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
    waitForPort(3000).catch((err) => {
      console.error('Cannot connect to Next.js server:', err);
      app.quit();
    });
  }

  authWindow = new BrowserWindow({
    width: 640,
    height: 480,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: true,
    fullscreen: false,
    icon: APP_ICON,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
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

  authWindow.show();
  authWindow.focus();
  authWindow.setAlwaysOnTop(true);
  authWindow.setAlwaysOnTop(false);

  return authWindow;
}

async function createPopup(
  type: PopupType,
  id: string,
  force = true,
): Promise<BrowserWindow | null> {
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
    waitForPort(3000).catch((err) => {
      console.error('Cannot connect to Next.js server:', err);
      app.exit();
    });
  }

  popups[id] = new BrowserWindow({
    width: PopupSize[type].width,
    height: PopupSize[type].height,
    resizable: false,
    frame: false,
    transparent: true,
    hasShadow: true,
    modal: true,
    fullscreen: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (app.isPackaged || !DEV) {
    appServe(popups[id]).then(() => {
      popups[id].loadURL(`${BASE_URI}/popup.html?type=${type}&id=${id}`);
    });
  } else {
    popups[id].loadURL(`${BASE_URI}/popup?type=${type}&id=${id}`);
    // popups[id].webContents.openDevTools();
  }

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
    autoUpdater.updateConfigPath = path.join(ROOT_PATH, 'dev-app-update.yml');
  }

  autoUpdater.on('error', (error: any) => {
    if (DEV && error.message.includes('dev-app-update.yml')) {
      console.info('開發環境中跳過更新檢查');
      return;
    }
    dialog.showMessageBox({
      type: 'error',
      title: '更新錯誤',
      message: '檢查更新時發生錯誤：' + error.message,
    });
  });

  autoUpdater.on('update-available', (info: any) => {
    dialog.showMessageBox({
      type: 'info',
      title: '有新版本可用',
      message: `正在下載新版本 ${info.version} 發布於 ${info.releaseDate}，請不要關閉此視窗及進行其他操作...`,
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

  // Check update every hour
  setInterval(checkUpdate, 60 * 60 * 1000);
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

  if (await checkIsHinet()) websocketUrl = WS_URL_SECONDARY;

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
    return socketInstance && socketInstance.connected
      ? 'connected'
      : 'disconnected';
  });

  // Initial data request handlers
  ipcMain.on('request-initial-data', (_, from) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('request-initial-data', from);
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

  ipcMain.on('popup-submit', (_, to) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('popup-submit', to);
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
        window.setResizable(false);
        window.setMovable(false);
        break;
      case 'unmaximize':
        window.unmaximize();
        window.setResizable(true);
        window.setMovable(true);
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
      autoLaunch: isAutoLaunchEnabled(),
      soundEffect: store.get('soundEffect') || true,
      inputAudioDevice: store.get('audioInputDevice') || '',
      outputAudioDevice: store.get('audioOutputDevice') || '',
      dontShowDisclaimer: store.get('dontShowDisclaimer') || false,
    };
    event.reply('system-settings-status', settings);
  });

  ipcMain.on('get-auto-launch', (event) => {
    event.reply('auto-launch-status', isAutoLaunchEnabled());
  });

  ipcMain.on('get-sound-effect', (event) => {
    event.reply('sound-effect-status', store.get('soundEffect') || true);
  });

  ipcMain.on('get-input-audio-device', (event) => {
    event.reply(
      'input-audio-device-status',
      store.get('audioInputDevice') || '',
    );
  });

  ipcMain.on('get-output-audio-device', (event) => {
    event.reply(
      'output-audio-device-status',
      store.get('audioOutputDevice') || '',
    );
  });

  ipcMain.on('set-auto-launch', (_, enable) => {
    setAutoLaunch(enable);
  });

  ipcMain.on('set-sound-effect', (_, enable) => {
    store.set('soundEffect', enable || true);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('sound-effect-status', enable);
    });
  });

  ipcMain.on('set-input-audio-device', (_, deviceId) => {
    store.set('audioInputDevice', deviceId || '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('input-audio-device-status', deviceId);
    });
  });

  ipcMain.on('set-output-audio-device', (_, deviceId) => {
    store.set('audioOutputDevice', deviceId || '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('output-audio-device-status', deviceId);
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
  const args =
    process.platform === 'win32' ? [path.resolve(process.argv[1])] : undefined;

  app.setAsDefaultProtocolClient(
    'ricecall',
    app.isPackaged ? undefined : protocolClient,
    args,
  );
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
