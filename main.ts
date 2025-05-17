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
};
const store = new Store<StoreSchema>();

enum SocketClientEvent {
  // User
  SEARCH_USER = 'searchUser',
  UPDATE_USER = 'updateUser',
  // Server
  FAVORITE_SERVER = 'favoriteServer',
  SEARCH_SERVER = 'searchServer',
  CONNECT_SERVER = 'connectServer',
  DISCONNECT_SERVER = 'disconnectServer',
  CREATE_SERVER = 'createServer',
  UPDATE_SERVER = 'updateServer',
  DELETE_SERVER = 'deleteServer',
  // Channel
  CONNECT_CHANNEL = 'connectChannel',
  DISCONNECT_CHANNEL = 'disconnectChannel',
  CREATE_CHANNEL = 'createChannel',
  UPDATE_CHANNEL = 'updateChannel',
  UPDATE_CHANNELS = 'updateChannels',
  DELETE_CHANNEL = 'deleteChannel',
  // Friend Group
  CREATE_FRIEND_GROUP = 'createFriendGroup',
  UPDATE_FRIEND_GROUP = 'updateFriendGroup',
  DELETE_FRIEND_GROUP = 'deleteFriendGroup',
  // Member
  CREATE_MEMBER = 'createMember',
  UPDATE_MEMBER = 'updateMember',
  DELETE_MEMBER = 'deleteMember',
  // Friend
  CREATE_FRIEND = 'createFriend',
  UPDATE_FRIEND = 'updateFriend',
  DELETE_FRIEND = 'deleteFriend',
  // Member Application
  CREATE_MEMBER_APPLICATION = 'createMemberApplication',
  UPDATE_MEMBER_APPLICATION = 'updateMemberApplication',
  DELETE_MEMBER_APPLICATION = 'deleteMemberApplication',
  // Friend Application
  CREATE_FRIEND_APPLICATION = 'createFriendApplication',
  UPDATE_FRIEND_APPLICATION = 'updateFriendApplication',
  DELETE_FRIEND_APPLICATION = 'deleteFriendApplication',
  APPROVE_FRIEND_APPLICATION = 'approveFriendApplication',
  // Message
  SEND_MESSAGE = 'message',
  SEND_DIRECT_MESSAGE = 'directMessage',
  SEND_SHAKE_WINDOW = 'shakeWindow',
  // RTC
  RTC_OFFER = 'RTCOffer',
  RTC_ANSWER = 'RTCAnswer',
  RTC_ICE_CANDIDATE = 'RTCIceCandidate',
  // Echo
  PING = 'ping',
}

enum SocketServerEvent {
  // Notification
  NOTIFICATION = 'notification', // not used yet
  // User
  USER_SEARCH = 'userSearch',
  USER_UPDATE = 'userUpdate',
  // Friend Group
  FRIEND_GROUPS_SET = 'friendGroupsSet',
  FRIEND_GROUP_ADD = 'friendGroupAdd',
  FRIEND_GROUP_UPDATE = 'friendGroupUpdate',
  FRIEND_GROUP_DELETE = 'friendGroupDelete',
  // Friend
  FRIENDS_SET = 'friendsSet',
  FRIEND_ADD = 'friendAdd',
  FRIEND_UPDATE = 'friendUpdate',
  FRIEND_DELETE = 'friendDelete',
  // Friend Application
  FRIEND_APPLICATIONS_SET = 'friendApplicationsSet',
  FRIEND_APPLICATION_ADD = 'friendApplicationAdd',
  FRIEND_APPLICATION_UPDATE = 'friendApplicationUpdate',
  FRIEND_APPLICATION_DELETE = 'friendApplicationDelete',
  // Server
  SERVER_SEARCH = 'serverSearch',
  SERVERS_SET = 'serversSet',
  SERVER_ADD = 'serverAdd',
  SERVER_UPDATE = 'serverUpdate',
  SERVER_DELETE = 'serverDelete',
  // Channel
  SERVER_CHANNELS_SET = 'serverChannelsSet',
  SERVER_CHANNEL_ADD = 'serverChannelAdd',
  SERVER_CHANNEL_UPDATE = 'serverChannelUpdate',
  SERVER_CHANNEL_DELETE = 'serverChannelDelete',
  // Member
  SERVER_MEMBERS_SET = 'serverMembersSet',
  SERVER_MEMBER_ADD = 'serverMemberAdd',
  SERVER_MEMBER_UPDATE = 'serverMemberUpdate',
  SERVER_MEMBER_DELETE = 'serverMemberDelete',
  SERVER_ONLINE_MEMBERS_SET = 'serverOnlineMembersSet',
  SERVER_ONLINE_MEMBER_ADD = 'serverOnlineMemberAdd',
  SERVER_ONLINE_MEMBER_DELETE = 'serverOnlineMemberDelete',
  // Member Application
  SERVER_MEMBER_APPLICATIONS_SET = 'serverMemberApplicationsSet',
  SERVER_MEMBER_APPLICATION_ADD = 'serverMemberApplicationAdd',
  SERVER_MEMBER_APPLICATION_UPDATE = 'serverMemberApplicationUpdate',
  SERVER_MEMBER_APPLICATION_DELETE = 'serverMemberApplicationDelete',
  // Message
  ON_MESSAGE = 'onMessage',
  ON_DIRECT_MESSAGE = 'onDirectMessage',
  // RTC
  RTC_OFFER = 'RTCOffer',
  RTC_ANSWER = 'RTCAnswer',
  RTC_ICE_CANDIDATE = 'RTCIceCandidate',
  RTC_JOIN = 'RTCJoin',
  RTC_LEAVE = 'RTCLeave',
  // Play
  PLAY_SOUND = 'playSound',
  // Echo
  PONG = 'pong',
  // Error
  ERROR = 'error',
  // Popup
  OPEN_POPUP = 'openPopup',
}

// Constants
const DEV = process.argv.includes('--dev');
const WS_URL = process.env.NEXT_PUBLIC_SERVER_URL;
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
let websocketUrl = WS_URL;
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

  return authWindow;
}

async function createPopup(
  type: string,
  id: string,
  height: number,
  width: number,
): Promise<BrowserWindow | null> {
  if (popups[id] && !popups[id].isDestroyed()) {
    popups[id].destroy();
  }

  if (DEV) {
    waitForPort(3000).catch((err) => {
      console.error('Cannot connect to Next.js server:', err);
      app.exit();
    });
  }

  popups[id] = new BrowserWindow({
    width: width ?? 800,
    height: height ?? 600,
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
    reconnectionDelay: 10000,
    reconnectionDelayMax: 20000,
    timeout: 20000,
    autoConnect: false,
    query: {
      jwt: token,
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
        console.log('socket.emit', event, ...args);
        socket.emit(event, ...args);
      });
    });

    Object.values(SocketServerEvent).forEach((event) => {
      socket.on(event, (...args) => {
        console.log('socket.on', event, ...args);
        BrowserWindow.getAllWindows().forEach((window) => {
          window.webContents.send(event, ...args);
        });
      });
    });

    console.info('Socket 連線成功');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('connect', null);
    });
  });

  socket.on('connect_error', (error) => {
    console.error('Socket 連線失敗:', error.message);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('connect_error', error);
    });
  });

  socket.on('disconnect', (reason) => {
    console.info('Socket 斷開連線，原因:', reason);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('disconnect', reason);
    });
  });

  socket.on('reconnect', (attemptNumber) => {
    console.info('Socket 重新連線成功，嘗試次數:', attemptNumber);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('reconnect', attemptNumber);
    });
  });

  socket.on('reconnect_error', (error) => {
    console.error('Socket 重新連線失敗:', error.message);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('reconnect_error', error);
    });
  });

  socket.on('onShakeWindow', (data) => {
    if (!data) return;

    const windowId = `directMessage-${data.targetId}`;

    if (popups[windowId] && !popups[windowId].isDestroyed()) {
      popups[windowId].setAlwaysOnTop(true);
      popups[windowId].setAlwaysOnTop(false);
      popups[windowId].focus();
      popups[windowId].webContents.send('shakeWindow');
    } else {
      createPopup('directMessage', windowId, 550, 650).then((window) => {
        if (!window) return;

        ipcMain.once('request-initial-data', async (_, to) => {
          if (to === windowId) {
            window.webContents.send('response-initial-data', windowId, {
              userId: data.userId,
              targetId: data.targetId,
              targetName: data.name,
            });
            await new Promise((resolve) => setTimeout(resolve, 1000));
            window.setAlwaysOnTop(true);
            window.setAlwaysOnTop(false);
            window.focus();
            window.webContents.send('shakeWindow');
          }
        });
      });
    }
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
  ipcMain.on('open-popup', (_, type, id, height, width) => {
    createPopup(type, id, height, width);
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
      // 執行主程式 應該用不到 測試用的
      // case 'run':
      //   if (authWindow?.isDestroyed() === false) {
      //     authWindow.show();
      //     authWindow.focus();
      //   } else if (mainWindow?.isDestroyed() === false) {
      //     mainWindow.show();
      //     mainWindow.focus();
      //   } else {
      //     (await createMainWindow()).show();
      //   }
      //   break;
      case 'join':
        const serverId = new URL(url).searchParams.get('serverId');
        BrowserWindow.getAllWindows().forEach((window) => {
          window.webContents.send('deepLink', serverId);
        });
        // // 如果已經登入才能發進群請求
        // if (serverId && userId && socketInstance && socketInstance.connected) {
        //   socketInstance.emit(SocketClientEvent.SEARCH_SERVER, {
        //     query: serverId,
        //   });
        //   socketInstance.on(
        //     SocketServerEvent.SERVER_SEARCH,
        //     (serverInfoList) => {
        //       // 對照DisplayId 如果找不到就不會進群也不會通知前端
        //       const matchedServer = serverInfoList.find(
        //         (server: any) => server.displayId === serverId,
        //       );
        //       if (matchedServer) {
        //         mainWindow.show();
        //         mainWindow.focus();
        //         socketInstance?.emit(SocketClientEvent.CONNECT_SERVER, {
        //           userId,
        //           serverId: matchedServer.serverId,
        //         });
        //       }
        //     },
        //   );
        // }
        break;
    }
  } catch (error) {
    console.error('解析deeplink錯誤:', error);
  }
}
