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

type PopupType =
  | 'avatarCropper'
  | 'userInfo'
  | 'userSetting'
  | 'channelSetting'
  | 'channelPassword'
  | 'serverSetting'
  | 'serverBroadcast'
  | 'blockMember'
  | 'systemSetting'
  | 'memberApplySetting'
  | 'createServer'
  | 'createChannel'
  | 'createFriendGroup'
  | 'editChannelOrder'
  | 'editChannelName'
  | 'editNickname'
  | 'editFriendGroup'
  | 'editFriend'
  | 'applyMember'
  | 'applyFriend'
  | 'searchUser'
  | 'directMessage'
  | 'dialogAlert'
  | 'dialogAlert2'
  | 'dialogSuccess'
  | 'dialogWarning'
  | 'dialogError'
  | 'dialogInfo'
  | 'changeTheme'
  | 'aboutus'
  | 'friendVerification';

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

const ClientToServerEventNames = [
  'searchUser',
  'editUser',
  'createFriendGroup',
  'editFriendGroup',
  'deleteFriendGroup',
  'createFriend',
  'editFriend',
  'deleteFriend',
  'sendFriendApplication',
  'editFriendApplication',
  'deleteFriendApplication',
  'approveFriendApplication',
  'rejectFriendApplication',
  'favoriteServer',
  'searchServer',
  'connectServer',
  'disconnectServer',
  'kickFromServer',
  'createServer',
  'editServer',
  'deleteServer',
  'connectChannel',
  'moveToChannel',
  'disconnectChannel',
  'kickFormChannel',
  'kickToLobbyChannel',
  'createChannel',
  'editChannel',
  'deleteChannel',
  'createMember',
  'editMember',
  'deleteMember',
  'sendMemberApplication',
  'editMemberApplication',
  'deleteMemberApplication',
  'approveMemberApplication',
  'rejectMemberApplication',
  'sendMemberInvitation',
  'editMemberInvitation',
  'deleteMemberInvitation',
  'acceptMemberInvitation',
  'rejectMemberInvitation',
  'channelMessage',
  'actionMessage',
  'directMessage',
  'shakeWindow',
  'RTCOffer',
  'RTCAnswer',
  'RTCIceCandidate',
  'ping',
];

export const ServerToClientEventNames = [
  'notification', // not used yet
  'userSearch',
  'userUpdate',
  'friendGroupsSet',
  'friendGroupAdd',
  'friendGroupUpdate',
  'friendGroupRemove',
  'friendsSet',
  'friendAdd',
  'friendUpdate',
  'friendRemove',
  'friendApplicationsSet',
  'friendApplicationAdd',
  'friendApplicationUpdate',
  'friendApplicationRemove',
  'serverSearch',
  'serversSet',
  'serverAdd',
  'serverUpdate',
  'serverRemove',
  'serverChannelsSet',
  'serverChannelAdd',
  'serverChannelUpdate',
  'serverChannelRemove',
  'serverMembersSet',
  'serverMemberAdd',
  'serverMemberUpdate',
  'serverMemberRemove',
  'serverOnlineMembersSet',
  'serverOnlineMemberAdd',
  'serverOnlineMemberRemove',
  'serverMemberApplicationsSet',
  'serverMemberApplicationAdd',
  'serverMemberApplicationUpdate',
  'serverMemberApplicationRemove',
  'memberApproval',
  'channelMessage',
  'actionMessage',
  'directMessage',
  'shakeWindow',
  'RTCOffer',
  'RTCAnswer',
  'RTCIceCandidate',
  'RTCJoin',
  'RTCLeave',
  'playSound',
  'pong',
  'openPopup',
];

export const PopupSize: Record<PopupType, { height: number; width: number }> = {
  aboutus: { height: 750, width: 500 },
  applyFriend: { height: 320, width: 500 },
  applyMember: { height: 320, width: 500 },
  avatarCropper: { height: 520, width: 610 },
  blockMember: { height: 250, width: 400 },
  channelSetting: { height: 520, width: 600 },
  channelPassword: { height: 200, width: 370 },
  changeTheme: { height: 340, width: 480 },
  createServer: { height: 436, width: 478 },
  createChannel: { height: 200, width: 370 },
  createFriendGroup: { height: 200, width: 370 },
  directMessage: { height: 550, width: 650 },
  dialogAlert: { height: 200, width: 370 },
  dialogAlert2: { height: 200, width: 370 },
  dialogSuccess: { height: 200, width: 370 },
  dialogWarning: { height: 200, width: 370 },
  dialogError: { height: 200, width: 370 },
  dialogInfo: { height: 200, width: 370 },
  editChannelOrder: { height: 550, width: 500 },
  editChannelName: { height: 200, width: 370 },
  editNickname: { height: 200, width: 370 },
  editFriendGroup: { height: 200, width: 370 },
  editFriend: { height: 200, width: 370 },
  friendVerification: { height: 550, width: 500 },
  memberApplySetting: { height: 250, width: 370 },
  searchUser: { height: 200, width: 370 },
  serverSetting: { height: 520, width: 600 },
  serverBroadcast: { height: 300, width: 450 },
  systemSetting: { height: 520, width: 600 },
  userInfo: { height: 630, width: 440 },
  userSetting: { height: 700, width: 500 },
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
async function createMainWindow(): Promise<BrowserWindow> {
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
    mainWindow.webContents.openDevTools();
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

async function createAuthWindow(): Promise<BrowserWindow> {
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
  const isAlwaysOnTop = store.get('alwaysOnTop') ?? false;
  if (!isAlwaysOnTop) {
    popups[id].setAlwaysOnTop(false);
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
    reconnectionDelay: 1000,
    reconnectionDelayMax: 20000,
    timeout: 10000,
    autoConnect: false,
    query: {
      token: token,
    },
  });

  socket.on('connect', () => {
    for (const event of ClientToServerEventNames) {
      ipcMain.removeAllListeners(event);
    }
    for (const event of ServerToClientEventNames) {
      socket.removeAllListeners(event);
    }

    ClientToServerEventNames.forEach((event) => {
      ipcMain.on(event, (_, ...args) => {
        console.log(`${new Date().toLocaleString()} | socket.emit`, event, ...args);
        socket.emit(event, ...args);
      });
    });

    ServerToClientEventNames.forEach((event) => {
      socket.on(event, (...args) => {
        console.log(`${new Date().toLocaleString()} | socket.on`, event, ...args);
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

  for (const event of ClientToServerEventNames) {
    ipcMain.removeAllListeners(event);
  }
  for (const event of ServerToClientEventNames) {
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
  await rpc?.setActivity(presence).catch((error) => {
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
  rpc?.on('ready', () => {
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
  tray.setToolTip(`RiceCall v${app.getVersion()}`);
  tray.on('click', () => {
    if (isLogin) {
      mainWindow.show();
    } else {
      authWindow.show();
    }
  });
  setTrayIcon(isLogin);
}

app.on('ready', async () => {
  // Configure
  configureAutoUpdater();
  configureDiscordRPC();
  configureTray();

  // if (await checkIsHinet()) websocketUrl = WS_URL;

  if (!store.get('dontShowDisclaimer')) {
    await createPopup('aboutus', 'aboutUs');
    popups['aboutUs'].setAlwaysOnTop(true);
  }

  await createAuthWindow().then((authWindow) => {
    authWindow.show();
  });

  await createMainWindow().then((mainWindow) => {
    mainWindow.hide();
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
      autoLogin: store.get('autoLogin') ?? false,
      autoLaunch: isAutoLaunchEnabled(),
      alwaysOnTop: store.get('alwaysOnTop') ?? false,
      statusAutoIdle: store.get('statusAutoIdle') ?? false,
      statusAutoIdleMinutes: store.get('statusAutoIdleMinutes') || 10,
      statusAutoDnd: store.get('statusAutoDnd') ?? false,
      channelUIMode: store.get('channelUIMode') || 'auto',
      closeToTray: store.get('closeToTray') ?? false,
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
  ipcMain.on('get-auto-login', (event) => {
    event.reply('auto-login', store.get('autoLogin') ?? false);
  });

  ipcMain.on('get-auto-launch', (event) => {
    event.reply('auto-launch', isAutoLaunchEnabled());
  });

  ipcMain.on('get-always-on-top', (event) => {
    event.reply('always-on-top', store.get('alwaysOnTop') ?? false);
  });

  ipcMain.on('get-status-auto-idle', (event) => {
    event.reply('status-auto-idle', store.get('statusAutoIdle') ?? false);
  });

  ipcMain.on('get-status-auto-idle-minutes', (event) => {
    event.reply('status-auto-idle-minutes', store.get('statusAutoIdleMinutes') || 10);
  });

  ipcMain.on('get-status-auto-dnd', (event) => {
    event.reply('status-auto-dnd', store.get('statusAutoDnd') ?? false);
  });

  ipcMain.on('get-channel-ui-mode', (event) => {
    event.reply('channel-ui-mode', store.get('channelUIMode') || 'auto');
  });

  ipcMain.on('get-close-to-tray', (event) => {
    event.reply('close-to-tray', store.get('closeToTray') ?? false);
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
    event.reply('not-save-message-history', store.get('notSaveMessageHistory') ?? true);
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

  // Privacy
  ipcMain.on('get-not-save-message-history', (event) => {
    event.reply('not-save-message-history', store.get('notSaveMessageHistory') ?? true);
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

  ipcMain.on('get-hot-key-toggle-speaker', (event) => {
    event.reply('hot-key-toggle-speaker', store.get('hotKeyToggleSpeaker') || '');
  });

  ipcMain.on('get-hot-key-toggle-microphone', (event) => {
    event.reply('hot-key-toggle-microphone', store.get('hotKeyToggleMicrophone') || '');
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
  ipcMain.on('set-auto-login', (_, enable) => {
    store.set('autoLogin', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('auto-login', enable);
    });
  });

  ipcMain.on('set-auto-launch', (_, enable) => {
    setAutoLaunch(enable);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('auto-launch', enable);
    });
  });

  ipcMain.on('set-always-on-top', (_, enable) => {
    store.set('alwaysOnTop', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.setAlwaysOnTop(enable);
      window.webContents.send('always-on-top', enable);
    });
  });

  ipcMain.on('set-status-auto-idle', (_, enable) => {
    store.set('statusAutoIdle', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('status-auto-idle', enable);
    });
  });

  ipcMain.on('set-status-auto-idle-minutes', (_, value) => {
    store.set('statusAutoIdleMinutes', value || 10);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('status-auto-idle-minutes', value);
    });
  });

  ipcMain.on('set-status-auto-dnd', (_, enable) => {
    store.set('statusAutoDnd', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('status-auto-dnd', enable);
    });
  });

  ipcMain.on('set-channel-ui-mode', (_, mode) => {
    store.set('channel-ui-mode', mode || 'auto');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('channel-ui-mode', mode);
    });
  });

  ipcMain.on('set-close-to-tray', (_, enable) => {
    store.set('closeToTray', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('close-to-tray', enable);
    });
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

  ipcMain.on('set-mix-effect', (_, enable) => {
    store.set('mixEffect', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('mix-effect', enable);
    });
  });

  ipcMain.on('set-mix-effect-type', (_, type) => {
    store.set('mixEffectType', type || '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('mix-effect-type', type);
    });
  });

  ipcMain.on('set-auto-mix-setting', (_, enable) => {
    store.set('autoMixSetting', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('auto-mix-setting', enable);
    });
  });

  ipcMain.on('set-echo-cancellation', (_, enable) => {
    store.set('echoCancellation', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('echo-cancellation', enable);
    });
  });

  ipcMain.on('set-noise-cancellation', (_, enable) => {
    store.set('noiseCancellation', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('noise-cancellation', enable);
    });
  });

  ipcMain.on('set-microphone-amplification', (_, enable) => {
    store.set('microphoneAmplification', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('microphone-amplification', enable);
    });
  });

  ipcMain.on('set-manual-mix-mode', (_, enable) => {
    store.set('manualMixMode', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('manual-mix-mode', enable);
    });
  });

  ipcMain.on('set-mix-mode', (_, mode) => {
    store.set('mixMode', mode || 'all');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('mix-mode', mode);
    });
  });

  // Voice
  ipcMain.on('set-speaking-mode', (_, mode) => {
    store.set('speakingMode', mode || 'key');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('speaking-mode', mode);
    });
  });

  ipcMain.on('set-default-speaking-key', (_, key) => {
    store.set('defaultSpeakingKey', key || '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('default-speaking-key', key);
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

app.on('before-quit', () => {
  rpc?.destroy().catch((error) => {
    console.error('Cannot destroy Discord RPC:', error);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createAuthWindow().then((authWindow) => {
      authWindow.show();
    });

    await createMainWindow().then((mainWindow) => {
      mainWindow.hide();
    });
  }
});

app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
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
