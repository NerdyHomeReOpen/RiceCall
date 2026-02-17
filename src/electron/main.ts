import net from 'net';
import path from 'path';
import { app, BrowserWindow, ipcMain, shell, protocol } from 'electron';
import serve from 'electron-serve';
import Store from 'electron-store';
import log from 'electron-log';
import { initMain } from 'electron-audio-loopback-josh';
initMain();

import * as Types from '@/types';

import { configureAutoUpdater } from '@/electron/auto-updater';
import { configureTray } from '@/electron/tray';
import { configureDiscordRPC, clearDiscordPresence } from '@/electron/discord';
import { disconnectSocket } from '@/electron/socket';
import { registerAuthHandlers } from '@/electron/handlers/auth';
import { registerAppHandlers } from '@/electron/handlers/app';
import { registerAccountHandlers } from '@/electron/handlers/account';
import { registerDataHandlers } from '@/electron/handlers/data';
import { registerDiagnosisToolHandlers } from '@/electron/handlers/diagnosis-tool';
import { registerEnvHandlers } from '@/electron/handlers/env';
import { registerErrorHandlers } from '@/electron/handlers/error';
import { registerLogHandlers } from '@/electron/handlers/log';
import { registerPopupHandlers } from '@/electron/handlers/popup';
import { registerRecordHandlers } from '@/electron/handlers/record';
import { registerSystemHandlers } from '@/electron/handlers/system';
import { registerThemeHandlers } from '@/electron/handlers/theme';
import { registerToolbarHandlers } from '@/electron/handlers/toolbar';
import { registerWindowHandlers } from '@/electron/handlers/window';

import { POPUP_SIZES, POPUP_BEHAVIORS } from '@/configs/popup';

import { getEnv, loadEnv } from '@/env';
import { LANGUAGES } from '@/constant';
import Logger from '@/logger';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('--no-sandbox');
}

protocol.registerSchemesAsPrivileged([{ scheme: 'local-resource', privileges: { secure: true, supportFetchAPI: true, standard: true, bypassCSP: true, corsEnabled: true } }]);

export const MAIN_TITLE = 'RiceCall';
export const VERSION_TITLE = `RiceCall v${app.getVersion()}`;
export const DEV = process.argv.includes('--dev');
export const PORT = 3000;
export const PRELOAD_PATH = DEV ? path.join(app.getAppPath(), 'preload.ts') : path.join(app.getAppPath(), 'build', 'src', 'electron', 'preload.js');
export const BASE_URI = DEV ? `http://localhost:${PORT}` : 'app://-';
export const APP_ICON = process.platform === 'win32' ? path.join(app.getAppPath(), 'resources', 'icon.ico') : path.join(app.getAppPath(), 'resources', 'icon.png');

export let mainWindow: BrowserWindow | null = null;
export let authWindow: BrowserWindow | null = null;
export let popups: Record<string, BrowserWindow> = {};

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
    // Env settings
    env: 'prod',
  },
});

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

export function getRegion(): Types.LanguageKey {
  const language = app.getLocale();

  const match = LANGUAGES.find(({ code }) => code.includes(language) || language.includes(code));
  if (!match) return 'en-US';

  return match.code;
}

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
      nodeIntegration: false,
      contextIsolation: true,
      preload: PRELOAD_PATH,
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
      nodeIntegration: false,
      contextIsolation: true,
      preload: PRELOAD_PATH,
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
      nodeIntegration: false,
      contextIsolation: true,
      preload: PRELOAD_PATH,
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

export function closeAllPopups() {
  Object.values(popups).forEach((popup) => {
    if (popup && !popup.isDestroyed()) {
      popup.close();
    }
  });
  popups = {};
}

export function broadcast(channel: string, ...args: unknown[]) {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(channel, ...args);
  });
}

export function configureLogger() {
  log.initialize();
  log.transports.file.level = 'info';
  log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'main.log');
  log.transports.file.maxSize = 5 * 1024 * 1024;
  log.transports.remote.url = `${getEnv().API_URL}/logs`;
  Object.assign(console, log.functions);
  log.transports.file.format = '[{level}] [{y}-{m}-{d} {h}:{i}:{s}] {text}';
}

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

app.on('ready', async () => {
  loadEnv(store.get('env', 'prod'));

  configureAutoUpdater();
  configureDiscordRPC();
  configureTray();
  configureLogger();

  registerAccountHandlers();
  registerAppHandlers();
  registerAuthHandlers();
  registerDataHandlers();
  registerDiagnosisToolHandlers();
  registerEnvHandlers();
  registerErrorHandlers();
  registerLogHandlers();
  registerPopupHandlers();
  registerRecordHandlers();
  registerSystemHandlers();
  registerThemeHandlers();
  registerToolbarHandlers();
  registerWindowHandlers();

  if (!store.get('dontShowDisclaimer')) createPopup('aboutus', 'aboutUs');
  createAuthWindow().then((authWindow) => authWindow.showInactive());
  createMainWindow().then((mainWindow) => mainWindow.hide());

  ipcMain.on('exit', () => {
    app.exit();
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

process.on('uncaughtException', (e) => {
  const error = e instanceof Error ? e : new Error('Unknown error');
  new Logger('System').error(`Uncaught exception: ${error.message}`);
});

process.on('unhandledRejection', (e) => {
  const error = e instanceof Error ? e : new Error('Unknown error');
  new Logger('System').error(`Unhandled rejection: ${error.message}`);
});
