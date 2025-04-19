import path from 'path';
import { fileURLToPath } from 'url';
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
import serve from 'electron-serve';
import net from 'net';
import DiscordRPC from 'discord-rpc';
import { io } from 'socket.io-client';
import electronUpdater from 'electron-updater';
import Store from 'electron-store';
import dotenv from 'dotenv';
dotenv.config();

let tray = null,
  isLogin = false,
  userId = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { autoUpdater } = electronUpdater;
const store = new Store();

const SocketClientEvent = {
  // User
  SEARCH_USER: 'searchUser',
  UPDATE_USER: 'updateUser',
  // Server
  SEARCH_SERVER: 'searchServer',
  CONNECT_SERVER: 'connectServer',
  DISCONNECT_SERVER: 'disconnectServer',
  CREATE_SERVER: 'createServer',
  UPDATE_SERVER: 'updateServer',
  DELETE_SERVER: 'deleteServer',
  // Category
  CREATE_CATEGORY: 'createCategory',
  UPDATE_CATEGORY: 'updateCategory',
  DELETE_CATEGORY: 'deleteCategory',
  // Channel
  CONNECT_CHANNEL: 'connectChannel',
  DISCONNECT_CHANNEL: 'disconnectChannel',
  CREATE_CHANNEL: 'createChannel',
  UPDATE_CHANNEL: 'updateChannel',
  UPDATE_CHANNELS: 'updateChannels',
  DELETE_CHANNEL: 'deleteChannel',
  // Friend Group
  CREATE_FRIEND_GROUP: 'createFriendGroup',
  UPDATE_FRIEND_GROUP: 'updateFriendGroup',
  DELETE_FRIEND_GROUP: 'deleteFriendGroup',
  // Member
  CREATE_MEMBER: 'createMember',
  UPDATE_MEMBER: 'updateMember',
  DELETE_MEMBER: 'deleteMember',
  // Friend
  CREATE_FRIEND: 'createFriend',
  UPDATE_FRIEND: 'updateFriend',
  DELETE_FRIEND: 'deleteFriend',
  // Member Application
  CREATE_MEMBER_APPLICATION: 'createMemberApplication',
  UPDATE_MEMBER_APPLICATION: 'updateMemberApplication',
  DELETE_MEMBER_APPLICATION: 'deleteMemberApplication',
  // Friend Application
  CREATE_FRIEND_APPLICATION: 'createFriendApplication',
  UPDATE_FRIEND_APPLICATION: 'updateFriendApplication',
  DELETE_FRIEND_APPLICATION: 'deleteFriendApplication',
  // Message
  SEND_MESSAGE: 'message',
  SEND_DIRECT_MESSAGE: 'directMessage',
  // RTC
  RTC_OFFER: 'RTCOffer',
  RTC_ANSWER: 'RTCAnswer',
  RTC_ICE_CANDIDATE: 'RTCIceCandidate',
  // Echo
  PING: 'ping',
};

const SocketServerEvent = {
  // Notification
  NOTIFICATION: 'notification', // not used yet
  // User
  USER_SEARCH: 'userSearch',
  USER_UPDATE: 'userUpdate',
  USER_SERVERS_UPDATE: 'userServersUpdate',
  USER_FRIEND_GROUPS_UPDATE: 'userFriendGroupsUpdate',
  USER_FRIENDS_UPDATE: 'userFriendsUpdate',
  USER_FRIEND_APPLICATIONS_UPDATE: 'userFriendApplicationsUpdate',
  // Server
  SERVER_SEARCH: 'serverSearch',
  SERVER_UPDATE: 'serverUpdate',
  SERVER_CHANNELS_UPDATE: 'serverChannelsUpdate',
  SERVER_MEMBERS_UPDATE: 'serverMembersUpdate',
  SERVER_MEMBER_APPLICATIONS_UPDATE: 'serverMemberApplicationsUpdate',
  // Channel
  CHANNEL_UPDATE: 'channelUpdate',
  // Category
  CATEGORY_UPDATE: 'categoryUpdate',
  // Friend Group
  FRIEND_GROUP_UPDATE: 'friendGroupUpdate',
  // Member
  MEMBER_UPDATE: 'memberUpdate',
  // Member Application
  MEMBER_APPLICATION_UPDATE: 'memberApplicationUpdate',
  // Friend
  FRIEND_UPDATE: 'friendUpdate',
  // Friend Application
  FRIEND_APPLICATION_UPDATE: 'friendApplicationUpdate',
  // Direct Message
  ON_MESSAGE: 'onMessage',
  ON_DIRECT_MESSAGE: 'onDirectMessage',
  // Popup
  OPEN_POPUP: 'openPopup',
  // RTC
  RTC_OFFER: 'RTCOffer',
  RTC_ANSWER: 'RTCAnswer',
  RTC_ICE_CANDIDATE: 'RTCIceCandidate',
  RTC_JOIN: 'RTCJoin',
  RTC_LEAVE: 'RTCLeave',
  // Error
  ERROR: 'error',
  // Play
  PLAY_SOUND: 'playSound',
  // Echo
  PONG: 'pong',
};

let isDev = process.argv.includes('--dev');

const appServe = app.isPackaged
  ? serve({
      directory: path.join(__dirname, './out'),
    })
  : !isDev
  ? serve({
      directory: path.join(__dirname, './out'),
    })
  : null;

let baseUri = '';

if (isDev) {
  baseUri = 'http://127.0.0.1:3000';
}

// Track windows
let mainWindow = null;
let authWindow = null;
let popups = {};

// Socket connection
const WS_URL = process.env.NEXT_PUBLIC_SERVER_URL;
let socketInstance = null;

// Discord RPC
const clientId = '1242441392341516288';
DiscordRPC.register(clientId);
let rpc = null;

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

function waitForPort(port) {
  return new Promise((resolve, reject) => {
    let timeout = 30000; // 30 seconds timeout
    let timer;

    function tryConnect() {
      const client = new net.Socket();

      client.once('connect', () => {
        clearTimeout(timer);
        client.destroy();
        resolve();
      });

      client.once('error', () => {
        client.destroy();
        if (timeout <= 0) {
          clearTimeout(timer);
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

function setAutoLaunch(enable) {
  try {
    app.setLoginItemSettings({
      openAtLogin: enable,
      openAsHidden: false,
    });
  } catch (error) {
    console.error('設置開機自動啟動時出錯:', error);
  }
}

function isAutoLaunchEnabled() {
  try {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  } catch (error) {
    console.error('讀取開機自動啟動狀態時出錯:', error);
    return false;
  }
}

async function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    return mainWindow;
  }

  if (isDev) {
    try {
      await waitForPort(3000);
    } catch (err) {
      console.error('Failed to connect to Next.js server:', err);
      app.quit();
      return;
    }
  }

  mainWindow = new BrowserWindow({
    minWidth: 950,
    minHeight: 700,
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
    },
  });

  if (app.isPackaged || !isDev) {
    appServe(mainWindow).then(() => {
      mainWindow.loadURL('app://-');
    });
  } else {
    mainWindow.loadURL(`${baseUri}`);
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

  mainWindow.webContents.on('close', () => {
    app.quit();
  });

  return mainWindow;
}

async function createAuthWindow() {
  if (authWindow && !authWindow.isDestroyed()) {
    authWindow.focus();
    return authWindow;
  }

  if (isDev) {
    try {
      await waitForPort(3000);
    } catch (err) {
      console.error('Failed to connect to Next.js server:', err);
      app.quit();
      return;
    }
  }

  authWindow = new BrowserWindow({
    width: 610,
    height: 450,
    resizable: false,
    frame: false,
    transparent: true,
    hasShadow: true,
    icon: path.join(
      __dirname,
      'resources',
      process.platform === 'win32' ? 'icon.ico' : 'icon.png',
    ),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (app.isPackaged || !isDev) {
    appServe(authWindow).then(() => {
      authWindow.loadURL('app://-/auth.html');
    });
  } else {
    authWindow.loadURL(`${baseUri}/auth`);
    authWindow.webContents.openDevTools();
  }

  authWindow.webContents.on('did-finish-load', () => {
    authWindow.webContents.send(
      authWindow.isMaximized() ? 'window-maximized' : 'window-unmaximized',
    );
  });

  authWindow.webContents.on('close', () => {
    app.quit();
  });

  return authWindow;
}

async function createPopup(type, height, width, additionalData = {}) {
  // 針對DirectMessage類型，使用targetId來區分不同的對話視窗
  let windowKey = type;
  if (type === 'directMessage' && additionalData.targetId) {
    windowKey = `${type}_${additionalData.targetId}`;
  }

  // Track popup windows
  if (popups[windowKey] && !popups[windowKey].isDestroyed()) {
    popups[windowKey].focus();
    return popups[windowKey];
  }

  if (isDev) {
    try {
      await waitForPort(3000);
    } catch (err) {
      console.error('Failed to connect to Next.js server:', err);
      app.quit();
      return;
    }
  }

  popups[windowKey] = new BrowserWindow({
    width: width ?? 800,
    height: height ?? 600,
    resizable: false,
    frame: false,
    transparent: true,
    hasShadow: true,
    modal: true,
    parent: null,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (app.isPackaged || !isDev) {
    appServe(popups[windowKey]).then(() => {
      popups[windowKey].loadURL(`app://-/popup.html?type=${type}`);
    });
  } else {
    popups[windowKey].loadURL(`${baseUri}/popup?type=${type}`);
    popups[windowKey].webContents.openDevTools();
  }

  popups[windowKey].webContents.on('resize', (_, width, height) => {
    popups[windowKey].webContents.setSize(width, height);
  });

  popups[windowKey].webContents.on('closed', () => {
    popups[windowKey] = null;
  });

  return popups[windowKey];
}

function connectSocket(token) {
  if (!token) return null;

  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = disconnectSocket(socketInstance);
  }

  const socket = io(WS_URL, {
    transports: ['websocket'],
    reconnection: true,
    // reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: false,
    query: {
      jwt: token,
    },
  });

  const ipcHandlers = Object.values(SocketClientEvent).reduce((acc, event) => {
    acc[event] = (_, data) => socket.emit(event, data);
    return acc;
  }, {});

  socket.on('connect', () => {
    Object.values(SocketClientEvent).forEach((event) => {
      ipcMain.removeAllListeners(event);
    });

    Object.entries(ipcHandlers).forEach(([event, handler]) => {
      ipcMain.on(event, handler);
    });

    Object.values(SocketServerEvent).forEach((event) => {
      socket.on(event, (data) => {
        if (!userId && data && data.userId) {
          userId = data.userId;
        }
        BrowserWindow.getAllWindows().forEach((window) => {
          window.webContents.send(event, data);
        });
      });
    });

    console.info('Socket 連線成功');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('connect', null);
    });
  });

  socket.on('connect_error', (error) => {
    console.error('Socket 連線失敗:', error);
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
    console.error('Socket 重新連線失敗:', error);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('reconnect_error', error);
    });
  });

  socket.ipcHandlers = ipcHandlers;
  return socket;
}

function disconnectSocket(socket) {
  if (!socket) return null;

  if (socket.ipcHandlers) {
    Object.entries(socket.ipcHandlers).forEach(([event, handler]) => {
      ipcMain.removeListener(event, handler);
    });
  }

  Object.values(SocketServerEvent).forEach((event) => {
    socket.off(event);
  });

  return null;
}

async function setActivity(activity) {
  if (!rpc) return;
  try {
    rpc.setActivity(activity);
  } catch (error) {
    console.error('設置Rich Presence時出錯:', error);
    rpc.setActivity(defaultPrecence);
  }
}

function configureAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;

  if (isDev) {
    autoUpdater.forceDevUpdateConfig = true;
    autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml');
  }

  autoUpdater.on('error', (error) => {
    if (isDev && error.message.includes('dev-app-update.yml')) {
      console.info('開發環境中跳過更新檢查');
      return;
    }
    dialog.showMessageBox({
      type: 'error',
      title: '更新錯誤',
      message: '檢查更新時發生錯誤：' + error.message,
    });
  });

  autoUpdater.on('update-available', (info) => {
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

  autoUpdater.on('download-progress', (progressObj) => {
    let message = `下載速度: ${progressObj.bytesPerSecond}`;
    message = `${message} - 已下載 ${progressObj.percent}%`;
    message = `${message} (${progressObj.transferred}/${progressObj.total})`;
    console.info(message);
  });

  autoUpdater.on('update-downloaded', (info) => {
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

async function configureDiscordRPC() {
  try {
    rpc = new DiscordRPC.Client({ transport: 'ipc' });
    await rpc.login({ clientId }).catch(() => {
      console.warn('Discord RPC登錄失敗, 將不會顯示Discord Rich Presence');
      rpc = null;
    });

    if (rpc) {
      rpc.on('ready', () => {
        setActivity(defaultPrecence);
      });
    }
  } catch (error) {
    console.error('Discord RPC初始化失敗:', error);
    rpc = null;
  }
}

const configureUpdateChecker = async () => {
  try {
    if (!isDev) {
      await autoUpdater.checkForUpdates();
      setInterval(updateChecker, 60 * 60 * 1000);
    }
  } catch (error) {
    console.error('定期檢查更新失敗:', error);
  }
};

// 托盤圖標設定
function trayIcon(isGray = true) {
  if (tray) {
    tray.destroy();
  }
  const iconPath = isGray ? 'tray_gray.ico' : 'tray.ico';
  tray = new Tray(
    nativeImage.createFromPath(path.join(__dirname, 'resources', iconPath)),
  );
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

function closePopups() {
  Object.values(popups).forEach((win) => {
    if (win && !win.isDestroyed()) {
      win.close();
    }
  });
  popups = {};
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
      try {
        rpc.destroy();
      } catch (error) {
        console.error('Discord RPC銷毀失敗:', error);
      }
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  // Auth handlers
  ipcMain.on('login', (_, token) => {
    mainWindow.show();
    authWindow.hide();
    console.log(token);
    socketInstance = connectSocket(token);
    socketInstance.connect();
    isLogin = true;
    trayIcon(false);
  });
  ipcMain.on('logout', async () => {
    if (rpc) {
      try {
        await rpc.clearActivity();
      } catch (error) {
        console.error('清除Discord狀態失敗:', error);
      }
    }
    closePopups();
    mainWindow.hide();
    authWindow.show();
    socketInstance.disconnect();
    socketInstance = disconnectSocket(socketInstance);
    isLogin = false;
    trayIcon(true);
  });

  // Initial data request handlers
  ipcMain.on('request-initial-data', (_, to) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('request-initial-data', to);
    });
  });
  ipcMain.on('response-initial-data', (_, from, data) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('response-initial-data', from, data);
    });
  });

  // Popup handlers
  ipcMain.on('open-popup', (event, type, height, width, additionalData) => {
    createPopup(type, height, width, additionalData);
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
    switch (command) {
      case 'minimize':
        window.minimize();
        break;
      case 'maximize':
        if (window.isMaximized()) {
          window.unmaximize();
        } else {
          window.maximize();
        }
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

  // Auto launch handlers
  ipcMain.on('set-auto-launch', (_, enable) => {
    setAutoLaunch(enable);
  });
  ipcMain.on('get-auto-launch', (event) => {
    event.reply('auto-launch-status', isAutoLaunchEnabled());
  });

  // Audio device handlers
  ipcMain.on('set-audio-device', (_, deviceId, type) => {
    if (type === 'input') {
      store.set('audioInputDevice', deviceId);
    } else if (type === 'output') {
      store.set('audioOutputDevice', deviceId);
    }
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('audio-device-status', type, deviceId);
    });
  });
  ipcMain.on('get-audio-device', (event, type) => {
    if (type === 'input') {
      event.reply('audio-device-status', type, store.get('audioInputDevice'));
    } else if (type === 'output') {
      event.reply('audio-device-status', type, store.get('audioOutputDevice'));
    }
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

// 防止多開
if (!app.requestSingleInstanceLock()) {
  app.quit();
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

// macOS 處理 deeplink
app.on('open-url', (event, url) => {
  event.preventDefault();
  console.log('接收到 deeplink (macOS open-url):', url);
  handleDeepLink(url);
});

// 集中處理 DeepLink
async function handleDeepLink(url) {
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
                (server) => server.displayId === serverId,
              );
              if (matchedServer) {
                mainWindow.show();
                mainWindow.focus();
                socketInstance.emit(SocketClientEvent.CONNECT_SERVER, {
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

// 集中處理聚焦視窗
function focusWindow() {
  const window =
    authWindow?.isDestroyed() === false
      ? authWindow
      : mainWindow?.isDestroyed() === false
      ? mainWindow
      : null;
  if (window) {
    if (window.isMinimized()) window.restore();
    window.focus();
  }
}
