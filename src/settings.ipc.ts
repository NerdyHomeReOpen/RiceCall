import { app, BrowserWindow, IpcMain } from 'electron';
import Store from 'electron-store';
import fontList from 'font-list';
import * as Types from './types';

export interface SettingsDependencies {
  store: Store<Types.StoreType>;
  setAutoLaunch: (enable: boolean) => void;
  isAutoLaunchEnabled: () => boolean;
  startCheckForUpdates: () => void;
  stopCheckForUpdates: () => void;
  getSettings: () => Types.SystemSettings;
}

export function registerSettingsHandlers(ipcMain: IpcMain, deps: SettingsDependencies) {
  const { store, setAutoLaunch, isAutoLaunchEnabled, startCheckForUpdates, stopCheckForUpdates, getSettings } = deps;

  // System settings handlers
  // #web-sharable {Use createSettingsHandlers with Electron Context}
  ipcMain.on('get-system-settings', (event) => {
    event.returnValue = getSettings();
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-auto-login', (event) => {
    event.returnValue = store.get('autoLogin');
  });

  // #electron-only {Depends on isAutoLaunchEnabled logic}
  ipcMain.on('get-auto-launch', (event) => {
    event.returnValue = isAutoLaunchEnabled();
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-always-on-top', (event) => {
    event.returnValue = store.get('alwaysOnTop');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-status-auto-idle', (event) => {
    event.returnValue = store.get('statusAutoIdle');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-status-auto-idle-minutes', (event) => {
    event.returnValue = store.get('statusAutoIdleMinutes');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-status-auto-dnd', (event) => {
    event.returnValue = store.get('statusAutoDnd');
  });

  // #web-sharable {Use createSettingsHandlers - Note: Need to align naming convention channelUIMode vs channel-ui-mode}
  ipcMain.on('get-channel-ui-mode', (event) => {
    event.returnValue = store.get('channelUIMode');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-close-to-tray', (event) => {
    event.returnValue = store.get('closeToTray');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-font', (event) => {
    event.returnValue = store.get('font');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-font-size', (event) => {
    event.returnValue = store.get('fontSize');
  });

  // #electron-only {Depends on font-list native module}
  ipcMain.on('get-font-list', async (event) => {
    const fonts = await fontList.getFonts();
    event.returnValue = fonts;
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-input-audio-device', (event) => {
    event.returnValue = store.get('inputAudioDevice');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-output-audio-device', (event) => {
    event.returnValue = store.get('outputAudioDevice');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-record-format', (event) => {
    event.returnValue = store.get('recordFormat');
  });

  // #electron-only {Depends on app.getPath for default, though getting stored value is sharable, the setter isn't}
  ipcMain.on('get-record-save-path', (event) => {
    event.returnValue = store.get('recordSavePath');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-mix-effect', (event) => {
    event.returnValue = store.get('mixEffect');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-mix-effect-type', (event) => {
    event.returnValue = store.get('mixEffectType');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-auto-mix-setting', (event) => {
    event.returnValue = store.get('autoMixSetting');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-echo-cancellation', (event) => {
    event.returnValue = store.get('echoCancellation');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-noise-cancellation', (event) => {
    event.returnValue = store.get('noiseCancellation');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-microphone-amplification', (event) => {
    event.returnValue = store.get('microphoneAmplification');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-manual-mix-mode', (event) => {
    event.returnValue = store.get('manualMixMode');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-mix-mode', (event) => {
    event.returnValue = store.get('mixMode');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-speaking-mode', (event) => {
    event.returnValue = store.get('speakingMode');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-default-speaking-key', (event) => {
    event.returnValue = store.get('defaultSpeakingKey');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-not-save-message-history', (event) => {
    event.returnValue = store.get('notSaveMessageHistory');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-hot-key-open-main-window', (event) => {
    event.returnValue = store.get('hotKeyOpenMainWindow');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-hot-key-increase-volume', (event) => {
    event.returnValue = store.get('hotKeyIncreaseVolume');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-hot-key-decrease-volume', (event) => {
    event.returnValue = store.get('hotKeyDecreaseVolume');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-hot-key-toggle-speaker', (event) => {
    event.returnValue = store.get('hotKeyToggleSpeaker');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-hot-key-toggle-microphone', (event) => {
    event.returnValue = store.get('hotKeyToggleMicrophone');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-disable-all-sound-effect', (event) => {
    event.returnValue = store.get('disableAllSoundEffect');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-enter-voice-channel-sound', (event) => {
    event.returnValue = store.get('enterVoiceChannelSound');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-leave-voice-channel-sound', (event) => {
    event.returnValue = store.get('leaveVoiceChannelSound');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-start-speaking-sound', (event) => {
    event.returnValue = store.get('startSpeakingSound');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-stop-speaking-sound', (event) => {
    event.returnValue = store.get('stopSpeakingSound');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-receive-direct-message-sound', (event) => {
    event.returnValue = store.get('receiveDirectMessageSound');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-receive-channel-message-sound', (event) => {
    event.returnValue = store.get('receiveChannelMessageSound');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-auto-check-for-updates', (event) => {
    event.returnValue = store.get('autoCheckForUpdates');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-update-check-interval', (event) => {
    event.returnValue = store.get('updateCheckInterval');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('get-update-channel', (event) => {
    event.returnValue = store.get('updateChannel');
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-auto-login', (_, enable) => {
    store.set('autoLogin', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('auto-login', enable);
    });
  });

  // #electron-only {Depends on setAutoLaunch helper}
  ipcMain.on('set-auto-launch', (_, enable) => {
    setAutoLaunch(enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('auto-launch', enable);
    });
  });

  // #electron-only {Depends on window.setAlwaysOnTop behavior}
  ipcMain.on('set-always-on-top', (_, enable) => {
    store.set('alwaysOnTop', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.setAlwaysOnTop(enable);
      window.webContents.send('always-on-top', enable);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-status-auto-idle', (_, enable) => {
    store.set('statusAutoIdle', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('status-auto-idle', enable);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-status-auto-idle-minutes', (_, value) => {
    store.set('statusAutoIdleMinutes', value ?? 10);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('status-auto-idle-minutes', value);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-status-auto-dnd', (_, enable) => {
    store.set('statusAutoDnd', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('status-auto-dnd', enable);
    });
  });

  // #web-sharable {Use createSettingsHandlers - Note: Align naming}
  ipcMain.on('set-channel-ui-mode', (_, mode) => {
    store.set('channelUIMode', mode ?? 'classic');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('channel-ui-mode', mode);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-close-to-tray', (_, enable) => {
    store.set('closeToTray', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('close-to-tray', enable);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-font', (_, font) => {
    store.set('font', font ?? '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('font', font);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-font-size', (_, fontSize) => {
    store.set('fontSize', fontSize ?? 13);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('font-size', fontSize);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-input-audio-device', (_, deviceId) => {
    store.set('inputAudioDevice', deviceId ?? '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('input-audio-device', deviceId);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-output-audio-device', (_, deviceId) => {
    store.set('outputAudioDevice', deviceId ?? '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('output-audio-device', deviceId);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-record-format', (_, format) => {
    store.set('recordFormat', format ?? 'wav');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('record-format', format);
    });
  });

  // #electron-only {Depends on app.getPath default if value is null? No, just setter. But logic might be expanded}
  // Actually, setting logic is simple storage. So it IS sharable if we ignore validation.
  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-record-save-path', (_, path) => {
    store.set('recordSavePath', path ?? app.getPath('documents'));
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('record-save-path', path);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-mix-effect', (_, enable) => {
    store.set('mixEffect', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('mix-effect', enable);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-mix-effect-type', (_, type) => {
    store.set('mixEffectType', type ?? '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('mix-effect-type', type);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-auto-mix-setting', (_, enable) => {
    store.set('autoMixSetting', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('auto-mix-setting', enable);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-echo-cancellation', (_, enable) => {
    store.set('echoCancellation', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('echo-cancellation', enable);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-noise-cancellation', (_, enable) => {
    store.set('noiseCancellation', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('noise-cancellation', enable);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-microphone-amplification', (_, enable) => {
    store.set('microphoneAmplification', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('microphone-amplification', enable);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-manual-mix-mode', (_, enable) => {
    store.set('manualMixMode', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('manual-mix-mode', enable);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-mix-mode', (_, mode) => {
    store.set('mixMode', mode ?? 'all');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('mix-mode', mode);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-speaking-mode', (_, mode) => {
    store.set('speakingMode', mode ?? 'key');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('speaking-mode', mode);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-default-speaking-key', (_, key) => {
    store.set('defaultSpeakingKey', key ?? '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('default-speaking-key', key);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-not-save-message-history', (_, enable) => {
    store.set('notSaveMessageHistory', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('not-save-message-history', enable);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-hot-key-open-main-window', (_, key) => {
    store.set('hotKeyOpenMainWindow', key ?? '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-open-main-window', key);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-hot-key-increase-volume', (_, key) => {
    store.set('hotKeyIncreaseVolume', key ?? '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-increase-volume', key);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-hot-key-decrease-volume', (_, key) => {
    store.set('hotKeyDecreaseVolume', key ?? '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-decrease-volume', key);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-hot-key-toggle-speaker', (_, key) => {
    store.set('hotKeyToggleSpeaker', key ?? '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-toggle-speaker', key);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-hot-key-toggle-microphone', (_, key) => {
    store.set('hotKeyToggleMicrophone', key ?? '');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('hot-key-toggle-microphone', key);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-disable-all-sound-effect', (_, enable) => {
    store.set('disableAllSoundEffect', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('disable-all-sound-effect', enable);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-enter-voice-channel-sound', (_, enable) => {
    store.set('enterVoiceChannelSound', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('enter-voice-channel-sound', enable);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-leave-voice-channel-sound', (_, enable) => {
    store.set('leaveVoiceChannelSound', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('leave-voice-channel-sound', enable);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-start-speaking-sound', (_, enable) => {
    store.set('startSpeakingSound', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('start-speaking-sound', enable);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-stop-speaking-sound', (_, enable) => {
    store.set('stopSpeakingSound', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('stop-speaking-sound', enable);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-receive-direct-message-sound', (_, enable) => {
    store.set('receiveDirectMessageSound', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('receive-direct-message-sound', enable);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-receive-channel-message-sound', (_, enable) => {
    store.set('receiveChannelMessageSound', enable ?? false);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('receive-channel-message-sound', enable);
    });
  });

  // #electron-only {Depends on trigger for update checker}
  ipcMain.on('set-auto-check-for-updates', (_, enable) => {
    store.set('autoCheckForUpdates', enable ?? false);
    if (enable) startCheckForUpdates();
    else stopCheckForUpdates();
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('auto-check-for-updates', enable);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-update-check-interval', (_, interval) => {
    store.set('updateCheckInterval', interval ?? 1 * 60 * 1000);
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('update-check-interval', interval);
    });
  });

  // #web-sharable {Use createSettingsHandlers}
  ipcMain.on('set-update-channel', (_, channel) => {
    store.set('updateChannel', channel ?? 'latest');
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('update-channel', channel);
    });
  });
}