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

import Logger from '@/utils/logger';
import Env from '@/utils/env';

import { i18nReady, t } from '@/i18n';

import { pickLocale } from '@/types/locales';

import { registerAccountHandlers } from '@/main/accounts/electron';
import { registerApiHandlers } from '@/main/api/electron';
import { registerAppHandlers } from '@/main/app/electron';
import { registerAuthHandlers, autoLogin, logout } from '@/main/auth/electron';
import { registerCustomThemesHandlers } from '@/main/custom-themes/electron';
import { registerDiscordRPCHandlers, configureDiscordRPC, clearDiscordPresence } from '@/main/discord/electron';
import { registerEnvHandlers } from '@/main/env/electron';
import { registerErrorHandlers } from '@/main/error/electron';
import { registerNetworkHandlers } from '@/main/network/electron';
import { registerPopupHandlers } from '@/main/popup/electron';
import { registerRecordHandlers } from '@/main/record/electron';
import { registerSocketHandlers, disconnectSocket } from '@/main/socket/electron';
import { registerStoreStateHandlers } from '@/main/store-state/electron';
import { registerSystemHandlers } from '@/main/system-settings/electron';
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

function getIconPath(name: string): string {
  if (DEV) return path.join(app.getAppPath(), '..', '..', 'resources', `${name}.ico`);
  const extension = process.platform === 'win32' ? 'ico' : 'png';
  return path.join(app.getAppPath(), 'resources', `${name}.${extension}`);
}

export const APP_ICON = getIconPath('icon');
export const APP_TRAY_ICON = {
  gray: getIconPath('tray_gray'),
  normal: getIconPath('tray'),
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
        const serverDisplayId = new URL(url).searchParams.get('serverDisplayId');
        broadcast('deepLink', serverDisplayId);
        break;
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    new Logger('SYSTEM').error(`Error parsing deep link: ${error.message}`);
  }
}

function openAppWindow() {
  if (_isLogin) mainWindow?.show();
  else authWindow?.show();
}

export function setTrayDetail(isLogin?: boolean): void {
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

export function configureTray(): void {
  if (tray) tray.destroy();

  const trayIconPath = APP_TRAY_ICON.gray;

  tray = new Tray(nativeImage.createFromPath(trayIconPath));

  tray.setToolTip(VERSION_TITLE);
  tray.on('click', openAppWindow);

  setTrayDetail();
}

export async function checkForUpdates(force = false): Promise<ElectronUpdater.UpdateCheckResult | null> {
  if (_isUpdateNotified && !force) return null;

  if (DEV) {
    autoUpdater.forceDevUpdateConfig = true;
    autoUpdater.updateConfigPath = path.join(app.getAppPath(), 'dev-app-update.yml');
  }

  const channel = store.get('updateChannel');
  new Logger('SYSTEM').info(`Checking for updates, channel: ${channel}`);

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
      new Logger('SYSTEM').error(`Cannot check for updates in dev channel: ${error.message}`);
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
    new Logger('SYSTEM').error(`Cannot check for updates in latest channel: ${error.message}`);
  });
  if (result?.isUpdateAvailable) return result;
  return null;
}

export function startCheckForUpdates(): void {
  if (_updateCheckInterval) clearInterval(_updateCheckInterval);
  _updateCheckInterval = setInterval(checkForUpdates, store.get('updateCheckInterval'));
  checkForUpdates();
}

export function stopCheckForUpdates(): void {
  if (_updateCheckInterval) clearInterval(_updateCheckInterval);
  _updateCheckInterval = null;
}

export async function configureAutoUpdater(): Promise<void> {
  autoUpdater.on('update-available', (info: UpdateInfo) => {
    new Logger('SYSTEM').info(`Update available: ${info.version}`);

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
        new Logger('SYSTEM').error(`Cannot show update dialog: ${error.message}`);
      });
    _isUpdateNotified = true;
  });

  autoUpdater.on('update-not-available', () => {
    new Logger('SYSTEM').info(`Is latest version`);
  });

  autoUpdater.on('download-progress', (progressInfo: ProgressInfo) => {
    let message = `${progressInfo.bytesPerSecond}`;
    message = `${message} - ${progressInfo.percent}%`;
    message = `${message} (${progressInfo.transferred}/${progressInfo.total})`;
    new Logger('SYSTEM').info(`Downloading update: ${message}`);
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    new Logger('SYSTEM').info(`Update downloaded: ${info.version}`);

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
        new Logger('SYSTEM').error(`Cannot show update dialog: ${error.message}`);
      });
    _isUpdateNotified = false;
  });

  if (store.get('isAutoCheckForUpdatesEnabled')) startCheckForUpdates();
}

export function configureLogger(): void {
  log.initialize();
  log.transports.file.level = 'info';
  log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'main.log');
  log.transports.file.maxSize = 5 * 1024 * 1024;
  log.transports.remote.url = `${Env.get().MAIN_SERVICE_URL}/logs`;
  Object.assign(console, log.functions);
  log.transports.file.format = '[{level}] [{y}-{m}-{d} {h}:{i}:{s}] {text}';
}

export const store = new Store<Types.StoreType>({
  defaults: {
    accounts: {},
    language: getLanguage(),
    customThemes: [],
    currentTheme: null,
    isAutoLoginEnabled: false,
    isAutoLaunchEnabled: false,
    isAlwaysOnTop: false,
    closeToTray: false,
    isStatusAutoIdleEnabled: false,
    statusAutoIdleMinutes: 10,
    isStatusAutoDndEnabled: false,
    channelUIMode: 'classic',
    font: '',
    fontSize: 13,
    inputAudioDevice: '',
    outputAudioDevice: '',
    recordFormat: 'wav',
    recordSavePath: app.getPath('documents'),
    isMixEffectEnabled: false,
    mixEffectType: '',
    isAutoMixSettingEnabled: false,
    isEchoCancellationEnabled: false,
    isNoiseCancellationEnabled: false,
    isMicrophoneAmplificationEnabled: false,
    isManualMixMode: false,
    mixMode: 'all',
    speakingMode: 'auto',
    defaultSpeakingKey: '',
    disableMessageHistory: true,
    hotKeyOpenMainWindow: '',
    hotKeyScreenshot: '',
    hotKeyIncreaseVolume: '',
    hotKeyDecreaseVolume: '',
    hotKeyToggleSpeaker: '',
    hotKeyToggleMicrophone: '',
    disableAllSoundEffect: false,
    isEnterVoiceChannelSoundEnabled: true,
    isLeaveVoiceChannelSoundEnabled: true,
    isStartSpeakingSoundEnabled: true,
    isStopSpeakingSoundEnabled: true,
    isReceiveDirectMessageSoundEnabled: true,
    isReceiveChannelMessageSoundEnabled: true,
    isDisclaimerHidden: false,
    isAutoCheckForUpdatesEnabled: true,
    updateCheckInterval: 1 * 60 * 1000,
    updateChannel: 'latest',
    env: 'prod',
    token: '',
  },
});

export function setIsAutoLaunchEnabled(enable: boolean): void {
  try {
    app.setLoginItemSettings({
      openAtLogin: enable,
      openAsHidden: false,
    });
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    new Logger('SYSTEM').error(`Set auto launch error: ${error.message}`);
  }
}

export function isAutoLaunchEnabled(): boolean {
  try {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    new Logger('SYSTEM').error(`Get auto launch error: ${error.message}`);
    return false;
  }
}

export function getSettings(): Types.SystemSettings {
  return {
    isAutoLoginEnabled: store.get('isAutoLoginEnabled'),
    isAutoLaunchEnabled: isAutoLaunchEnabled(),
    isAlwaysOnTop: store.get('isAlwaysOnTop'),
    isStatusAutoIdleEnabled: store.get('isStatusAutoIdleEnabled'),
    statusAutoIdleMinutes: store.get('statusAutoIdleMinutes'),
    isStatusAutoDndEnabled: store.get('isStatusAutoDndEnabled'),
    channelUIMode: store.get('channelUIMode'),
    closeToTray: store.get('closeToTray'),
    font: store.get('font'),
    fontSize: store.get('fontSize'),
    inputAudioDevice: store.get('inputAudioDevice'),
    outputAudioDevice: store.get('outputAudioDevice'),
    recordFormat: store.get('recordFormat'),
    recordSavePath: store.get('recordSavePath'),
    isMixEffectEnabled: store.get('isMixEffectEnabled'),
    mixEffectType: store.get('mixEffectType'),
    isAutoMixSettingEnabled: store.get('isAutoMixSettingEnabled'),
    isEchoCancellationEnabled: store.get('isEchoCancellationEnabled'),
    isNoiseCancellationEnabled: store.get('isNoiseCancellationEnabled'),
    isMicrophoneAmplificationEnabled: store.get('isMicrophoneAmplificationEnabled'),
    isManualMixMode: store.get('isManualMixMode'),
    mixMode: store.get('mixMode'),
    speakingMode: store.get('speakingMode'),
    defaultSpeakingKey: store.get('defaultSpeakingKey'),
    disableMessageHistory: store.get('disableMessageHistory'),
    hotKeyOpenMainWindow: store.get('hotKeyOpenMainWindow'),
    hotKeyScreenshot: store.get('hotKeyScreenshot'),
    hotKeyIncreaseVolume: store.get('hotKeyIncreaseVolume'),
    hotKeyDecreaseVolume: store.get('hotKeyDecreaseVolume'),
    hotKeyToggleSpeaker: store.get('hotKeyToggleSpeaker'),
    hotKeyToggleMicrophone: store.get('hotKeyToggleMicrophone'),
    disableAllSoundEffect: store.get('disableAllSoundEffect'),
    isEnterVoiceChannelSoundEnabled: store.get('isEnterVoiceChannelSoundEnabled'),
    isLeaveVoiceChannelSoundEnabled: store.get('isLeaveVoiceChannelSoundEnabled'),
    isStartSpeakingSoundEnabled: store.get('isStartSpeakingSoundEnabled'),
    isStopSpeakingSoundEnabled: store.get('isStopSpeakingSoundEnabled'),
    isReceiveDirectMessageSoundEnabled: store.get('isReceiveDirectMessageSoundEnabled'),
    isReceiveChannelMessageSoundEnabled: store.get('isReceiveChannelMessageSoundEnabled'),
    isAutoCheckForUpdatesEnabled: store.get('isAutoCheckForUpdatesEnabled'),
    updateCheckInterval: store.get('updateCheckInterval'),
    updateChannel: store.get('updateChannel'),
  };
}

export function getLanguage(): Types.Locale {
  return pickLocale(app.getPreferredSystemLanguages().length ? app.getPreferredSystemLanguages() : [app.getLocale()]);
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

export async function createPopup(type: Types.PopupType, id: string, initialData: unknown = {}, force = true, title?: string): Promise<BrowserWindow> {
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

export function closeAllPopups(): void {
  Object.values(popups).forEach((popup) => {
    if (popup && !popup.isDestroyed()) {
      popup.close();
    }
  });
  popups = {};
}

export function broadcast(channel: string, ...args: unknown[]): void {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(channel, ...args);
  });
}

app.on('ready', async () => {
  await Env.load(store.get('env', 'prod'));
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
  registerApiHandlers();
  registerAppHandlers();
  registerAuthHandlers();
  registerCustomThemesHandlers();
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

  if (!store.get('isDisclaimerHidden')) createPopup('aboutus', 'aboutUs');
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
  new Logger('SYSTEM').error(`Uncaught exception: ${error.message}`);
});

process.on('unhandledRejection', (e) => {
  const error = e instanceof Error ? e : new Error('Unknown error');
  new Logger('SYSTEM').error(`Unhandled rejection: ${error.message}`);
});
