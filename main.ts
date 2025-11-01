/* eslint-disable @typescript-eslint/no-explicit-any */
import net from 'net';
import path from 'path';
import fontList from 'font-list';
import dotenv from 'dotenv';
dotenv.config();
import serve from 'electron-serve';
import Store from 'electron-store';
import { initMain } from 'electron-audio-loopback-josh';
initMain();
import ElectronUpdater, { ProgressInfo, UpdateInfo } from 'electron-updater';
const { autoUpdater } = ElectronUpdater;
import { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu, nativeImage } from 'electron';
import { initMainI18n, t } from './i18n.js';
import { connectSocket, disconnectSocket, latency } from './socket.js';
import { env, loadEnv } from './env.js';
import { clearDiscordPresence, configureDiscordRPC, updateDiscordPresence } from './discord.js';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('--no-sandbox');
}

// Store
type StoreType = {
  accounts: Record<string, any>;
  language: string;
  customThemes: Record<string, any>[];
  currentTheme: string;
  autoLogin: boolean;
  autoLaunch: boolean;
  alwaysOnTop: boolean;
  closeToTray: boolean;
  statusAutoIdle: boolean;
  statusAutoIdleMinutes: number;
  statusAutoDnd: boolean;
  channelUIMode: string;
  dontShowDisclaimer: boolean;
  font: string;
  fontSize: number;
  inputAudioDevice: string;
  outputAudioDevice: string;
  mixEffect: boolean;
  mixEffectType: string;
  autoMixSetting: boolean;
  echoCancellation: boolean;
  noiseCancellation: boolean;
  microphoneAmplification: boolean;
  manualMixMode: boolean;
  mixMode: string;
  speakingMode: string;
  defaultSpeakingKey: string;
  notSaveMessageHistory: boolean;
  hotKeyOpenMainWindow: string;
  hotKeyScreenshot: string;
  hotKeyIncreaseVolume: string;
  hotKeyDecreaseVolume: string;
  hotKeyToggleSpeaker: string;
  hotKeyToggleMicrophone: string;
  disableAllSoundEffect: boolean;
  enterVoiceChannelSound: boolean;
  leaveVoiceChannelSound: boolean;
  startSpeakingSound: boolean;
  stopSpeakingSound: boolean;
  receiveDirectMessageSound: boolean;
  receiveChannelMessageSound: boolean;
};

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

const store = new Store<StoreType>({
  defaults: {
    // Accounts
    accounts: {},
    // Language
    language: 'zh-TW',
    // Custom Themes
    customThemes: [],
    currentTheme: '',
    // Basic settings
    autoLogin: false,
    autoLaunch: false,
    alwaysOnTop: false,
    closeToTray: false,
    statusAutoIdle: false,
    statusAutoIdleMinutes: 10,
    statusAutoDnd: false,
    channelUIMode: 'classic',
    dontShowDisclaimer: false,
    font: '',
    fontSize: 13,
    // Mix settings
    inputAudioDevice: '',
    outputAudioDevice: '',
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
  },
});

const PopupSize: Record<PopupType, { height: number; width: number }> = {
  aboutus: { height: 750, width: 500 },
  applyFriend: { height: 375, width: 490 },
  approveFriend: { height: 250, width: 400 },
  applyMember: { height: 300, width: 490 },
  blockMember: { height: 250, width: 400 },
  channelSetting: { height: 520, width: 600 },
  channelPassword: { height: 200, width: 380 },
  changeTheme: { height: 335, width: 480 },
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
export const START_TIMESTAMP = Date.now();
export const MAIN_TITLE = 'RiceCall';
export const VERSION_TITLE = `RiceCall v${app.getVersion()}`;
export const DEV = process.argv.includes('--dev');
export const PORT = 3000;
export const BASE_URI = DEV ? `http://localhost:${PORT}` : 'app://-';
export const APP_ICON = process.platform === 'win32' ? path.join(app.getAppPath(), 'resources', 'icon.ico') : path.join(app.getAppPath(), 'resources', 'icon.png');
export const APP_TRAY_ICON = {
  gray: process.platform === 'win32' ? path.join(app.getAppPath(), 'resources', 'tray_gray.ico') : path.join(app.getAppPath(), 'resources', 'tray_gray.png'),
  normal: process.platform === 'win32' ? path.join(app.getAppPath(), 'resources', 'tray.ico') : path.join(app.getAppPath(), 'resources', 'tray.png'),
};

// Variables
let token: string = '';
let isLogin: boolean = false;
let isUpdateNotified: boolean = false;

const appServe = serve({ directory: path.join(app.getAppPath(), 'out') });

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

// Store Functions
function setAutoLaunch(enable: boolean) {
  try {
    app.setLoginItemSettings({
      openAtLogin: enable,
      openAsHidden: false,
    });
  } catch (error) {
    console.error(`${new Date().toLocaleString()} | Set auto launch error:`, error);
  }
}

function isAutoLaunchEnabled(): boolean {
  try {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  } catch (error) {
    console.error(`${new Date().toLocaleString()} | Get auto launch error:`, error);
    return false;
  }
}

// Windows
let mainWindow: BrowserWindow | null = null;
let authWindow: BrowserWindow | null = null;
let popups: Record<string, BrowserWindow> = {};

export async function createMainWindow(title?: string): Promise<BrowserWindow> {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.showInactive();
    mainWindow.setAlwaysOnTop(true);
    mainWindow.flashFrame(true);
    return mainWindow;
  }

  if (DEV) {
    waitForPort(PORT).catch((err) => {
      console.error(`${new Date().toLocaleString()} | Cannot connect to Next.js server:`, err);
      app.exit();
    });
  }

  mainWindow = new BrowserWindow({
    title: title || VERSION_TITLE,
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
    show: false,
    webPreferences: {
      devTools: DEV,
      webviewTag: true,
      webSecurity: false,
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

  mainWindow.on('focus', () => {
    mainWindow?.flashFrame(false);
  });

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

export async function createAuthWindow(title?: string): Promise<BrowserWindow> {
  if (authWindow && !authWindow.isDestroyed()) {
    authWindow.showInactive();
    authWindow.moveTop();
    authWindow.flashFrame(true);
    return authWindow;
  }

  if (DEV) {
    waitForPort(PORT).catch((err) => {
      console.error(`${new Date().toLocaleString()} | Cannot connect to Next.js server:`, err);
      app.quit();
    });
  }

  authWindow = new BrowserWindow({
    title: title || VERSION_TITLE,
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
    show: false,
    webPreferences: {
      devTools: DEV,
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

  authWindow.on('focus', () => {
    authWindow?.flashFrame(false);
  });

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

export async function createPopup(type: PopupType, id: string, data: unknown, force = true, title?: string): Promise<BrowserWindow> {
  // If force is true, destroy the popup
  if (force) {
    if (popups[id] && !popups[id].isDestroyed()) {
      popups[id].destroy();
    }
  } else {
    if (popups[id] && !popups[id].isDestroyed()) {
      popups[id].showInactive();
      popups[id].moveTop();
      popups[id].flashFrame(true);
      return popups[id];
    }
  }

  if (DEV) {
    waitForPort(PORT).catch((err) => {
      console.error(`${new Date().toLocaleString()} | Cannot connect to Next.js server:`, err);
      app.exit();
    });
  }

  popups[id] = new BrowserWindow({
    title: title || VERSION_TITLE,
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
    show: false,
    webPreferences: {
      devTools: DEV,
      webviewTag: true,
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
    },
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

  popups[id].on('ready-to-show', () => {
    popups[id].showInactive();
    popups[id].moveTop();
    popups[id].flashFrame(true);
  });

  popups[id].on('focus', () => {
    popups[id].flashFrame(false);
  });

  popups[id].on('close', (e) => {
    e.preventDefault();
    popups[id].destroy();
    delete popups[id];
  });

  popups[id].webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return popups[id];
}

export function closePopups() {
  Object.values(popups).forEach((popup) => {
    if (popup && !popup.isDestroyed()) {
      popup.close();
    }
  });
  popups = {};
}

// Auto Updater
function configureAutoUpdater() {
  const channel = env.UPDATE_CHANNEL;
  if (channel) {
    autoUpdater.channel = channel;
    autoUpdater.allowPrerelease = true;
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'NerdyHomeReOpen',
      repo: 'RiceCall',
      channel: channel,
    });
  } else {
    autoUpdater.allowPrerelease = false;
  }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;

  if (DEV) {
    autoUpdater.forceDevUpdateConfig = true;
    autoUpdater.updateConfigPath = path.join(app.getAppPath(), 'dev-app-update.yml');
  }

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    dialog
      .showMessageBox({
        type: 'info',
        title: t('update-available'),
        message: t('update-available-message', { version: info.version, releaseDate: new Date(info.releaseDate).toLocaleDateString() }),
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
        title: t('update-downloaded'),
        message: t('update-downloaded-message', { version: info.version }),
        buttons: [t('install-update')],
      })
      .then((buttonIndex) => {
        if (buttonIndex.response === 0) {
          autoUpdater.quitAndInstall(false, true);
          isUpdateNotified = false;
        }
      })
      .catch((error) => {
        console.error(`${new Date().toLocaleString()} | Cannot show update dialog:`, error.message);
      });
  });

  function checkUpdate() {
    if (DEV) return;
    if (isUpdateNotified) return;
    console.log(`${new Date().toLocaleString()} | Checking for updates, channel:`, env.UPDATE_CHANNEL);
    autoUpdater
      .checkForUpdates()
      .catch((error) => {
        console.error(`${new Date().toLocaleString()} | Cannot check for updates:`, error.message);
      })
      .finally(() => {
        isUpdateNotified = true;
      });
  }

  // Check update every hour
  setInterval(checkUpdate, 60 * 60 * 1000);
  checkUpdate();
}

// Tray Icon
let tray: Tray | null = null;

export function setTrayDetail(isLogin: boolean) {
  if (!tray) return;
  const trayIconPath = isLogin ? APP_TRAY_ICON.normal : APP_TRAY_ICON.gray;
  const contextMenu = Menu.buildFromTemplate([
    {
      id: 'open-main-window',
      label: t('open-main-window'),
      type: 'normal',
      click: () => {
        if (isLogin) mainWindow?.showInactive();
        else authWindow?.showInactive();
      },
    },
    { type: 'separator' },
    {
      id: 'logout',
      label: t('logout'),
      type: 'normal',
      enabled: isLogin,
      click: () => {
        closePopups();
        ipcMain.emit('logout');
      },
    },
    {
      id: 'exit',
      label: t('exit'),
      type: 'normal',
      click: () => app.exit(),
    },
  ]);
  tray.setImage(nativeImage.createFromPath(trayIconPath));
  tray.setContextMenu(contextMenu);
}

export function configureTray() {
  if (tray) tray.destroy();
  const trayIconPath = APP_TRAY_ICON.gray;
  tray = new Tray(nativeImage.createFromPath(trayIconPath));
  tray.setToolTip(VERSION_TITLE);
  tray.on('click', () => {
    if (isLogin) mainWindow?.showInactive();
    else authWindow?.showInactive();
  });
  setTrayDetail(isLogin);
}

app.on('ready', async () => {
  // Load env
  loadEnv();

  // Configure
  configureAutoUpdater();
  configureDiscordRPC();
  configureTray();

  if (!store.get('dontShowDisclaimer')) createPopup('aboutus', 'aboutUs', {});
  createAuthWindow().then((authWindow) => authWindow.showInactive());
  createMainWindow().then((mainWindow) => mainWindow.hide());

  ipcMain.on('exit', () => {
    app.exit();
  });

  // Accounts handlers
  ipcMain.on('get-accounts', (event) => {
    event.returnValue = store.get('accounts');
  });

  ipcMain.on('add-account', (_, account: string, data: { autoLogin: boolean; rememberAccount: boolean; password: string }) => {
    const accounts = store.get('accounts');
    accounts[account] = data;
    store.set('accounts', accounts);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('accounts', accounts);
    });
  });

  ipcMain.on('delete-account', (_, account: string) => {
    const accounts = store.get('accounts');
    delete accounts[account];
    store.set('accounts', accounts);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('accounts', accounts);
    });
  });

  // Auth handlers
  ipcMain.on('login', (_, _token) => {
    token = _token;
    isLogin = true;
    mainWindow?.showInactive();
    authWindow?.hide();
    connectSocket(token);
    setTrayDetail(isLogin);
  });

  ipcMain.on('logout', () => {
    clearDiscordPresence();
    closePopups();
    token = '';
    isLogin = false;
    mainWindow?.hide();
    authWindow?.showInactive();
    disconnectSocket();
    setTrayDetail(isLogin);
  });

  // toolbar handlers
  ipcMain.on('set-toolbar-title', (_, title: string) => {
    if (!tray) return;
    const fullTitle = title ? `${title} · ${MAIN_TITLE}` : VERSION_TITLE;
    tray.setToolTip(fullTitle);
    mainWindow?.setTitle(fullTitle);
  });

  // Language handlers
  ipcMain.on('get-language', (event) => {
    event.returnValue = store.get('language');
  });

  ipcMain.on('set-language', (_, language) => {
    store.set('language', language ?? 'zh-TW');
    initMainI18n(language ?? 'zh-TW');
    setTrayDetail(isLogin);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('language', language);
    });
  });

  // Custom themes handlers
  ipcMain.on('get-custom-themes', (event) => {
    const customThemes = store.get('customThemes');
    event.returnValue = Array.from({ length: 7 }, (_, i) => customThemes[i] ?? {});
  });

  ipcMain.on('add-custom-theme', (_, theme) => {
    const customThemes = store.get('customThemes');
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
    const customThemes = store.get('customThemes');
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
    event.returnValue = store.get('currentTheme');
  });

  ipcMain.on('set-current-theme', (_, theme) => {
    store.set('currentTheme', theme);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('current-theme', theme);
    });
  });

  // Popup handlers
  ipcMain.on('open-popup', (_, type, id, data?, force = true, title?: string) => {
    console.log(`${new Date().toLocaleString()} | open popup`, type, id, title);
    const fullTitle = title ? `${title} · ${MAIN_TITLE}` : VERSION_TITLE;
    createPopup(type, id, data ?? {}, force, fullTitle);
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
    updatePresence.startTimestamp = START_TIMESTAMP;
    updateDiscordPresence(updatePresence);
  });

  // Env
  ipcMain.on('get-env', (event) => {
    event.returnValue = env;
  });

  // Token
  ipcMain.on('get-token', (event) => {
    event.returnValue = token;
  });

  // Latency
  ipcMain.on('get-latency', (event) => {
    event.returnValue = latency;
  });

  // System settings handlers
  ipcMain.on('get-system-settings', (event) => {
    const settings = {
      // Basic settings
      autoLogin: store.get('autoLogin'),
      autoLaunch: isAutoLaunchEnabled(),
      alwaysOnTop: store.get('alwaysOnTop'),
      statusAutoIdle: store.get('statusAutoIdle'),
      statusAutoIdleMinutes: store.get('statusAutoIdleMinutes'),
      statusAutoDnd: store.get('statusAutoDnd'),
      channelUIMode: store.get('channelUIMode'),
      closeToTray: store.get('closeToTray'),
      dontShowDisclaimer: store.get('dontShowDisclaimer'),
      font: store.get('font'),
      fontSize: store.get('fontSize'),
      // Mix settings
      inputAudioDevice: store.get('audioInputDevice'),
      outputAudioDevice: store.get('audioOutputDevice'),
      mixEffect: store.get('mixEffect'),
      mixEffectType: store.get('mixEffectType'),
      autoMixSetting: store.get('autoMixSetting'),
      echoCancellation: store.get('echoCancellation'),
      noiseCancellation: store.get('noiseCancellation'),
      microphoneAmplification: store.get('microphoneAmplification'),
      manualMixMode: store.get('manualMixMode'),
      mixMode: store.get('mixMode'),
      // Voice settings
      speakingMode: store.get('speakingMode'),
      defaultSpeakingKey: store.get('defaultSpeakingKey'),
      // Privacy settings
      notSaveMessageHistory: store.get('notSaveMessageHistory'),
      // Hotkeys Settings
      hotKeyOpenMainWindow: store.get('hotKeyOpenMainWindow'),
      hotKeyScreenshot: store.get('hotKeyScreenshot'),
      hotKeyIncreaseVolume: store.get('hotKeyIncreaseVolume'),
      hotKeyDecreaseVolume: store.get('hotKeyDecreaseVolume'),
      hotKeyToggleSpeaker: store.get('hotKeyToggleSpeaker'),
      hotKeyToggleMicrophone: store.get('hotKeyToggleMicrophone'),
      // SoundEffect settings
      disableAllSoundEffect: store.get('disableAllSoundEffect'),
      enterVoiceChannelSound: store.get('enterVoiceChannelSound'),
      leaveVoiceChannelSound: store.get('leaveVoiceChannelSound'),
      startSpeakingSound: store.get('startSpeakingSound'),
      stopSpeakingSound: store.get('stopSpeakingSound'),
      receiveDirectMessageSound: store.get('receiveDirectMessageSound'),
      receiveChannelMessageSound: store.get('receiveChannelMessageSound'),
    };
    event.returnValue = settings;
  });

  // Basic
  ipcMain.on('get-auto-login', (event) => {
    event.returnValue = store.get('autoLogin');
  });

  ipcMain.on('get-auto-launch', (event) => {
    event.returnValue = isAutoLaunchEnabled();
  });

  ipcMain.on('get-always-on-top', (event) => {
    event.returnValue = store.get('alwaysOnTop');
  });

  ipcMain.on('get-status-auto-idle', (event) => {
    event.returnValue = store.get('statusAutoIdle');
  });

  ipcMain.on('get-status-auto-idle-minutes', (event) => {
    event.returnValue = store.get('statusAutoIdleMinutes');
  });

  ipcMain.on('get-status-auto-dnd', (event) => {
    event.returnValue = store.get('statusAutoDnd');
  });

  ipcMain.on('get-channel-ui-mode', (event) => {
    event.returnValue = store.get('channelUIMode');
  });

  ipcMain.on('get-close-to-tray', (event) => {
    event.returnValue = store.get('closeToTray');
  });

  ipcMain.on('get-font', (event) => {
    event.returnValue = store.get('font');
  });

  ipcMain.on('get-font-size', (event) => {
    event.returnValue = store.get('fontSize');
  });

  ipcMain.on('get-font-list', async (event) => {
    const fonts = await fontList.getFonts();
    event.returnValue = fonts;
  });

  // Mix
  ipcMain.on('get-input-audio-device', (event) => {
    event.returnValue = store.get('audioInputDevice');
  });

  ipcMain.on('get-output-audio-device', (event) => {
    event.returnValue = store.get('audioOutputDevice');
  });

  ipcMain.on('get-mix-effect', (event) => {
    event.returnValue = store.get('mixEffect');
  });

  ipcMain.on('get-mix-effect-type', (event) => {
    event.returnValue = store.get('mixEffectType');
  });

  ipcMain.on('get-auto-mix-setting', (event) => {
    event.returnValue = store.get('autoMixSetting');
  });

  ipcMain.on('get-echo-cancellation', (event) => {
    event.returnValue = store.get('echoCancellation');
  });

  ipcMain.on('get-noise-cancellation', (event) => {
    event.returnValue = store.get('noiseCancellation');
  });

  ipcMain.on('get-microphone-amplification', (event) => {
    event.returnValue = store.get('microphoneAmplification');
  });

  ipcMain.on('get-manual-mix-mode', (event) => {
    event.returnValue = store.get('manualMixMode');
  });

  ipcMain.on('get-mix-mode', (event) => {
    event.returnValue = store.get('mixMode');
  });

  // Voice
  ipcMain.on('get-speaking-mode', (event) => {
    event.returnValue = store.get('speakingMode');
  });

  ipcMain.on('get-default-speaking-key', (event) => {
    event.returnValue = store.get('defaultSpeakingKey');
  });

  // Privacy
  ipcMain.on('get-not-save-message-history', (event) => {
    event.returnValue = store.get('notSaveMessageHistory');
  });

  // HotKey
  ipcMain.on('get-hot-key-open-main-window', (event) => {
    event.returnValue = store.get('hotKeyOpenMainWindow');
  });

  ipcMain.on('get-hot-key-increase-volume', (event) => {
    event.returnValue = store.get('hotKeyIncreaseVolume');
  });

  ipcMain.on('get-hot-key-decrease-volume', (event) => {
    event.returnValue = store.get('hotKeyDecreaseVolume');
  });

  ipcMain.on('get-hot-key-toggle-speaker', (event) => {
    event.returnValue = store.get('hotKeyToggleSpeaker');
  });

  ipcMain.on('get-hot-key-toggle-microphone', (event) => {
    event.returnValue = store.get('hotKeyToggleMicrophone');
  });

  // SoundEffect
  ipcMain.on('get-disable-all-sound-effect', (event) => {
    event.returnValue = store.get('disableAllSoundEffect');
  });

  ipcMain.on('get-enter-voice-channel-sound', (event) => {
    event.returnValue = store.get('enterVoiceChannelSound');
  });

  ipcMain.on('get-leave-voice-channel-sound', (event) => {
    event.returnValue = store.get('leaveVoiceChannelSound');
  });

  ipcMain.on('get-start-speaking-sound', (event) => {
    event.returnValue = store.get('startSpeakingSound');
  });

  ipcMain.on('get-stop-speaking-sound', (event) => {
    event.returnValue = store.get('stopSpeakingSound');
  });

  ipcMain.on('get-receive-direct-message-sound', (event) => {
    event.returnValue = store.get('receiveDirectMessageSound');
  });

  ipcMain.on('get-receive-channel-message-sound', (event) => {
    event.returnValue = store.get('receiveChannelMessageSound');
  });

  // Basic
  ipcMain.on('set-auto-login', (_, enable) => {
    store.set('autoLogin', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('auto-login', enable);
    });
  });

  ipcMain.on('set-auto-launch', (_, enable) => {
    setAutoLaunch(enable ?? false);
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
    store.set('statusAutoIdleMinutes', value ?? 10);
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
    store.set('channelUIMode', mode ?? 'classic');
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
    store.set('font', font ?? '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('font', font);
    });
  });

  ipcMain.on('set-font-size', (_, fontSize) => {
    store.set('fontSize', fontSize ?? 13);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('font-size', fontSize);
    });
  });

  // Mix
  ipcMain.on('set-input-audio-device', (_, deviceId) => {
    store.set('audioInputDevice', deviceId ?? '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('input-audio-device', deviceId);
    });
  });

  ipcMain.on('set-output-audio-device', (_, deviceId) => {
    store.set('audioOutputDevice', deviceId ?? '');
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
    store.set('mixEffectType', type ?? '');
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
    store.set('mixMode', mode ?? 'all');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('mix-mode', mode);
    });
  });

  // Voice
  ipcMain.on('set-speaking-mode', (_, mode) => {
    store.set('speakingMode', mode ?? 'key');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('speaking-mode', mode);
    });
  });

  ipcMain.on('set-default-speaking-key', (_, key) => {
    store.set('defaultSpeakingKey', key ?? '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('default-speaking-key', key);
    });
  });

  // Privacy
  ipcMain.on('set-not-save-message-history', (_, enable) => {
    store.set('notSaveMessageHistory', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('not-save-message-history', enable);
    });
  });

  // HotKey
  ipcMain.on('set-hot-key-open-main-window', (_, key) => {
    store.set('hotKeyOpenMainWindow', key ?? '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-open-main-window', key);
    });
  });

  ipcMain.on('set-hot-key-increase-volume', (_, key) => {
    store.set('hotKeyIncreaseVolume', key ?? '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-increase-volume', key);
    });
  });

  ipcMain.on('set-hot-key-decrease-volume', (_, key) => {
    store.set('hotKeyDecreaseVolume', key ?? '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-decrease-volume', key);
    });
  });

  ipcMain.on('set-hot-key-toggle-speaker', (_, key) => {
    store.set('hotKeyToggleSpeaker', key ?? '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-toggle-speaker', key);
    });
  });

  ipcMain.on('set-hot-key-toggle-microphone', (_, key) => {
    store.set('hotKeyToggleMicrophone', key ?? '');
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
    store.set('enterVoiceChannelSound', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('enter-voice-channel-sound', enable);
    });
  });

  ipcMain.on('set-leave-voice-channel-sound', (_, enable) => {
    store.set('leaveVoiceChannelSound', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('leave-voice-channel-sound', enable);
    });
  });

  ipcMain.on('set-start-speaking-sound', (_, enable) => {
    store.set('startSpeakingSound', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('start-speaking-sound', enable);
    });
  });

  ipcMain.on('set-stop-speaking-sound', (_, enable) => {
    store.set('stopSpeakingSound', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('stop-speaking-sound', enable);
    });
  });

  ipcMain.on('set-receive-direct-message-sound', (_, enable) => {
    store.set('receiveDirectMessageSound', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('receive-direct-message-sound', enable);
    });
  });

  ipcMain.on('set-receive-channel-message-sound', (_, enable) => {
    store.set('receiveChannelMessageSound', enable ?? false);
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
  disconnectSocket();
  clearDiscordPresence();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createAuthWindow().then((authWindow) => authWindow.showInactive());
    createMainWindow().then((mainWindow) => mainWindow.showInactive());
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
    else {
      const window = authWindow && authWindow.isDestroyed() === false ? authWindow : mainWindow && mainWindow.isDestroyed() === false ? mainWindow : null;
      if (window) {
        if (window.isMinimized()) window.restore();
        window.focus();
      }
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
    console.error(`${new Date().toLocaleString()} | Error parsing deep link:`, error);
  }
}

process.on('uncaughtException', (error) => {
  console.error(`${new Date().toLocaleString()} | Uncaught exception:`, error);
});

process.on('unhandledRejection', (error) => {
  console.error(`${new Date().toLocaleString()} | Unhandled rejection:`, error);
});
