/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import net from 'net';
import path from 'path';
import fontList from 'font-list';
import { io, Socket } from 'socket.io-client';
import DiscordRPC from 'discord-rpc';
import serve from 'electron-serve';
import Store from 'electron-store';
import ElectronUpdater, { ProgressInfo, UpdateInfo } from 'electron-updater';
const { autoUpdater } = ElectronUpdater;
import { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu, nativeImage } from 'electron';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { z } from 'zod';

const EnvSchema = z
  .object({
    API_URL: z.string(),
    WS_URL: z.string(),
    CROWDIN_DISTRIBUTION_HASH: z.string(),
    UPDATE_CHANNEL: z.enum(['latest', 'dev']).default('latest'),
  })
  .partial();

export type PublicConfig = Record<string, string>;

dotenv.config();

let tray: Tray | null = null;
let isLogin: boolean = false;

// Store
const store = new Store<Record<string, any>>();

// Event
const ClientToServerEventWithAckNames = ['SFUCreateTransport', 'SFUConnectTransport', 'SFUCreateProducer', 'SFUCreateConsumer', 'SFUJoin', 'SFULeave'];

const ClientToServerEventNames = [
  'acceptMemberInvitation',
  'actionMessage',
  'addUserToQueue',
  'approveFriendApplication',
  'approveMemberApplication',
  'blockUser',
  'blockUserFromChannel',
  'blockUserFromServer',
  'channelMessage',
  'clearQueue',
  'connectChannel',
  'connectServer',
  'controlQueue',
  'createChannel',
  'createFriendGroup',
  'createServer',
  'deleteChannel',
  'deleteFriend',
  'deleteFriendApplication',
  'deleteFriendGroup',
  'deleteMemberApplication',
  'deleteMemberInvitation',
  'deleteServer',
  'directMessage',
  'disconnectChannel',
  'disconnectServer',
  'editChannel',
  'editChannelPermission',
  'editFriend',
  'editFriendApplication',
  'editFriendGroup',
  'editMember',
  'editMemberApplication',
  'editMemberInvitation',
  'editServer',
  'editServerPermission',
  'editUser',
  'favoriteServer',
  'increaseUserQueueTime',
  'joinQueue',
  'leaveQueue',
  'moveUserQueuePosition',
  'moveUserToChannel',
  'muteUserInChannel',
  'ping',
  'rejectFriendApplication',
  'rejectMemberApplication',
  'rejectMemberInvitation',
  'removeUserFromQueue',
  'searchServer',
  'searchUser',
  'sendFriendApplication',
  'sendMemberApplication',
  'sendMemberInvitation',
  'shakeWindow',
  'stranger',
  'terminateMember',
  'unblockUser',
  'unblockUserFromChannel',
  'unblockUserFromServer',
];

export const ServerToClientEventNames = [
  'actionMessage',
  'channelMessage',
  'directMessage',
  'friendAdd',
  'friendApplicationAdd',
  'friendApplicationRemove',
  'friendApplicationUpdate',
  'friendApplicationsSet',
  'friendGroupAdd',
  'friendGroupRemove',
  'friendGroupUpdate',
  'friendGroupsSet',
  'friendRemove',
  'friendUpdate',
  'friendsSet',
  'memberInvitationAdd',
  'memberInvitationRemove',
  'memberInvitationUpdate',
  'notification', // not used yet
  'openPopup',
  'playSound',
  'pong',
  'queueMembersSet',
  'serverAdd',
  'serverChannelAdd',
  'serverChannelRemove',
  'serverChannelUpdate',
  'serverChannelsSet',
  'serverMemberAdd',
  'serverMemberApplicationAdd',
  'serverMemberApplicationRemove',
  'serverMemberApplicationUpdate',
  'serverMemberApplicationsSet',
  'serverMemberRemove',
  'serverMemberUpdate',
  'serverMembersSet',
  'serverOnlineMemberAdd',
  'serverOnlineMemberRemove',
  'serverOnlineMemberUpdate',
  'serverOnlineMembersSet',
  'serverRemove',
  'serverSearch',
  'serverUpdate',
  'serversSet',
  'SFUJoined',
  'SFULeft',
  'SFUNewProducer',
  'SFUProducerClosed',
  'shakeWindow',
  'userSearch',
  'userUpdate',
];

// Popup
type PopupType =
  | 'aboutus'
  | 'applyFriend'
  | 'approveFriend'
  | 'applyMember'
  | 'blockMember'
  | 'changeTheme'
  | 'channelPassword'
  | 'channelSetting'
  | 'createChannel'
  | 'createFriendGroup'
  | 'createServer'
  | 'dialogAlert'
  | 'dialogAlert2'
  | 'dialogError'
  | 'dialogInfo'
  | 'dialogSuccess'
  | 'dialogWarning'
  | 'directMessage'
  | 'editChannelName'
  | 'editChannelOrder'
  | 'editFriendNote'
  | 'editFriendGroupName'
  | 'editNickname'
  | 'friendVerification'
  | 'imageCropper'
  | 'inviteMember'
  | 'memberApplicationSetting'
  | 'memberInvitation'
  | 'searchUser'
  | 'serverBroadcast'
  | 'serverSetting'
  | 'systemSetting'
  | 'userInfo'
  | 'userSetting';

export const PopupSize: Record<PopupType, { height: number; width: number }> = {
  aboutus: { height: 750, width: 500 },
  applyFriend: { height: 375, width: 490 },
  approveFriend: { height: 250, width: 400 },
  applyMember: { height: 300, width: 490 },
  blockMember: { height: 250, width: 400 },
  channelSetting: { height: 520, width: 600 },
  channelPassword: { height: 200, width: 380 },
  changeTheme: { height: 340, width: 480 },
  createServer: { height: 436, width: 478 },
  createChannel: { height: 200, width: 380 },
  createFriendGroup: { height: 200, width: 380 },
  directMessage: { height: 550, width: 650 },
  dialogAlert: { height: 200, width: 380 },
  dialogAlert2: { height: 200, width: 380 },
  dialogSuccess: { height: 200, width: 380 },
  dialogWarning: { height: 200, width: 380 },
  dialogError: { height: 200, width: 380 },
  dialogInfo: { height: 200, width: 380 },
  editChannelOrder: { height: 550, width: 500 },
  editChannelName: { height: 200, width: 380 },
  editNickname: { height: 200, width: 380 },
  editFriendNote: { height: 200, width: 380 },
  editFriendGroupName: { height: 200, width: 380 },
  friendVerification: { height: 550, width: 500 },
  imageCropper: { height: 520, width: 610 },
  inviteMember: { height: 300, width: 490 },
  memberApplicationSetting: { height: 220, width: 380 },
  memberInvitation: { height: 550, width: 500 },
  searchUser: { height: 200, width: 380 },
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

// Env
let env: Record<string, string> = {};

// Windows
let mainWindow: BrowserWindow | null = null;
let authWindow: BrowserWindow | null = null;
let popups: Record<string, BrowserWindow> = {};

// Socket
let socketInstance: Socket | null = null;

// Discord RPC
let rpc: DiscordRPC.Client | null = null;
const startTimestamp = Date.now();

const appServe = serve({ directory: path.join(app.getAppPath(), 'out') });

function readEnvFile(file: string, base: Record<string, string>) {
  if (!fs.existsSync(file)) return base;

  const cfg = dotenv.config({ path: file, processEnv: base, override: true });
  expand(cfg);

  return { ...base, ...(cfg.parsed ?? {}) };
}

export function loadEnv() {
  // 1) Using process.env as base (can be overridden by system env)
  let env: Record<string, string> = { ...process.env } as any;

  // 2) Read files by context (from low to high, higher will override)
  const files: string[] = [];
  if (app.isPackaged) {
    files.push(path.join(process.resourcesPath, 'app.env')); // default for packaged
    files.push(path.join(app.getPath('userData'), 'app.env')); // user override
  } else {
    const root = process.cwd();
    files.push(path.join(root, '.env')); // default for dev
    // files.push(path.join(root, '.env.local')); // dev override
  }
  for (const file of files) env = readEnvFile(file, env);

  // 3) Validate (optional: warn if missing values)
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    console.warn(`${new Date().toLocaleString()} | [env] invalid values:`, parsed.error.flatten().fieldErrors);
  } else {
    Object.assign(env, parsed.data);
  }

  // 4) Fill process.env (for main process/sub process)
  for (const [k, v] of Object.entries(env)) process.env[k] = String(v);

  return { env, filesLoaded: files.filter(fs.existsSync) };
}

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
  const window = authWindow && authWindow.isDestroyed() === false ? authWindow : mainWindow && mainWindow.isDestroyed() === false ? mainWindow : null;
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
    fullscreenable: true,
    hasShadow: true,
    icon: APP_ICON,
    webPreferences: {
      webviewTag: true,
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
    },
    trafficLightPosition: { x: -100, y: -100 },
  });

  if (app.isPackaged || !DEV) {
    appServe(mainWindow).then(() => {
      mainWindow?.loadURL(`${BASE_URI}`);
    });
  } else {
    mainWindow.loadURL(`${BASE_URI}`);
    // mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow?.hide();
  });

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('maximize');
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('unmaximize');
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send(mainWindow?.isMaximized() ? 'maximize' : 'unmaximize');
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

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
    fullscreenable: false,
    hasShadow: true,
    icon: APP_ICON,
    webPreferences: {
      webviewTag: true,
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
    },
    trafficLightPosition: { x: -100, y: -100 },
  });

  if (app.isPackaged || !DEV) {
    appServe(authWindow).then(() => {
      authWindow?.loadURL(`${BASE_URI}/auth.html`);
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

  return authWindow;
}

async function createPopup(type: PopupType, id: string, data: unknown, force = true): Promise<BrowserWindow> {
  // If force is true, destroy the popup
  if (force) {
    if (popups[id] && !popups[id].isDestroyed()) {
      popups[id].destroy();
    }
  } else {
    if (popups[id] && !popups[id].isDestroyed()) {
      if (mainWindow && mainWindow.isFocusable()) {
        mainWindow.focus();
      }
      popups[id].show();
      popups[id].focus();
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
    fullscreenable: false,
    hasShadow: true,
    icon: APP_ICON,
    webPreferences: {
      webviewTag: true,
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
    },
    modal: true,
    trafficLightPosition: { x: -100, y: -100 },
  });

  if (app.isPackaged || !DEV) {
    appServe(popups[id]).then(() => {
      popups[id].loadURL(`${BASE_URI}/popup.html?type=${type}&id=${id}`);
    });
  } else {
    popups[id].loadURL(`${BASE_URI}/popup?type=${type}&id=${id}`);
    // popups[id].webContents.openDevTools();
  }

  ipcMain.removeAllListeners(`get-initial-data?id=${id}`);
  ipcMain.on(`get-initial-data?id=${id}`, (event) => {
    event.returnValue = data;
  });

  popups[id].on('close', (e) => {
    e.preventDefault();
    popups[id].destroy();
    delete popups[id];
  });

  popups[id].webContents.once('did-finish-load', () => {
    if (mainWindow && mainWindow.isFocusable()) {
      mainWindow.focus();
    }
    popups[id].show();
    popups[id].focus();
  });

  popups[id].webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return popups[id];
}

// Socket Functions
function connectSocket(token: string): Socket | null {
  if (!token) return null;

  console.log(`${new Date().toLocaleString()} | Connecting socket, URL: ${env.WS_URL}, token: ${token}`);

  if (socketInstance) {
    socketInstance = disconnectSocket();
  }

  const socket = io(env.WS_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 20000,
    timeout: 10000,
    autoConnect: false,
    query: { token: token },
  });

  socket.on('connect', () => {
    for (const event of ClientToServerEventNames) {
      ipcMain.removeAllListeners(event);
    }
    for (const event of ServerToClientEventNames) {
      socket.removeAllListeners(event);
    }

    // Register event listeners
    ClientToServerEventWithAckNames.forEach((event) => {
      ipcMain.handle(event, (_, payload) => {
        console.log(`${new Date().toLocaleString()} | socket.emit`, event, payload);
        return new Promise((resolve) => {
          socket.emit(event, payload, (ack: { ok: true; data: unknown } | { ok: false; error: string }) => {
            console.log(`${new Date().toLocaleString()} | socket.onAck`, event, ack);
            resolve(ack);
          });
        });
      });
    });
    ClientToServerEventNames.forEach((event) => {
      ipcMain.on(event, (_, ...args) => {
        console.log(`${new Date().toLocaleString()} | socket.emit`, event, ...args);
        socket.emit(event, ...args);
      });
    });
    ServerToClientEventNames.forEach((event) => {
      socket.on(event, async (...args) => {
        console.log(`${new Date().toLocaleString()} | socket.on`, event, ...args);
        BrowserWindow.getAllWindows().forEach((window) => {
          window.webContents.send(event, ...args);
        });
        // Handle special events
        if (event === 'shakeWindow') {
          const initialData = args[0].initialData;
          createPopup('directMessage', `directMessage-${initialData.targetId}`, { ...initialData, event, message: args[0] }, false);
        }
        if (event === 'directMessage') {
          const initialData = args[0].initialData;
          createPopup('directMessage', `directMessage-${initialData.targetId}`, { ...initialData, event, message: args[0] }, false);
        }
      });
    });

    console.info(`${new Date().toLocaleString()} | Socket connected`);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('connect', null);
    });
  });

  socket.on('disconnect', (reason) => {
    // Clean up event listeners
    for (const event of ClientToServerEventWithAckNames) {
      ipcMain.removeHandler(event);
    }
    for (const event of ClientToServerEventNames) {
      ipcMain.removeAllListeners(event);
    }
    for (const event of ServerToClientEventNames) {
      socket.removeAllListeners(event);
    }

    console.info(`${new Date().toLocaleString()} | Socket disconnected, reason:`, reason);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('disconnect', reason);
    });
  });

  socket.on('reconnect', (attemptNumber) => {
    console.info(`${new Date().toLocaleString()} | Socket reconnected, attempt number:`, attemptNumber);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('reconnect', attemptNumber);
    });
  });

  socket.on('error', (error) => {
    console.error(`${new Date().toLocaleString()} | Socket error:`, error.message);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('error', error);
    });
  });

  socket.on('connect_error', (error) => {
    console.error(`${new Date().toLocaleString()} | Socket connect error:`, error.message);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('connect_error', error);
    });
  });

  socket.on('reconnect_error', (error) => {
    console.error(`${new Date().toLocaleString()} | Socket reconnect error:`, error.message);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('reconnect_error', error);
    });
  });

  socket.on('close', () => {
    console.info(`${new Date().toLocaleString()} | Socket closed`);
    socketInstance = disconnectSocket();
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
function configureAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;

  // Dev channel // TODO: Remove this before release
  autoUpdater.allowPrerelease = true;
  autoUpdater.channel = env.UPDATE_CHANNEL ?? 'latest';
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'NerdyHomeReOpen',
    repo: 'RiceCall',
    channel: env.UPDATE_CHANNEL ?? 'latest',
  });

  if (DEV) {
    autoUpdater.forceDevUpdateConfig = true;
    autoUpdater.updateConfigPath = path.join(app.getAppPath(), 'dev-app-update.yml');
  }

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    dialog
      .showMessageBox({
        type: 'info',
        title: '有新版本可用',
        message: `新版本 ${info.version} 發布於 ${new Date(info.releaseDate).toLocaleDateString()}，正在開始下載...`,
      })
      .catch((error) => {
        console.error(`${new Date().toLocaleString()} | Cannot show update dialog:`, error.message);
      });
  });

  autoUpdater.on('update-not-available', () => {
    if (DEV) return;
    console.info(`${new Date().toLocaleString()} | Is latest version`);
  });

  autoUpdater.on('download-progress', (progressInfo: ProgressInfo) => {
    if (DEV) return;
    let message = `${progressInfo.bytesPerSecond}`;
    message = `${message} - ${progressInfo.percent}%`;
    message = `${message} (${progressInfo.transferred}/${progressInfo.total})`;
    console.info(`${new Date().toLocaleString()} | Downloading update: ${message}`);
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    if (DEV) return;
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
      })
      .catch((error) => {
        console.error(`${new Date().toLocaleString()} | Cannot show update dialog:`, error.message);
      });
  });

  function checkUpdate() {
    if (DEV) return;
    console.log(`${new Date().toLocaleString()} | Checking for updates, channel:`, env.UPDATE_CHANNEL);
    autoUpdater.checkForUpdates().catch((error) => {
      console.error(`${new Date().toLocaleString()} | Cannot check for updates:`, error.message);
    });
  }

  // Check update every hour
  setInterval(checkUpdate, 60 * 60 * 1000);
  checkUpdate();
}

// Discord RPC
async function configureDiscordRPC() {
  DiscordRPC.register(DISCORD_RPC_CLIENT_ID);
  rpc = new DiscordRPC.Client({ transport: 'ipc' });
  rpc = await rpc.login({ clientId: DISCORD_RPC_CLIENT_ID }).catch((error) => {
    console.error(`${new Date().toLocaleString()} | Cannot login to discord rpc:`, error.message);
    return null;
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
        if (isLogin) mainWindow?.show();
        else authWindow?.show();
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
    if (isLogin) mainWindow?.show();
    else authWindow?.show();
  });
  setTrayIcon(isLogin);
}

app.on('ready', async () => {
  env = loadEnv().env;

  // Configure
  configureAutoUpdater();
  configureDiscordRPC();
  configureTray();

  if (!store.get('dontShowDisclaimer')) {
    createPopup('aboutus', 'aboutUs', {});
  }
  createAuthWindow().then((authWindow) => authWindow.show());
  createMainWindow().then((mainWindow) => mainWindow.hide());

  ipcMain.on('exit', () => {
    app.exit();
  });

  // Accounts handlers
  ipcMain.on('get-accounts', (event) => {
    event.returnValue = store.get('accounts') ?? {};
  });

  ipcMain.on('add-account', (_, account: string, data: { autoLogin: boolean; rememberAccount: boolean; password: string }) => {
    const accounts = store.get('accounts') ?? {};
    accounts[account] = data;
    store.set('accounts', accounts);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('accounts', accounts);
    });
  });

  ipcMain.on('delete-account', (_, account: string) => {
    const accounts = store.get('accounts') ?? {};
    delete accounts[account];
    store.set('accounts', accounts);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('accounts', accounts);
    });
  });

  // Auth handlers
  ipcMain.on('login', (_, token) => {
    mainWindow?.show();
    authWindow?.hide();
    socketInstance = connectSocket(token);
    isLogin = true;
    setTrayIcon(isLogin);
  });

  ipcMain.on('logout', () => {
    rpc?.clearActivity().catch((error) => {
      console.error(`${new Date().toLocaleString()} | Cannot clear activity:`, error);
    });
    closePopups();
    mainWindow?.hide();
    authWindow?.show();
    socketInstance = disconnectSocket();
    isLogin = false;
    setTrayIcon(isLogin);
  });

  // Language handlers
  ipcMain.on('get-language', (event) => {
    event.returnValue = store.get('language') || 'zh-TW';
  });

  ipcMain.on('set-language', (_, language) => {
    store.set('language', language);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('language', language);
    });
  });

  // Custom themes handlers
  ipcMain.on('get-custom-themes', (event) => {
    const customThemes = store.get('customThemes') || [];
    event.returnValue = Array.from({ length: 7 }, (_, i) => customThemes[i] ?? {});
  });

  ipcMain.on('add-custom-theme', (_, theme) => {
    const customThemes = store.get('customThemes') || [];
    // Keep total 7 themes
    customThemes.unshift(theme);
    store.set('customThemes', customThemes);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send(
        'custom-themes',
        Array.from({ length: 7 }, (_, i) => customThemes[i] ?? {}),
      );
    });
  });

  ipcMain.on('delete-custom-theme', (_, index) => {
    const customThemes = store.get('customThemes') || [];
    // Keep total 7 themes
    customThemes.splice(index, 1);
    store.set('customThemes', customThemes);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send(
        'custom-themes',
        Array.from({ length: 7 }, (_, i) => customThemes[i] ?? {}),
      );
    });
  });

  ipcMain.on('get-current-theme', (event) => {
    event.returnValue = store.get('currentTheme') || null;
  });

  ipcMain.on('set-current-theme', (_, theme) => {
    store.set('currentTheme', theme);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('current-theme', theme);
    });
  });

  // Popup handlers
  ipcMain.on('open-popup', (_, type, id, data, force = true) => {
    createPopup(type, id, data, force).then((popup) => popup.show());
  });

  ipcMain.on('close-popup', (_, id) => {
    if (popups[id] && !popups[id].isDestroyed()) {
      popups[id].close();
    }
  });

  ipcMain.on('close-all-popups', () => {
    closePopups();
  });

  ipcMain.on('popup-submit', (_, to, data?: unknown) => {
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
        if (process.platform === 'darwin') {
          window.setFullScreen(true);
        } else {
          window.maximize();
        }
        break;
      case 'unmaximize':
        if (process.platform === 'darwin') {
          window.setFullScreen(false);
        } else {
          window.unmaximize();
        }
        break;
      case 'close':
        window.close();
        break;
    }
  });

  // Discord RPC handlers
  ipcMain.on('update-discord-presence', (_, updatePresence) => {
    updatePresence.startTimestamp = startTimestamp;
    rpc?.setActivity(updatePresence).catch((error) => {
      console.error(`${new Date().toLocaleString()} | Cannot update discord presence:`, error.message);
    });
  });

  // Env
  ipcMain.on('get-env', (event) => {
    event.returnValue = env;
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
      channelUIMode: store.get('channelUIMode') || 'classic',
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
      defaultSpeakingKey: store.get('defaultSpeakingKey') || 'v',
      // Privacy settings
      notSaveMessageHistory: store.get('notSaveMessageHistory') ?? true,
      // Hotkeys Settings
      hotKeyOpenMainWindow: store.get('hotKeyOpenMainWindow') || 'F1',
      hotKeyScreenshot: store.get('hotKeyScreenshot') || '',
      hotKeyIncreaseVolume: store.get('hotKeyIncreaseVolume') || 'Ctrl+m',
      hotKeyDecreaseVolume: store.get('hotKeyDecreaseVolume') || 'Shift+m',
      hotKeyToggleSpeaker: store.get('hotKeyToggleSpeaker') || 'Alt+m',
      hotKeyToggleMicrophone: store.get('hotKeyToggleMicrophone') || 'Alt+v',
      // SoundEffect settings
      disableAllSoundEffect: store.get('disableAllSoundEffect') ?? false,
      enterVoiceChannelSound: store.get('enterVoiceChannelSound') ?? true,
      leaveVoiceChannelSound: store.get('leaveVoiceChannelSound') ?? true,
      startSpeakingSound: store.get('startSpeakingSound') ?? true,
      stopSpeakingSound: store.get('stopSpeakingSound') ?? true,
      receiveDirectMessageSound: store.get('receiveDirectMessageSound') ?? true,
      receiveChannelMessageSound: store.get('receiveChannelMessageSound') ?? true,
    };
    event.returnValue = settings;
  });

  // Basic
  ipcMain.on('get-auto-login', (event) => {
    event.returnValue = store.get('autoLogin') ?? false;
  });

  ipcMain.on('get-auto-launch', (event) => {
    event.returnValue = isAutoLaunchEnabled();
  });

  ipcMain.on('get-always-on-top', (event) => {
    event.returnValue = store.get('alwaysOnTop') ?? false;
  });

  ipcMain.on('get-status-auto-idle', (event) => {
    event.returnValue = store.get('statusAutoIdle') ?? false;
  });

  ipcMain.on('get-status-auto-idle-minutes', (event) => {
    event.returnValue = store.get('statusAutoIdleMinutes') || 10;
  });

  ipcMain.on('get-status-auto-dnd', (event) => {
    event.returnValue = store.get('statusAutoDnd') ?? false;
  });

  ipcMain.on('get-channel-ui-mode', (event) => {
    event.returnValue = store.get('channelUIMode') || 'classic';
  });

  ipcMain.on('get-close-to-tray', (event) => {
    event.returnValue = store.get('closeToTray') ?? false;
  });

  ipcMain.on('get-font', (event) => {
    event.returnValue = store.get('font') || 'Arial';
  });

  ipcMain.on('get-font-size', (event) => {
    event.returnValue = store.get('fontSize') || 13;
  });

  ipcMain.on('get-font-list', async (event) => {
    const fonts = await fontList.getFonts();
    event.returnValue = fonts;
  });

  // Mix
  ipcMain.on('get-input-audio-device', (event) => {
    event.returnValue = store.get('audioInputDevice') || '';
  });

  ipcMain.on('get-output-audio-device', (event) => {
    event.returnValue = store.get('audioOutputDevice') || '';
  });

  ipcMain.on('get-mix-effect', (event) => {
    event.returnValue = store.get('mixEffect') ?? false;
  });

  ipcMain.on('get-mix-effect-type', (event) => {
    event.returnValue = store.get('mixEffectType') || '';
  });

  ipcMain.on('get-auto-mix-setting', (event) => {
    event.returnValue = store.get('autoMixSetting') ?? false;
  });

  ipcMain.on('get-echo-cancellation', (event) => {
    event.returnValue = store.get('echoCancellation') ?? false;
  });

  ipcMain.on('get-noise-cancellation', (event) => {
    event.returnValue = store.get('noiseCancellation') ?? false;
  });

  ipcMain.on('get-microphone-amplification', (event) => {
    event.returnValue = store.get('microphoneAmplification') ?? false;
  });

  ipcMain.on('get-manual-mix-mode', (event) => {
    event.returnValue = store.get('manualMixMode') ?? false;
  });

  ipcMain.on('get-mix-mode', (event) => {
    event.returnValue = store.get('mixMode') || 'all';
  });

  // Voice
  ipcMain.on('get-speaking-mode', (event) => {
    event.returnValue = store.get('speakingMode') || 'key';
  });

  ipcMain.on('get-default-speaking-key', (event) => {
    event.returnValue = store.get('defaultSpeakingKey') || 'v';
  });

  // Privacy
  ipcMain.on('get-not-save-message-history', (event) => {
    event.returnValue = store.get('notSaveMessageHistory') ?? true;
  });

  // HotKey
  ipcMain.on('get-hot-key-open-main-window', (event) => {
    event.returnValue = store.get('hotKeyOpenMainWindow') || 'F1';
  });

  ipcMain.on('get-hot-key-increase-volume', (event) => {
    event.returnValue = store.get('hotKeyIncreaseVolume') || 'Ctrl+m';
  });

  ipcMain.on('get-hot-key-decrease-volume', (event) => {
    event.returnValue = store.get('hotKeyDecreaseVolume') || 'Shift+m';
  });

  ipcMain.on('get-hot-key-toggle-speaker', (event) => {
    event.returnValue = store.get('hotKeyToggleSpeaker') || 'Alt+m';
  });

  ipcMain.on('get-hot-key-toggle-microphone', (event) => {
    event.returnValue = store.get('hotKeyToggleMicrophone') || 'Alt+v';
  });

  // SoundEffect
  ipcMain.on('get-disable-all-sound-effect', (event) => {
    event.returnValue = store.get('disableAllSoundEffect') ?? false;
  });

  ipcMain.on('get-enter-voice-channel-sound', (event) => {
    event.returnValue = store.get('enterVoiceChannelSound') ?? true;
  });

  ipcMain.on('get-leave-voice-channel-sound', (event) => {
    event.returnValue = store.get('leaveVoiceChannelSound') ?? true;
  });

  ipcMain.on('get-start-speaking-sound', (event) => {
    event.returnValue = store.get('startSpeakingSound') ?? true;
  });

  ipcMain.on('get-stop-speaking-sound', (event) => {
    event.returnValue = store.get('stopSpeakingSound') ?? true;
  });

  ipcMain.on('get-receive-direct-message-sound', (event) => {
    event.returnValue = store.get('receiveDirectMessageSound') ?? true;
  });

  ipcMain.on('get-receive-channel-message-sound', (event) => {
    event.returnValue = store.get('receiveChannelMessageSound') ?? true;
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
    store.set('channelUIMode', mode || 'classic');
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
    store.set('defaultSpeakingKey', key || 'v');
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
    store.set('hotKeyOpenMainWindow', key || 'F1');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-open-main-window', key);
    });
  });

  ipcMain.on('set-hot-key-increase-volume', (_, key) => {
    store.set('hotKeyIncreaseVolume', key || 'Ctrl+m');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-increase-volume', key);
    });
  });

  ipcMain.on('set-hot-key-decrease-volume', (_, key) => {
    store.set('hotKeyDecreaseVolume', key || 'Shift+m');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-decrease-volume', key);
    });
  });

  ipcMain.on('set-hot-key-toggle-speaker', (_, key) => {
    store.set('hotKeyToggleSpeaker', key || 'Alt+m');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-toggle-speaker', key);
    });
  });

  ipcMain.on('set-hot-key-toggle-microphone', (_, key) => {
    store.set('hotKeyToggleMicrophone', key || 'Alt+v');
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

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createAuthWindow().then((authWindow) => authWindow.show());
    createMainWindow().then((mainWindow) => mainWindow.hide());
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
  if (hasDeepLink) app.quit();
} else {
  app.on('second-instance', (_, argv) => {
    const url = argv.find((arg) => arg.startsWith('ricecall://'));
    if (url) handleDeepLink(url);
    else focusWindow();
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
    console.error(`${new Date().toLocaleString()} | Error parsing deep link:`, error);
  }
}
