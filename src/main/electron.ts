import path from 'path';
import { app, BrowserWindow, ipcMain, shell, protocol, nativeImage, Menu, Tray, dialog, net } from 'electron';
import { pathToFileURL } from 'url';
import ElectronUpdater, { ProgressInfo, UpdateInfo } from 'electron-updater';
const { autoUpdater } = ElectronUpdater;
import serve from 'electron-serve';
import Store from 'electron-store';
import log from 'electron-log';
import { initMain } from 'electron-audio-loopback-josh';
initMain();

import type * as Types from '@/types';

import Logger from '@/logger';

import Env from '@/env';

import { i18nReady, t } from '@/i18n';

import { LANGUAGES } from '@/constants';

import { registerAccountHandlers } from '@/main/accounts/electron';
import { registerAppHandlers } from '@/main/app/electron';
import { registerAuthHandlers, autoLogin, logout } from '@/main/auth/electron';
import { registerCustomThemesHandlers } from '@/main/customThemes/electron';
import { registerDataHandlers } from '@/main/data/electron';
import { registerDiscordRPCHandlers, configureDiscordRPC, clearDiscordPresence } from '@/main/discord/electron';
import { registerEnvHandlers } from '@/main/env/electron';
import { registerErrorHandlers } from '@/main/error/electron';
import { registerNetworkHandlers } from '@/main/network/electron';
import { registerPopupHandlers } from '@/main/popup/electron';
import { registerRecordHandlers } from '@/main/record/electron';
import { registerSocketHandlers, disconnectSocket } from '@/main/socket/electron';
import { registerStoreStateHandlers } from '@/main/storeState/electron';
import { registerSystemHandlers } from '@/main/systemSettings/electron';
import { registerTrayHandlers } from '@/main/tray/electron';
import { registerWindowHandlers } from '@/main/window/electron';

import { POPUP_SIZES, POPUP_BEHAVIORS } from '@/configs/popup';

export const PROFILE = (() => {
  const arg = process.argv.find((a) => a.startsWith('--profile='));
  const value = arg ? arg.slice('--profile='.length).trim() : '';
  return value || 'default';
})();

if (PROFILE !== 'default') {
  app.setPath('userData', path.join(app.getPath('appData'), `RiceCall-${PROFILE}`));
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_, argv) => {
    const url = argv.find((arg) => arg.startsWith('ricecall://'));
    if (url) openDeepLink(url);
  });
}

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('--no-sandbox');
}

protocol.registerSchemesAsPrivileged([{ scheme: 'local-resource', privileges: { secure: true, supportFetchAPI: true, standard: true, bypassCSP: true, corsEnabled: true } }]);

const PROFILE_SUFFIX = PROFILE === 'default' ? '' : ` (${PROFILE})`;
export const MAIN_TITLE = `RiceCall${PROFILE_SUFFIX}`;
export const VERSION_TITLE = `RiceCall v${app.getVersion()}${PROFILE_SUFFIX}`;
export const DEV = process.argv.includes('--dev');
export const PORT = 3000;
export const PRELOAD_PATH = DEV ? path.join(app.getAppPath(), 'preload.ts') : path.join(app.getAppPath(), 'build', 'src', 'main', 'preload.js');
export const BASE_URI = DEV ? `http://localhost:${PORT}` : 'app://-';
export const APP_ICON = DEV
  ? path.join(app.getAppPath(), '..', '..', 'resources', 'icon.ico')
  : process.platform === 'win32'
    ? path.join(app.getAppPath(), 'resources', 'icon.ico')
    : path.join(app.getAppPath(), 'resources', 'icon.png');
export const APP_TRAY_ICON = {
  gray: DEV
    ? path.join(app.getAppPath(), '..', '..', 'resources', 'tray_gray.ico')
    : process.platform === 'win32'
      ? path.join(app.getAppPath(), 'resources', 'tray_gray.ico')
      : path.join(app.getAppPath(), 'resources', 'tray_gray.png'),
  normal: DEV
    ? path.join(app.getAppPath(), '..', '..', 'resources', 'tray.ico')
    : process.platform === 'win32'
      ? path.join(app.getAppPath(), 'resources', 'tray.ico')
      : path.join(app.getAppPath(), 'resources', 'tray.png'),
};

export let tray: Tray | null = null;
export let mainWindow: BrowserWindow | null = null;
export let authWindow: BrowserWindow | null = null;
export let popups: Record<string, BrowserWindow> = {};

let _isLogin: boolean = false;
let _isUpdateNotified: boolean = false;
let _updateCheckInterval: NodeJS.Timeout | null = null;

const appServe = serve({ directory: path.join(app.getAppPath(), 'out') });

async function openDeepLink(url: string) {
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

function openAppWindow() {
  if (_isLogin) mainWindow?.show();
  else authWindow?.show();
}

export function setTrayDetail(isLogin?: boolean) {
  if (!tray) return;

  if (isLogin !== undefined) _isLogin = isLogin;

  const trayIconPath = _isLogin ? APP_TRAY_ICON.normal : APP_TRAY_ICON.gray;
  const contextMenu = Menu.buildFromTemplate([
    {
      id: 'open-main-window',
      label: t('system:open-main-window'),
      type: 'normal',
      click: () => openAppWindow(),
    },
    { type: 'separator' },
    {
      id: 'logout',
      label: t('system:logout'),
      type: 'normal',
      enabled: _isLogin,
      click: () => logout(),
    },
    {
      id: 'exit',
      label: t('system:exit'),
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
  tray.on('click', openAppWindow);

  setTrayDetail();
}

export async function checkForUpdates(force = false) {
  if (_isUpdateNotified && !force) return;

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

export function startCheckForUpdates() {
  if (_updateCheckInterval) clearInterval(_updateCheckInterval);
  _updateCheckInterval = setInterval(checkForUpdates, store.get('updateCheckInterval'));
  checkForUpdates();
}

export function stopCheckForUpdates() {
  if (_updateCheckInterval) clearInterval(_updateCheckInterval);
  _updateCheckInterval = null;
}

export async function configureAutoUpdater() {
  autoUpdater.on('update-available', (info: UpdateInfo) => {
    new Logger('System').info(`Update available: ${info.version}`);

    dialog
      .showMessageBox({
        type: 'info',
        title: t('system:update-available'),
        message: t('system:update-available-message', { version: info.version, releaseDate: new Date(info.releaseDate).toLocaleDateString() }),
        buttons: [t('system:download-update'), t('system:cancel')],
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
    _isUpdateNotified = true;
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
        title: t('system:update-downloaded'),
        message: t('system:update-downloaded-message', { version: info.version }),
        buttons: [t('system:install-update'), t('system:install-after-quit'), t('system:cancel')],
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
    _isUpdateNotified = false;
  });

  if (store.get('autoCheckForUpdates')) startCheckForUpdates();
}

export function configureLogger() {
  log.initialize();
  log.transports.file.level = 'info';
  log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'main.log');
  log.transports.file.maxSize = 5 * 1024 * 1024;
  log.transports.remote.url = `${Env.get().API_URL}/logs`;
  Object.assign(console, log.functions);
  log.transports.file.format = '[{level}] [{y}-{m}-{d} {h}:{i}:{s}] {text}';
}

export const store = new Store<Types.StoreType>({
  defaults: {
    accounts: {},
    language: getLanguage(),
    customThemes: [],
    currentTheme: null,
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
    speakingMode: 'auto',
    defaultSpeakingKey: '',
    notSaveMessageHistory: true,
    hotKeyOpenMainWindow: '',
    hotKeyScreenshot: '',
    hotKeyIncreaseVolume: '',
    hotKeyDecreaseVolume: '',
    hotKeyToggleSpeaker: '',
    hotKeyToggleMicrophone: '',
    disableAllSoundEffect: false,
    enterVoiceChannelSound: true,
    leaveVoiceChannelSound: true,
    startSpeakingSound: true,
    stopSpeakingSound: true,
    receiveDirectMessageSound: true,
    receiveChannelMessageSound: true,
    dontShowDisclaimer: false,
    autoCheckForUpdates: true,
    updateCheckInterval: 1 * 60 * 1000,
    updateChannel: 'latest',
    env: 'prod',
    token: '',
  },
});

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

export function getLanguage(): Types.LanguageKey {
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

app.on('ready', async () => {
  Env.load(store.get('env', 'prod'));

  await i18nReady;

  protocol.handle('local-resource', (request) => {
    const url = request.url.replace('local-resource://', '');
    const filePath = path.join(app.getPath('userData'), decodeURIComponent(url));
    return net.fetch(pathToFileURL(filePath).toString());
  });

  const protocolClient = process.execPath;
  const args = !app.isPackaged && process.platform === 'win32' && process.argv[1] ? [path.resolve(process.argv[1])] : undefined;
  app.setAsDefaultProtocolClient('ricecall', app.isPackaged ? undefined : protocolClient, args);

  if (PROFILE === 'default') {
    configureAutoUpdater();
    configureDiscordRPC();
  }
  configureTray();
  configureLogger();

  registerAccountHandlers();
  registerAppHandlers();
  registerAuthHandlers();
  registerCustomThemesHandlers();
  registerDataHandlers();
  registerDiscordRPCHandlers();
  registerEnvHandlers();
  registerErrorHandlers();
  registerNetworkHandlers();
  registerPopupHandlers();
  registerRecordHandlers();
  registerSocketHandlers();
  registerStoreStateHandlers();
  registerSystemHandlers();
  registerTrayHandlers();
  registerWindowHandlers();

  if (!store.get('dontShowDisclaimer')) createPopup('aboutus', 'aboutUs');
  createAuthWindow().then((authWindow) => authWindow.showInactive());
  createMainWindow().then((mainWindow) => mainWindow.hide());

  const token = store.get('token');
  if (token) autoLogin(token);

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
  openDeepLink(url);
});

process.on('uncaughtException', (e) => {
  const error = e instanceof Error ? e : new Error('Unknown error');
  new Logger('System').error(`Uncaught exception: ${error.message}`);
});

process.on('unhandledRejection', (e) => {
  const error = e instanceof Error ? e : new Error('Unknown error');
  new Logger('System').error(`Unhandled rejection: ${error.message}`);
});
