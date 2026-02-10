import fs from 'fs';
import net from 'net';
import path from 'path';
import { Readable } from 'stream';
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
import { Presence } from 'discord-rpc';
import * as Types from '@/types';
import { initMainI18n, t } from '@/electron/i18n';
import { clearDiscordPresence, configureDiscordRPC, updateDiscordPresence } from '@/electron/discord';
import { getEnv as env, loadEnv } from '@/env';
import { removeToken, setToken } from '@/auth.token';
import * as Auth from '@/auth.service';
import * as Loader from '@/loader';
import Logger from '@/logger';
import { LANGUAGES } from '@/constant';
import { POPUP_SIZES, POPUP_BEHAVIORS } from '@/popup.config';
import { initNetworkDiagnosisTool } from '@/electron/network-diagnosis-tool';
import registerDataHandlers from '@/electron/handlers/dataHandlers';
import registerAccountHandlers from '@/electron/handlers/accountHandlers';
import registerToolbarHandlers from '@/electron/handlers/toolbarHandlers';
import registerSystemHandlers from '@/electron/handlers/systemHandlers';

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

export const store = new Store<Types.StoreType>({
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
export function setAutoLaunch(enable: boolean) {
  try {
    app.setLoginItemSettings({
      openAtLogin: enable,
      openAsHidden: false,
    });
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    new Logger('System').error(`Set auto launch error: ${error.message}`);
  }
}

export function isAutoLaunchEnabled(): boolean {
  try {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    new Logger('System').error(`Get auto launch error: ${error.message}`);
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
export let mainWindow: BrowserWindow | null = null;
export let authWindow: BrowserWindow | null = null;
export let popups: Record<string, BrowserWindow> = {};

export async function createMainWindow(title?: string): Promise<BrowserWindow> {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.showInactive();
    mainWindow.setAlwaysOnTop(true);
    mainWindow.flashFrame(true);
    return mainWindow;
  }

  if (DEV) {
    waitForPort(PORT).catch((e) => {
      const error = e instanceof Error ? e : new Error('Unknown error');
      new Logger('System').error(`Cannot connect to Next server: ${error.message}`);
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
    waitForPort(PORT).catch((e) => {
      const error = e instanceof Error ? e : new Error('Unknown error');
      new Logger('System').error(`Cannot connect to Next server: ${error.message}`);
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createPopup(type: Types.PopupType, id: string, initialData: any = {}, force = true, title?: string): Promise<BrowserWindow> {
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
    waitForPort(PORT).catch((e) => {
      const error = e instanceof Error ? e : new Error('Unknown error');
      new Logger('System').error(`Cannot connect to Next server: ${error.message}`);
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

// Windows Operation
export function batchWindowsOperation(operation: (win: BrowserWindow) => void) {
  BrowserWindow.getAllWindows().forEach(operation);
}

export function broadcast(channel: string, ...args: unknown[]) {
  batchWindowsOperation((window) => {
    window.webContents.send(channel, ...args);
  });
}

// Auto Updater
export async function checkForUpdates(force = false) {
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
    const result = await autoUpdater.checkForUpdates().catch((e) => {
      const error = e instanceof Error ? e : new Error('Unknown error');
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
  const result = await autoUpdater.checkForUpdates().catch((e) => {
    const error = e instanceof Error ? e : new Error('Unknown error');
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
      .catch((e) => {
        const error = e instanceof Error ? e : new Error('Unknown error');
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
      .catch((e) => {
        const error = e instanceof Error ? e : new Error('Unknown error');
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
export let tray: Tray | null = null;

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
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Unknown error');
      new Logger('System').error(`Cannot load React DevTools: ${error.message}`);
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
      broadcast('heartbeat', { seq: ack.seq, latency });
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
            .catch((e) => {
              const error = e instanceof Error ? e : new Error('Unknown error');
              new Logger('Socket').error(`socket.emit ${event} error: ${error.message}`);
              resolve({ ok: false, error: error.message });
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
        broadcast(event, ...args);
      });
    });

    sendHeartbeat();
    if (interval) clearInterval(interval);
    interval = setInterval(sendHeartbeat, 30000);

    new Logger('Socket').info(`Socket connected`);

    broadcast('connect', null);
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

    broadcast('disconnect', reason);
  });

  socket.on('connect_error', (e) => {
    const error = e instanceof Error ? e : new Error('Unknown error');
    new Logger('Socket').error(`Socket connect error: ${error.message}`);

    broadcast('connect_error', e);
  });

  socket.on('reconnect', (attemptNumber) => {
    new Logger('Socket').info(`Socket reconnected, attempt number: ${attemptNumber}`);

    broadcast('reconnect', attemptNumber);
  });

  socket.on('reconnect_error', (e) => {
    const error = e instanceof Error ? e : new Error('Unknown error');
    new Logger('Socket').error(`Socket reconnect error: ${error.message}`);

    broadcast('reconnect_error', e);
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
    .catch((e) => {
      const error = e instanceof Error ? e : new Error('Unknown error');
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
  return await Auth.register(formData).catch((e) => {
    const error = e instanceof Error ? e : new Error('Unknown error');
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
    .catch((e) => {
      const error = e instanceof Error ? e : new Error('Unknown error');
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

  if (!store.get('dontShowDisclaimer')) createPopup('aboutus', 'aboutUs');
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
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Unknown error');
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
  registerDataHandlers();

  // Accounts handlers
  registerAccountHandlers();

  // Toolbar handlers
  registerToolbarHandlers();

  // Language handlers
  ipcMain.on('get-language', (event) => {
    event.returnValue = store.get('language');
  });

  ipcMain.on('set-language', (_, language: Types.LanguageKey = getRegion()) => {
    store.set('language', language);
    initMainI18n(language);
    setTrayDetail();
    broadcast('language', language);
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
    broadcast(
      'custom-themes',
      Array.from({ length: 7 }, (_, i) => customThemes[i] ?? {}),
    );
  });

  ipcMain.on('delete-custom-theme', (_, index: number) => {
    const customThemes = store.get('customThemes');
    // Keep total 7 themes
    customThemes.splice(index, 1);
    store.set('customThemes', customThemes);
    broadcast(
      'custom-themes',
      Array.from({ length: 7 }, (_, i) => customThemes[i] ?? {}),
    );
  });

  ipcMain.on('get-current-theme', (event) => {
    event.returnValue = store.get('currentTheme');
  });

  ipcMain.on('set-current-theme', (_, theme: Types.Theme) => {
    store.set('currentTheme', theme);
    broadcast('current-theme', theme);
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
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Unknown error');
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ipcMain.on('open-popup', async (_, type: Types.PopupType, id: string, initialData: any, force = true) => {
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
  });

  ipcMain.on('close-popup', (_, id: string) => {
    if (popups[id] && !popups[id].isDestroyed()) {
      popups[id].close();
    }
  });

  ipcMain.on('close-all-popups', () => {
    closePopups();
  });

  ipcMain.on('popup-submit', (_, to: string, data: unknown | null = null) => {
    broadcast('popup-submit', to, data);
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
  ipcMain.on('update-discord-presence', (_, updatePresence: Presence) => {
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
    broadcast('server', server);
  });

  // System settings handlers
  registerSystemHandlers();

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
      .catch((e) => {
        const error = e instanceof Error ? e : new Error('Unknown error');
        new Logger('Error').error(`(${errorId}), Failed to submit error: ${error.message}`);
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
        broadcast('deepLink', serverId);
        break;
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    new Logger('System').error(`Error parsing deep link: ${error.message}`);
  }
}

process.on('uncaughtException', (e) => {
  const error = e instanceof Error ? e : new Error('Unknown error');
  new Logger('System').error(`Uncaught exception: ${error.message}`);
});

process.on('unhandledRejection', (e) => {
  const error = e instanceof Error ? e : new Error('Unknown error');
  new Logger('System').error(`Unhandled rejection: ${error.message}`);
});
