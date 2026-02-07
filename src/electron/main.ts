/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import net from 'net';
import path from 'path';
import { Readable } from 'stream';
import fontList from 'font-list';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
const binaryPath = ffmpegPath ? (app.isPackaged ? ffmpegPath.replace('app.asar', 'app.asar.unpacked') : ffmpegPath) : '';
ffmpeg.setFfmpegPath(binaryPath);
import serve from 'electron-serve';
import Store from 'electron-store';
import log from 'electron-log';
import { initMain } from 'electron-audio-loopback-josh';
initMain();
import ElectronUpdater, { ProgressInfo, UpdateInfo } from 'electron-updater';
const { autoUpdater } = ElectronUpdater;
import { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu, nativeImage, session, protocol, webContents } from 'electron';
import { io, Socket } from 'socket.io-client';
import * as Types from '../types';
import { initMainI18n, t } from './i18n.js';
import { clearDiscordPresence, configureDiscordRPC, updateDiscordPresence } from './discord.js';
import { getEnv as env, loadEnv } from '../env.js';
import { getToken, removeToken, setToken } from '../auth.token.js';
import * as Auth from '../auth.service.js';
import * as Data from '../data.service.js';
import * as Loader from '../loader.js';
import Logger from '../logger.js';
import { LANGUAGES } from '../constant.js';
import { POPUP_SIZES, POPUP_BEHAVIORS } from '../popup.config.js';
import { initNetworkDiagnosisTool } from './network-diagnosis-tool.js';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('--no-sandbox');
}

// Register custom protocol privileges
protocol.registerSchemesAsPrivileged([{ scheme: 'local-resource', privileges: { secure: true, supportFetchAPI: true, standard: true, bypassCSP: true, corsEnabled: true } }]);

export function getRegion(): Types.LanguageKey {
  const language = app.getLocale();

  const match = LANGUAGES.find(({ code }) => code.includes(language) || language.includes(code));
  if (!match) return 'en-US';

  return match.code;
}

function convertWavToMp3AndSave(inputWav: ArrayBuffer, outputMp3: string) {
  const buffer = Buffer.from(inputWav);
  const inputStream = Readable.from(buffer);

  ffmpeg(inputStream)
    .audioCodec('libmp3lame')
    .audioBitrate('320k')
    .save(outputMp3)
    .on('error', () => {
      createPopup('dialogError', 'dialogError', { error: new Error('convert-wav-to-mp3-failed') }, true);
    });
}

const store = new Store<Types.StoreType>({
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
    recordSavePath: app.getPath('documents'),
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
export let isLogin: boolean = false;
export let isUpdateNotified: boolean = false;
export let checkForUpdatesInterval: NodeJS.Timeout | null = null;

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
    new Logger('System').error(`Set auto launch error: ${error}`);
  }
}

function isAutoLaunchEnabled(): boolean {
  try {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  } catch (error) {
    new Logger('System').error(`Get auto launch error: ${error}`);
    return false;
  }
}

export function getSettings(): Types.SystemSettings {
  return {
    autoLogin: store.get('autoLogin'),
    autoLaunch: isAutoLaunchEnabled(),
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
      new Logger('System').error(`Cannot connect to Next.js server: ${err}`);
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
      webSecurity: true,
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
    mainWindow?.webContents.navigationHistory.clear();
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
    authWindow.flashFrame(true);
    return authWindow;
  }

  if (DEV) {
    waitForPort(PORT).catch((err) => {
      new Logger('System').error(`Cannot connect to Next.js server: ${err}`);
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

  authWindow.webContents.on('did-finish-load', () => {
    authWindow?.webContents.navigationHistory.clear();
  });

  authWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return authWindow;
}

export async function createPopup(type: Types.PopupType, id: string, initialData: unknown, force = true, title?: string): Promise<BrowserWindow> {
  const fullTitle = title ? `${title} · ${MAIN_TITLE}` : VERSION_TITLE;
  const behavior = POPUP_BEHAVIORS[type] ?? { resizable: false, maximizable: false, fullscreenable: false };
  const size = POPUP_SIZES[type] ?? { width: 400, height: 300 };

  // If force is true, destroy the popup
  if (force) {
    if (popups[id] && !popups[id].isDestroyed()) {
      popups[id].destroy();
    }
  } else {
    if (popups[id] && !popups[id].isDestroyed()) {
      popups[id].showInactive();
      popups[id].flashFrame(true);
      return popups[id];
    }
  }

  if (DEV) {
    waitForPort(PORT).catch((err) => {
      new Logger('System').error(`Cannot connect to Next.js server: ${err}`);
      app.exit();
    });
  }

  popups[id] = new BrowserWindow({
    title: fullTitle,
    width: size.width,
    height: size.height,
    minWidth: size.width,
    minHeight: size.height,
    thickFrame: true,
    titleBarStyle: 'hidden',
    maximizable: behavior.maximizable,
    resizable: behavior.resizable,
    fullscreen: false,
    fullscreenable: behavior.fullscreenable,
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
    event.returnValue = initialData;
  });

  popups[id].on('ready-to-show', () => {
    popups[id].showInactive();
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

  popups[id].on('maximize', () => {
    popups[id]?.webContents.send('maximize');
  });

  popups[id].on('unmaximize', () => {
    popups[id]?.webContents.send('unmaximize');
  });

  popups[id].webContents.on('did-finish-load', () => {
    popups[id]?.webContents.navigationHistory.clear();
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
async function checkForUpdates(force = false) {
  if (isUpdateNotified && !force) return;

  if (DEV) {
    autoUpdater.forceDevUpdateConfig = true;
    autoUpdater.updateConfigPath = path.join(app.getAppPath(), 'dev-app-update.yml');
  }

  const channel = store.get('updateChannel');
  new Logger('System').info(`Checking for updates, channel: ${channel}`);

  if (channel === 'dev') {
    autoUpdater.allowPrerelease = true;
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'NerdyHomeReOpen',
      repo: 'RiceCall',
      channel: 'dev',
    });
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.allowDowngrade = true;
    const result = await autoUpdater.checkForUpdates().catch((error) => {
      new Logger('System').error(`Cannot check for updates in dev channel: ${error.message}`);
    });
    if (result?.isUpdateAvailable) return result;
  }

  autoUpdater.allowPrerelease = false;
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'NerdyHomeReOpen',
    repo: 'RiceCall',
    channel: 'latest',
  });
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.allowDowngrade = false;
  const result = await autoUpdater.checkForUpdates().catch((error) => {
    new Logger('System').error(`Cannot check for updates in latest channel: ${error.message}`);
  });
  if (result?.isUpdateAvailable) return result;
}

async function configureAutoUpdater() {
  autoUpdater.on('update-available', (info: UpdateInfo) => {
    new Logger('System').info(`Update available: ${info.version}`);

    dialog
      .showMessageBox({
        type: 'info',
        title: t('update-available'),
        message: t('update-available-message', { version: info.version, releaseDate: new Date(info.releaseDate).toLocaleDateString() }),
        buttons: [t('download-update'), t('cancel')],
        cancelId: 1,
      })
      .then((buttonIndex) => {
        if (buttonIndex.response === 0) {
          autoUpdater.downloadUpdate();
        }
      })
      .catch((error) => {
        new Logger('System').error(`Cannot show update dialog: ${error.message}`);
      });
    isUpdateNotified = true;
  });

  autoUpdater.on('update-not-available', () => {
    new Logger('System').info(`Is latest version`);
  });

  autoUpdater.on('download-progress', (progressInfo: ProgressInfo) => {
    let message = `${progressInfo.bytesPerSecond}`;
    message = `${message} - ${progressInfo.percent}%`;
    message = `${message} (${progressInfo.transferred}/${progressInfo.total})`;
    new Logger('System').info(`Downloading update: ${message}`);
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    new Logger('System').info(`Update downloaded: ${info.version}`);

    dialog
      .showMessageBox({
        type: 'info',
        title: t('update-downloaded'),
        message: t('update-downloaded-message', { version: info.version }),
        buttons: [t('install-update'), t('install-after-quit'), t('cancel')],
        cancelId: 2,
      })
      .then((buttonIndex) => {
        if (buttonIndex.response === 0) {
          autoUpdater.quitAndInstall(false, true);
        } else if (buttonIndex.response === 1) {
          autoUpdater.autoInstallOnAppQuit = true;
        }
      })
      .catch((error) => {
        new Logger('System').error(`Cannot show update dialog: ${error.message}`);
      });
    isUpdateNotified = false;
  });

  if (store.get('autoCheckForUpdates')) startCheckForUpdates();
}

export function startCheckForUpdates() {
  if (checkForUpdatesInterval) clearInterval(checkForUpdatesInterval);
  checkForUpdatesInterval = setInterval(checkForUpdates, store.get('updateCheckInterval'));
  checkForUpdates();
}

export function stopCheckForUpdates() {
  if (checkForUpdatesInterval) clearInterval(checkForUpdatesInterval);
  checkForUpdatesInterval = null;
}

// Tray Icon
let tray: Tray | null = null;

export function setTrayDetail() {
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
      click: () => logout(),
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
  setTrayDetail();
}

// Logger
const configureLogger = () => {
  log.initialize();
  log.transports.file.level = 'info';
  log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'main.log');
  log.transports.file.maxSize = 5 * 1024 * 1024;
  log.transports.remote.url = `${env().API_URL}/logs`;
  Object.assign(console, log.functions);
  log.transports.file.format = '[{level}] [{y}-{m}-{d} {h}:{i}:{s}] {text}';
};

// React DevTools
export function configureReactDevTools() {
  if (DEV) {
    const reactDevToolsPath = env().REACT_DEV_TOOLS_PATH || '';
    try {
      session.defaultSession.extensions.loadExtension(reactDevToolsPath, {
        allowFileAccess: true,
      });
      new Logger('System').info('React DevTools loaded successfully');
    } catch (err) {
      new Logger('System').error(`Cannot load React DevTools: ${err}`);
    }
  }
}

// Socket
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
  'editUserSetting',
  'favoriteServer',
  'increaseUserQueueTime',
  'joinQueue',
  'leaveQueue',
  'moveUserQueuePosition',
  'moveUserToChannel',
  'muteUserInChannel',
  'rejectFriendApplication',
  'rejectMemberApplication',
  'rejectMemberInvitation',
  'removeUserFromQueue',
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
        socket?.timeout(5000).emit(event, payload, (err: unknown, ack: Types.ACK<T>) => {
          if (err) reject(err);
          else resolve(ack);
        });
      });
    } catch (err) {
      if (i === retries) throw err;
      new Logger('Socket').warn(`Retrying(#${i}) socket.emit ${event}: ${JSON.stringify(payload)}`);
    }
  }
  throw new Error('Failed to emit event with retry');
}

function sendHeartbeat() {
  const start = Date.now();
  socket?.timeout(5000).emit('heartbeat', { seq: ++seq }, (err: unknown, ack: { seq: number; t: number }) => {
    if (err) {
      new Logger('Socket').warn(`Heartbeat ${seq} timeout`);
    } else {
      const latency = Date.now() - start;
      new Logger('Socket').info(`ACK for #${ack.seq} in ${latency} ms`);
      BrowserWindow.getAllWindows().forEach((window) => {
        window.webContents.send('heartbeat', { seq: ack.seq, latency });
      });
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
    for (const event of ClientToServerEventNames) {
      ipcMain.removeAllListeners(event);
    }

    for (const event of ServerToClientEventNames) {
      socket?.removeAllListeners(event);
    }

    // Register event listeners
    ClientToServerEventWithAckNames.forEach((event) => {
      ipcMain.handle(event, (_, payload) => {
        new Logger('Socket').info(`socket.emit ${event}: ${JSON.stringify(payload)}`);
        return new Promise((resolve) => {
          emitWithRetry(event, payload)
            .then((ack) => {
              new Logger('Socket').info(`socket.onAck ${event}: ${JSON.stringify(ack)}`);
              resolve(ack);
            })
            .catch((err) => {
              new Logger('Socket').error(`socket.emit ${event} error: ${err.message}`);
              resolve({ ok: false, error: err.message });
            });
        });
      });
    });

    ClientToServerEventNames.forEach((event) => {
      ipcMain.on(event, (_, ...args) => {
        new Logger('Socket').info(`socket.emit ${event}: ${JSON.stringify(args)}`);
        socket?.emit(event, ...args);
      });
    });

    ServerToClientEventNames.forEach((event) => {
      socket?.on(event, async (...args) => {
        if (!noLogEventSet.has(event)) new Logger('Socket').info(`socket.on ${event}: ${JSON.stringify(args)}`);
        BrowserWindow.getAllWindows().forEach((window) => {
          window.webContents.send(event, ...args);
        });
      });
    });

    sendHeartbeat();
    if (interval) clearInterval(interval);
    interval = setInterval(sendHeartbeat, 30000);

    new Logger('Socket').info(`Socket connected`);

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
      socket?.removeAllListeners(event);
    }

    if (interval) clearInterval(interval);

    new Logger('Socket').info(`Socket disconnected, reason: ${reason}`);

    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('disconnect', reason);
    });
  });

  socket.on('connect_error', (error) => {
    new Logger('Socket').error(`Socket connect error: ${error}`);

    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('connect_error', error);
    });
  });

  socket.on('reconnect', (attemptNumber) => {
    new Logger('Socket').info(`Socket reconnected, attempt number: ${attemptNumber}`);

    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('reconnect', attemptNumber);
    });
  });

  socket.on('reconnect_error', (error) => {
    new Logger('Socket').error(`Socket reconnect error: ${error}`);

    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('reconnect_error', error);
    });
  });

  socket.connect();
}

export function disconnectSocket() {
  if (!socket) return;

  socket.emit('disconnectUser');

  for (const event of ClientToServerEventNames) {
    ipcMain.removeAllListeners(event);
  }

  for (const event of ServerToClientEventNames) {
    socket?.removeAllListeners(event);
  }

  socket.disconnect();
  socket = null;
}

// Auth
async function login(formData: { account: string; password: string }) {
  return await Auth.login(formData)
    .then((res) => {
      if (res.success) {
        setToken(res.token);
        connectSocket(res.token);
        isLogin = true;
        mainWindow?.showInactive();
        authWindow?.hide();
        setTrayDetail();
      }
      return res;
    })
    .catch((error) => {
      createPopup('dialogError', 'dialogError', { error }, true);
      return { success: false };
    });
}

async function logout() {
  removeToken();
  disconnectSocket();
  isLogin = false;
  mainWindow?.reload();
  mainWindow?.hide();
  authWindow?.showInactive();
  closePopups();
  setTrayDetail();
}

async function register(formData: { account: string; password: string; email: string; username: string; locale: string }) {
  return await Auth.register(formData).catch((error: any) => {
    createPopup('dialogError', 'dialogError', { error }, true);
    return { success: false };
  });
}

async function autoLogin(token: string) {
  return await Auth.autoLogin(token)
    .then((res) => {
      if (res.success) {
        setToken(res.token);
        connectSocket(res.token);
        isLogin = true;
        mainWindow?.showInactive();
        authWindow?.hide();
        setTrayDetail();
      }
      return res;
    })
    .catch((error) => {
      createPopup('dialogError', 'dialogError', { error }, true);
      return { success: false };
    });
}

app.on('ready', async () => {
  // Load env
  loadEnv(store.get('server', 'prod'));

  // Initialize
  initMainI18n(store.get('language'));
  initNetworkDiagnosisTool();

  // Configure
  configureAutoUpdater();
  configureDiscordRPC();
  configureTray();
  configureReactDevTools();
  configureLogger();

  if (!store.get('dontShowDisclaimer')) createPopup('aboutus', 'aboutUs', {});
  createAuthWindow().then((authWindow) => authWindow.showInactive());
  createMainWindow().then((mainWindow) => mainWindow.hide());

  ipcMain.on('exit', () => {
    app.exit();
  });

  // Auth handlers
  ipcMain.handle('auth-login', async (_, formData: { account: string; password: string }) => {
    return await login(formData);
  });

  ipcMain.handle('auth-logout', async () => {
    return await logout();
  });

  ipcMain.handle('auth-register', async (_, formData: { account: string; password: string; email: string; username: string; locale: string }) => {
    return await register(formData);
  });

  ipcMain.handle('auth-auto-login', async (_, token: string) => {
    return await autoLogin(token);
  });

  ipcMain.on('save-record', (_, record: ArrayBuffer) => {
    try {
      const outputDir = store.get('recordSavePath');

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const format = store.get('recordFormat') === 'mp3' ? 'mp3' : 'wav';

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `recording-${timestamp}.${format}`;
      const outputPath = path.join(outputDir, fileName);

      if (format === 'mp3') {
        convertWavToMp3AndSave(record, outputPath);
      } else {
        const buffer = Buffer.from(record);
        fs.writeFileSync(outputPath, buffer);
      }
    } catch (error: any) {
      new Logger('System').error(`Save audio error: ${error.message}`);
    }
  });

  ipcMain.handle('select-record-save-path', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: t('select-record-save-path'),
      defaultPath: store.get('recordSavePath'),
      properties: ['openDirectory'],
    });
    if (canceled) return null;
    return filePaths[0];
  });

  // Data handlers
  ipcMain.handle('data-user', async (_, params: { userId: string }) => {
    return await Data.user(params);
  });

  ipcMain.handle('data-user-hot-reload', async (_, params: { userId: string }) => {
    if (!getToken()) return null;
    return await Data.user(params);
  });

  ipcMain.handle('data-friend', async (_, params: { userId: string; targetId: string }) => {
    return await Data.friend(params);
  });

  ipcMain.handle('data-friends', async (_, params: { userId: string }) => {
    return await Data.friends(params);
  });

  ipcMain.handle('data-friendActivities', async (_, params: { userId: string }) => {
    return await Data.friendActivities(params);
  });

  ipcMain.handle('data-friendGroup', async (_, params: { userId: string; friendGroupId: string }) => {
    return await Data.friendGroup(params);
  });

  ipcMain.handle('data-friendGroups', async (_, params: { userId: string }) => {
    return await Data.friendGroups(params);
  });

  ipcMain.handle('data-friendApplication', async (_, params: { receiverId: string; senderId: string }) => {
    return await Data.friendApplication(params);
  });

  ipcMain.handle('data-friendApplications', async (_, params: { receiverId: string }) => {
    return await Data.friendApplications(params);
  });

  ipcMain.handle('data-server', async (_, params: { userId: string; serverId: string }) => {
    return await Data.server(params);
  });

  ipcMain.handle('data-servers', async (_, params: { userId: string }) => {
    return await Data.servers(params);
  });

  ipcMain.handle('data-serverMembers', async (_, params: { serverId: string }) => {
    return await Data.serverMembers(params);
  });

  ipcMain.handle('data-serverOnlineMembers', async (_, params: { serverId: string }) => {
    return await Data.serverOnlineMembers(params);
  });

  ipcMain.handle('data-channel', async (_, params: { userId: string; serverId: string; channelId: string }) => {
    return await Data.channel(params);
  });

  ipcMain.handle('data-channels', async (_, params: { userId: string; serverId: string }) => {
    return await Data.channels(params);
  });

  ipcMain.handle('data-channelMembers', async (_, params: { serverId: string; channelId: string }) => {
    return await Data.channelMembers(params);
  });

  ipcMain.handle('data-member', async (_, params: { userId: string; serverId: string; channelId?: string }) => {
    return await Data.member(params);
  });

  ipcMain.handle('data-memberApplication', async (_, params: { userId: string; serverId: string }) => {
    return await Data.memberApplication(params);
  });

  ipcMain.handle('data-memberApplications', async (_, params: { serverId: string }) => {
    return await Data.memberApplications(params);
  });

  ipcMain.handle('data-memberInvitation', async (_, params: { receiverId: string; serverId: string }) => {
    return await Data.memberInvitation(params);
  });

  ipcMain.handle('data-memberInvitations', async (_, params: { receiverId: string }) => {
    return await Data.memberInvitations(params);
  });

  ipcMain.handle('data-notifications', async (_, params: { region: string }) => {
    return await Data.notifications(params);
  });

  ipcMain.handle('data-announcements', async (_, params: { region: string }) => {
    return await Data.announcements(params);
  });

  ipcMain.handle('data-recommendServers', async (_, params: { region: string }) => {
    return await Data.recommendServers(params);
  });

  ipcMain.handle('data-uploadImage', async (_, params: { folder: string; imageName: string; imageUnit8Array: Uint8Array }) => {
    return await Data.uploadImage(params);
  });

  ipcMain.handle('data-searchServer', async (_, params: { query: string }) => {
    return await Data.searchServer(params);
  });

  ipcMain.handle('data-searchUser', async (_, params: { query: string }) => {
    return await Data.searchUser(params);
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

  // Toolbar handlers
  ipcMain.on('set-tray-title', (_, title: string) => {
    if (!tray) return;
    const fullTitle = title ? `${title} · ${MAIN_TITLE}` : VERSION_TITLE;
    tray.setToolTip(fullTitle);
    mainWindow?.setTitle(fullTitle);
  });

  // Language handlers
  ipcMain.on('get-language', (event) => {
    event.returnValue = store.get('language');
  });

  ipcMain.on('set-language', (_, language = getRegion()) => {
    store.set('language', language);
    initMainI18n(language);
    setTrayDetail();
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('language', language);
    });
  });

  // Custom themes handlers
  ipcMain.on('get-custom-themes', (event) => {
    const customThemes = store.get('customThemes');
    event.returnValue = Array.from({ length: 7 }, (_, i) => customThemes[i] ?? {});
  });

  ipcMain.on('add-custom-theme', (_, theme: Types.Theme) => {
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

  ipcMain.on('delete-custom-theme', (_, index: number) => {
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

  ipcMain.on('set-current-theme', (_, theme: string) => {
    store.set('currentTheme', theme);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('current-theme', theme);
    });
  });

  ipcMain.handle('save-image', async (_, buffer: ArrayBuffer, directory: string, filenamePrefix: string, extension: string): Promise<string | null> => {
    try {
      const userDataPath = app.getPath('userData');
      const dirPath = path.join(userDataPath, directory);

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const timestamp = Date.now();
      const fileName = `${filenamePrefix}-${timestamp}.${extension}`;
      const filePath = path.join(dirPath, fileName);

      fs.writeFileSync(filePath, Buffer.from(buffer));

      return `local-resource://${directory}/${fileName}`;
    } catch (error: any) {
      new Logger('FileStorage').error(`Electron Storage Error: ${error.message}`);
      return null;
    }
  });

  // Update check handlers
  ipcMain.on('check-for-updates', async () => {
    const result = await checkForUpdates(true);
    if (!result || !result.isUpdateAvailable) {
      createPopup('dialogInfo', 'dialogInfo', { message: t('is-latest-version'), timestamp: Date.now() }, true);
    }
  });

  // Popup handlers
  ipcMain.on('open-popup', async (_, type, id, initialData?, force = true) => {
    new Logger('System').info(`Opening ${type} (${id})...`);

    const loader = Loader[type as keyof typeof Loader];
    if (loader)
      initialData = await loader({ ...initialData, systemSettings: getSettings() }).catch(() => {
        new Logger('System').error(`Cannot load ${type} data, aborting...`);
        return null;
      });
    if (!initialData) return;

    createPopup(type, id, initialData, force);
  });

  ipcMain.on('close-popup', (_, id) => {
    if (popups[id] && !popups[id].isDestroyed()) {
      popups[id].close();
    }
  });

  ipcMain.on('close-all-popups', () => {
    closePopups();
  });

  ipcMain.on('popup-submit', (_, to, data: unknown | null = null) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('popup-submit', to, data);
    });
  });

  // SFU Diagnosis
  ipcMain.on('request-sfu-diagnosis', (event) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('get-sfu-diagnosis', { senderId: event.sender.id });
    } else {
      event.sender.send('sfu-diagnosis-response', null);
    }
  });

  ipcMain.on('sfu-diagnosis-response', (_, data: { targetSenderId: number; info: unknown } | null) => {
    if (data?.targetSenderId != null) {
      const target = webContents.fromId(data.targetSenderId);
      if (target && !target.isDestroyed()) {
        target.send('sfu-diagnosis-response', data.info);
      }
    }
  });

  // Window control event handlers
  ipcMain.on('window-control-minimize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;
    window.minimize();
  });

  ipcMain.on('window-control-maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;
    if (process.platform === 'darwin') {
      window.setFullScreen(true);
    } else {
      window.maximize();
    }
    window.webContents.send('maximize');
  });

  ipcMain.on('window-control-unmaximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;
    if (process.platform === 'darwin') {
      window.setFullScreen(false);
    } else {
      window.unmaximize();
    }
    window.webContents.send('unmaximize');
  });

  ipcMain.on('window-control-close', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;
    window.close();
  });

  // Discord RPC handlers
  ipcMain.on('update-discord-presence', (_, updatePresence) => {
    updatePresence.startTimestamp = START_TIMESTAMP;
    updateDiscordPresence(updatePresence);
  });

  // Env handlers
  ipcMain.on('get-env', (event) => {
    event.returnValue = env;
  });

  ipcMain.on('change-server', (_, server: 'prod' | 'dev') => {
    store.set('server', server);
    loadEnv(server);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('server', server);
    });
  });

  // System settings handlers
  ipcMain.on('get-system-settings', (event) => {
    event.returnValue = getSettings();
  });

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

  ipcMain.on('get-input-audio-device', (event) => {
    event.returnValue = store.get('inputAudioDevice');
  });

  ipcMain.on('get-output-audio-device', (event) => {
    event.returnValue = store.get('outputAudioDevice');
  });

  ipcMain.on('get-record-format', (event) => {
    event.returnValue = store.get('recordFormat');
  });

  ipcMain.on('get-record-save-path', (event) => {
    event.returnValue = store.get('recordSavePath');
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

  ipcMain.on('get-speaking-mode', (event) => {
    event.returnValue = store.get('speakingMode');
  });

  ipcMain.on('get-default-speaking-key', (event) => {
    event.returnValue = store.get('defaultSpeakingKey');
  });

  ipcMain.on('get-not-save-message-history', (event) => {
    event.returnValue = store.get('notSaveMessageHistory');
  });

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

  ipcMain.on('get-auto-check-for-updates', (event) => {
    event.returnValue = store.get('autoCheckForUpdates');
  });

  ipcMain.on('get-update-check-interval', (event) => {
    event.returnValue = store.get('updateCheckInterval');
  });

  ipcMain.on('get-update-channel', (event) => {
    event.returnValue = store.get('updateChannel');
  });

  ipcMain.on('set-auto-login', (_, enable = false) => {
    store.set('autoLogin', enable);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('auto-login', enable);
    });
  });

  ipcMain.on('set-auto-launch', (_, enable = false) => {
    setAutoLaunch(enable);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('auto-launch', enable);
    });
  });

  ipcMain.on('set-always-on-top', (_, enable = false) => {
    store.set('alwaysOnTop', enable);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.setAlwaysOnTop(enable);
      window.webContents.send('always-on-top', enable);
    });
  });

  ipcMain.on('set-status-auto-idle', (_, enable = false) => {
    store.set('statusAutoIdle', enable);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('status-auto-idle', enable);
    });
  });

  ipcMain.on('set-status-auto-idle-minutes', (_, value = 10) => {
    store.set('statusAutoIdleMinutes', value);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('status-auto-idle-minutes', value);
    });
  });

  ipcMain.on('set-status-auto-dnd', (_, enable = false) => {
    store.set('statusAutoDnd', enable);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('status-auto-dnd', enable);
    });
  });

  ipcMain.on('set-channel-ui-mode', (_, mode = 'classic') => {
    store.set('channelUIMode', mode);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('channel-ui-mode', mode);
    });
  });

  ipcMain.on('set-close-to-tray', (_, enable = false) => {
    store.set('closeToTray', enable);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('close-to-tray', enable);
    });
  });

  ipcMain.on('set-font', (_, font = '') => {
    store.set('font', font);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('font', font);
    });
  });

  ipcMain.on('set-font-size', (_, fontSize = 13) => {
    store.set('fontSize', fontSize);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('font-size', fontSize);
    });
  });

  ipcMain.on('set-input-audio-device', (_, deviceId = '') => {
    store.set('inputAudioDevice', deviceId);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('input-audio-device', deviceId);
    });
  });

  ipcMain.on('set-output-audio-device', (_, deviceId = '') => {
    store.set('outputAudioDevice', deviceId);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('output-audio-device', deviceId);
    });
  });

  ipcMain.on('set-record-format', (_, format = 'wav') => {
    store.set('recordFormat', format);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('record-format', format);
    });
  });

  ipcMain.on('set-record-save-path', (_, path = app.getPath('documents')) => {
    store.set('recordSavePath', path);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('record-save-path', path);
    });
  });

  ipcMain.on('set-mix-effect', (_, enable = false) => {
    store.set('mixEffect', enable);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('mix-effect', enable);
    });
  });

  ipcMain.on('set-mix-effect-type', (_, type = '') => {
    store.set('mixEffectType', type);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('mix-effect-type', type);
    });
  });

  ipcMain.on('set-auto-mix-setting', (_, enable = false) => {
    store.set('autoMixSetting', enable);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('auto-mix-setting', enable);
    });
  });

  ipcMain.on('set-echo-cancellation', (_, enable = false) => {
    store.set('echoCancellation', enable);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('echo-cancellation', enable);
    });
  });

  ipcMain.on('set-noise-cancellation', (_, enable = false) => {
    store.set('noiseCancellation', enable);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('noise-cancellation', enable);
    });
  });

  ipcMain.on('set-microphone-amplification', (_, enable = false) => {
    store.set('microphoneAmplification', enable);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('microphone-amplification', enable);
    });
  });

  ipcMain.on('set-manual-mix-mode', (_, enable = false) => {
    store.set('manualMixMode', enable);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('manual-mix-mode', enable);
    });
  });

  ipcMain.on('set-mix-mode', (_, mode = 'all') => {
    store.set('mixMode', mode);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('mix-mode', mode);
    });
  });

  ipcMain.on('set-speaking-mode', (_, mode = 'key') => {
    store.set('speakingMode', mode);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('speaking-mode', mode);
    });
  });

  ipcMain.on('set-default-speaking-key', (_, key = '') => {
    store.set('defaultSpeakingKey', key);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('default-speaking-key', key);
    });
  });

  ipcMain.on('set-not-save-message-history', (_, enable = false) => {
    store.set('notSaveMessageHistory', enable);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('not-save-message-history', enable);
    });
  });

  ipcMain.on('set-hot-key-open-main-window', (_, key = '') => {
    store.set('hotKeyOpenMainWindow', key);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-open-main-window', key);
    });
  });

  ipcMain.on('set-hot-key-increase-volume', (_, key = '') => {
    store.set('hotKeyIncreaseVolume', key);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-increase-volume', key);
    });
  });

  ipcMain.on('set-hot-key-decrease-volume', (_, key = '') => {
    store.set('hotKeyDecreaseVolume', key);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-decrease-volume', key);
    });
  });

  ipcMain.on('set-hot-key-toggle-speaker', (_, key = '') => {
    store.set('hotKeyToggleSpeaker', key);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-toggle-speaker', key);
    });
  });

  ipcMain.on('set-hot-key-toggle-microphone', (_, key = '') => {
    store.set('hotKeyToggleMicrophone', key);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-toggle-microphone', key);
    });
  });

  ipcMain.on('set-disable-all-sound-effect', (_, enable = false) => {
    store.set('disableAllSoundEffect', enable);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('disable-all-sound-effect', enable);
    });
  });

  ipcMain.on('set-enter-voice-channel-sound', (_, enable = false) => {
    store.set('enterVoiceChannelSound', enable);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('enter-voice-channel-sound', enable);
    });
  });

  ipcMain.on('set-leave-voice-channel-sound', (_, enable = false) => {
    store.set('leaveVoiceChannelSound', enable);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('leave-voice-channel-sound', enable);
    });
  });

  ipcMain.on('set-start-speaking-sound', (_, enable = false) => {
    store.set('startSpeakingSound', enable);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('start-speaking-sound', enable);
    });
  });

  ipcMain.on('set-stop-speaking-sound', (_, enable = false) => {
    store.set('stopSpeakingSound', enable);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('stop-speaking-sound', enable);
    });
  });

  ipcMain.on('set-receive-direct-message-sound', (_, enable = false) => {
    store.set('receiveDirectMessageSound', enable);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('receive-direct-message-sound', enable);
    });
  });

  ipcMain.on('set-receive-channel-message-sound', (_, enable = false) => {
    store.set('receiveChannelMessageSound', enable);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('receive-channel-message-sound', enable);
    });
  });

  ipcMain.on('set-auto-check-for-updates', (_, enable = false) => {
    store.set('autoCheckForUpdates', enable);
    if (enable) startCheckForUpdates();
    else stopCheckForUpdates();
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('auto-check-for-updates', enable);
    });
  });

  ipcMain.on('set-update-check-interval', (_, interval = 1 * 60 * 1000) => {
    store.set('updateCheckInterval', interval);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('update-check-interval', interval);
    });
  });

  ipcMain.on('set-update-channel', (_, channel = 'latest') => {
    store.set('updateChannel', channel);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('update-channel', channel);
    });
  });

  // Disclaimer handlers
  ipcMain.on('dont-show-disclaimer-next-time', () => {
    store.set('dontShowDisclaimer', true);
  });

  // Error submission handler
  ipcMain.on('error-submit', (_, errorId: string, error: Error) => {
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
      .catch((error2) => {
        new Logger('Error').error(`(${errorId}), Failed to submit error: ${error2.message}`);
      });
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

  // Register local-resource protocol
  protocol.registerFileProtocol('local-resource', (request, callback) => {
    const url = request.url.replace('local-resource://', '');
    const filePath = path.join(app.getPath('userData'), decodeURIComponent(url));
    callback({ path: filePath });
  });

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
        const serverId = new URL(url).searchParams.get('sid');
        BrowserWindow.getAllWindows().forEach((window) => {
          window.webContents.send('deepLink', serverId);
        });
        break;
    }
  } catch (error) {
    new Logger('System').error(`Error parsing deep link: ${error}`);
  }
}

process.on('uncaughtException', (error) => {
  new Logger('System').error(`Uncaught exception: ${error}`);
});

process.on('unhandledRejection', (error) => {
  new Logger('System').error(`Unhandled rejection: ${error}`);
});
