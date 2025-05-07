/* eslint-disable @typescript-eslint/no-explicit-any */
import net from 'net';
import DiscordRPC from 'discord-rpc';
import path from 'path';
import serve from 'electron-serve';
import Store from 'electron-store';
import { io, Socket } from 'socket.io-client';
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

let tray: Tray | null = null;
let isLogin: boolean = false;
let userId: string | null = null;

const __dirname = process.cwd();

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
  FRIEND_GROUP_ADD = 'friendGroupAdd',
  FRIEND_GROUP_UPDATE = 'friendGroupUpdate',
  FRIEND_GROUP_DELETE = 'friendGroupDelete',
  FRIEND_GROUPS_UPDATE = 'friendGroupsUpdate',
  // Friend
  FRIEND_ADD = 'friendAdd',
  FRIEND_UPDATE = 'friendUpdate',
  FRIEND_DELETE = 'friendDelete',
  FRIENDS_UPDATE = 'friendsUpdate',
  // Friend Application
  FRIEND_APPLICATION_ADD = 'friendApplicationAdd',
  FRIEND_APPLICATION_UPDATE = 'friendApplicationUpdate',
  FRIEND_APPLICATION_DELETE = 'friendApplicationDelete',
  FRIEND_APPLICATIONS_UPDATE = 'friendApplicationsUpdate',
  // Server
  SERVER_SEARCH = 'serverSearch',
  SERVER_ADD = 'serverAdd',
  SERVER_UPDATE = 'serverUpdate',
  SERVER_DELETE = 'serverDelete',
  SERVERS_UPDATE = 'serversUpdate',
  // Channel
  SERVER_CHANNEL_ADD = 'serverChannelAdd',
  SERVER_CHANNEL_UPDATE = 'serverChannelUpdate',
  SERVER_CHANNEL_DELETE = 'serverChannelDelete',
  SERVER_CHANNELS_UPDATE = 'serverChannelsUpdate',
  // Member
  SERVER_MEMBER_ADD = 'serverMemberAdd',
  SERVER_MEMBER_UPDATE = 'serverMemberUpdate',
  SERVER_MEMBER_DELETE = 'serverMemberDelete',
  SERVER_MEMBERS_UPDATE = 'serverMembersUpdate',
  // Member Application
  SERVER_MEMBER_APPLICATION_ADD = 'serverMemberApplicationAdd',
  SERVER_MEMBER_APPLICATION_UPDATE = 'serverMemberApplicationUpdate',
  SERVER_MEMBER_APPLICATION_DELETE = 'serverMemberApplicationDelete',
  SERVER_MEMBER_APPLICATIONS_UPDATE = 'serverMemberApplicationsUpdate',
  // Message
  ON_MESSAGE = 'onMessage',
  ON_DIRECT_MESSAGE = 'onDirectMessage',
  ON_SHAKE_WINDOW = 'onShakeWindow',
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
const BASE_URI = DEV ? 'http://localhost:3000' : '';

// Windows
let mainWindow: BrowserWindow;
let authWindow: BrowserWindow;
let popups: Record<string, BrowserWindow> = {};

// Socket
const WS_URL = process.env.NEXT_PUBLIC_SERVER_URL;
let socketInstance: Socket | null = null;

// Discord RPC
const CLIENT_ID = '1242441392341516288';
DiscordRPC.register(CLIENT_ID);
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

if (app.isPackaged || !DEV) {
  serve({ directory: path.join(__dirname, './out') });
}

// Functions
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

      client.connect({ port: port, host: '127.0.0.1' });
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
    try {
      await waitForPort(3000);
    } catch (err) {
      console.error('Failed to connect to Next.js server:', err);
      app.quit();
      return null;
    }
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
    icon: path.join(
      __dirname,
      'resources',
      process.platform === 'win32' ? 'icon.ico' : 'icon.png',
    ),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
    },
  });

  if (app.isPackaged || !DEV) {
    mainWindow.loadURL('app://-');
  } else {
    mainWindow.loadURL(`${BASE_URI}`);
    mainWindow.webContents.openDevTools();
  }

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
    try {
      await waitForPort(3000);
    } catch (err) {
      console.error('Failed to connect to Next.js server:', err);
      app.quit();
      return;
    }
  }

  authWindow = new BrowserWindow({
    width: 640,
    height: 480,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: true,
    fullscreen: false,
    icon: path.join(
      __dirname,
      'resources',
      process.platform === 'win32' ? 'icon.ico' : 'icon.png',
    ),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
    },
  });

  if (app.isPackaged || !DEV) {
    authWindow.loadURL('app://-/auth.html');
  } else {
    authWindow.loadURL(`${BASE_URI}/auth`);
    authWindow.webContents.openDevTools();
  }

  authWindow.webContents.on('did-finish-load', () => {
    authWindow.webContents.send(
      authWindow.isMaximized() ? 'window-maximized' : 'window-unmaximized',
    );
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
    try {
      await waitForPort(3000);
    } catch (err) {
      console.error('Failed to connect to Next.js server:', err);
      app.quit();
      return null;
    }
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
    popups[id].loadURL(`app://-/popup.html?type=${type}&id=${id}`);
  } else {
    popups[id].loadURL(`${BASE_URI}/popup?type=${type}&id=${id}`);
    popups[id].webContents.openDevTools();
  }

  return popups[id];
}

function closePopups() {
  Object.values(popups).forEach((popup) => {
    if (popup && !popup.isDestroyed()) {
      popup.close();
    }
  });
  popups = {};
}

// Socket Functions
function connectSocket(token: string): Socket | null {
  if (!token) return null;

  if (socketInstance) {
    socketInstance = disconnectSocket();
  }

  const socket = io(WS_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
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
        // if (!userId && args[0] && args[0].userId) {
        //   userId = args[0].userId;
        // }

        // shakeDirectMessage unique handling
        if (event === SocketServerEvent.ON_SHAKE_WINDOW) {
          const {
            userId: fromUserId,
            targetId: toUserId,
            targetName: fromUserName,
          } = args[0];

          // check data validity
          if (!fromUserId || !toUserId || !fromUserName) {
            console.error('無效的抖動消息數據');
            return;
          }

          // generate window key
          const windowId = `directMessage_${fromUserId}`;

          // check if direct message popup window exists
          if (popups[windowId] && !popups[windowId].isDestroyed()) {
            // is exists, set always on top to set top and cancel to avoid top-locked
            popups[windowId].setAlwaysOnTop(true);
            popups[windowId].setAlwaysOnTop(false);
            popups[windowId].focus();
          } else {
            // not exists, create new direct message popup window
            createPopup('directMessage', windowId, 600, 800).then((window) => {
              if (!window) return;

              window.setAlwaysOnTop(true);
              window.setAlwaysOnTop(false);
              window.focus();

              window.webContents.send(
                SocketServerEvent.ON_SHAKE_WINDOW,
                ...args,
              );

              ipcMain.on('request-initial-data', (_, to) => {
                if (to === windowId) {
                  window.webContents.send('response-initial-data', windowId, {
                    userId: toUserId,
                    targetId: fromUserId,
                    targetName: fromUserName,
                  });
                }
              });
            });
          }
        }

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
function configureAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;

  if (DEV) {
    autoUpdater.forceDevUpdateConfig = true;
    autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml');
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
      buttons: [''],
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
}

const configureUpdateChecker = async () => {
  setInterval(checkUpdate, 60 * 60 * 1000);
};

const checkUpdate = async () => {
  try {
    if (DEV) return;
    await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error('定期檢查更新失敗:', error);
  }
};

// Discord RPC Functions
async function setActivity(presence: DiscordRPC.Presence) {
  if (!rpc) return;
  try {
    await rpc.setActivity(presence);
  } catch (error) {
    await rpc.setActivity(defaultPrecence);

    console.error('設置 Discord RPC 時出錯:', error);
  }
}

async function configureDiscordRPC() {
  try {
    rpc = new DiscordRPC.Client({ transport: 'ipc' });

    await rpc.login({ clientId: CLIENT_ID }).catch(() => {
      console.warn('Discord RPC 登錄失敗, 將不會顯示 Discord 狀態');
      rpc = null;
    });

    if (!rpc) return;

    rpc.on('ready', () => {
      setActivity(defaultPrecence);
    });
  } catch (error) {
    rpc = null;

    console.error('Discord RPC 初始化失敗:', error);
  }
}

// Tray Icon
function trayIcon(isGray = true) {
  if (tray) tray.destroy();

  const iconPath = isGray ? 'resources/tray_gray.ico' : 'resources/tray.ico';

  tray = new Tray(nativeImage.createFromPath(path.join(__dirname, iconPath)));

  tray.on('click', () => {
    if (mainWindow && authWindow.isVisible()) {
      authWindow.hide();
    } else if (mainWindow && mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      (authWindow || mainWindow)?.show();
    }
  });

  const contextMenu = Menu.buildFromTemplate([
    { label: '打開主視窗', type: 'normal', click: () => app.focus() },
    { type: 'separator' },
    {
      label: '登出',
      type: 'normal',
      enabled: isLogin,
      click: () => {
        closePopups();
        ipcMain.emit('logout');
      },
    },
    { label: '退出', type: 'normal', click: () => app.quit() },
  ]);

  tray.setToolTip(`RiceCall v${app.getVersion()}`);
  tray.setContextMenu(contextMenu);
}

app.on('ready', async () => {
  trayIcon(true);
  await createAuthWindow();
  await createMainWindow();

  mainWindow.hide();
  authWindow.show();

  configureAutoUpdater();
  configureUpdateChecker();
  configureDiscordRPC();

  app.on('before-quit', () => {
    if (rpc) {
      rpc.destroy().catch((error) => {
        console.error('Discord RPC 銷毀失敗:', error);
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
    trayIcon(false);
  });

  ipcMain.on('logout', () => {
    if (rpc) {
      rpc.clearActivity().catch((error) => {
        console.error('清除 Discord 狀態失敗:', error);
      });
    }
    closePopups();
    mainWindow.hide();
    authWindow.show();
    socketInstance = disconnectSocket();
    isLogin = false;
    trayIcon(true);
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
    console.log('popup-submit', to);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('popup-submit', to);
    });
  });

  // Window control event handlers
  ipcMain.on('window-control', (event, command) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;
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
    window.webContents.send(command);
  });

  // Discord RPC handlers
  ipcMain.on('update-discord-presence', (_, updatePresence) => {
    setActivity(updatePresence);
  });

  // System settings handlers
  ipcMain.on('get-system-settings', (event) => {
    const settings = {
      autoLaunch: isAutoLaunchEnabled(),
      inputAudioDevice: store.get('audioInputDevice'),
      outputAudioDevice: store.get('audioOutputDevice'),
    };
    event.reply('system-settings-status', settings);
  });

  ipcMain.on('get-auto-launch', (event) => {
    event.reply('auto-launch-status', isAutoLaunchEnabled());
  });

  ipcMain.on('get-input-audio-device', (event) => {
    event.reply('input-audio-device-status', store.get('audioInputDevice'));
  });

  ipcMain.on('get-output-audio-device', (event) => {
    event.reply('output-audio-device-status', store.get('audioOutputDevice'));
  });

  ipcMain.on('set-auto-launch', (_, enable) => {
    setAutoLaunch(enable);
  });

  ipcMain.on('set-input-audio-device', (_, deviceId) => {
    store.set('audioInputDevice', deviceId);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('input-audio-device-status', deviceId);
    });
  });

  ipcMain.on('set-output-audio-device', (_, deviceId) => {
    store.set('audioOutputDevice', deviceId);
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
    // 如果是 deeplink 啟動，則退出新實例
    console.log('防止多開');
    app.quit();
  }
} else {
  app.on('second-instance', (event, argv) => {
    const url = argv.find((arg) => arg.startsWith('ricecall://'));
    if (url) {
      console.log('接收到 deeplink (Windows second-instance):', url);
      handleDeepLink(url);
    } else {
      focusWindow();
    }
  });
}

app.on('open-url', (event, url) => {
  event.preventDefault();
  console.log('接收到 deeplink (macOS open-url):', url);
  handleDeepLink(url);
});

// 集中處理 DeepLink
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
        // 如果已經登入才能發進群請求
        if (serverId && userId && socketInstance && socketInstance.connected) {
          socketInstance.emit(SocketClientEvent.SEARCH_SERVER, {
            query: serverId,
          });
          socketInstance.on(
            SocketServerEvent.SERVER_SEARCH,
            (serverInfoList) => {
              // 對照DisplayId 如果找不到就不會進群也不會通知前端
              const matchedServer = serverInfoList.find(
                (server: any) => server.displayId === serverId,
              );
              if (matchedServer) {
                mainWindow.show();
                mainWindow.focus();
                socketInstance?.emit(SocketClientEvent.CONNECT_SERVER, {
                  userId,
                  serverId: matchedServer.serverId,
                });
              }
            },
          );
        }
        break;
    }
  } catch (error) {
    console.error('解析deeplink錯誤:', error);
  }
}
