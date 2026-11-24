import { app, ipcMain } from 'electron';
import fontList from 'font-list';

import type * as Types from '@/types';

import { changeLocale } from '@/i18n';

import { store, getSettings, broadcast, isAutoLaunchEnabled, setIsAutoLaunchEnabled, mainWindow, getSystemLocale, setTrayDetail, startCheckForUpdates, stopCheckForUpdates } from '@/main/electron';

export function registerSystemHandlers(): void {
  ipcMain.on('get-system-settings', (event) => {
    event.returnValue = getSettings();
  });

  ipcMain.on('get-is-auto-login-enabled', (event) => {
    event.returnValue = store.get('isAutoLoginEnabled');
  });

  ipcMain.on('get-is-auto-launch-enabled', (event) => {
    event.returnValue = isAutoLaunchEnabled();
  });

  ipcMain.on('get-is-always-on-top', (event) => {
    event.returnValue = store.get('isAlwaysOnTop');
  });

  ipcMain.on('get-is-status-auto-idle-enabled', (event) => {
    event.returnValue = store.get('isStatusAutoIdleEnabled');
  });

  ipcMain.on('get-status-auto-idle-minutes', (event) => {
    event.returnValue = store.get('statusAutoIdleMinutes');
  });

  ipcMain.on('get-is-status-auto-dnd-enabled', (event) => {
    event.returnValue = store.get('isStatusAutoDndEnabled');
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

  ipcMain.on('get-is-mix-effect-enabled', (event) => {
    event.returnValue = store.get('isMixEffectEnabled');
  });

  ipcMain.on('get-mix-effect-type', (event) => {
    event.returnValue = store.get('mixEffectType');
  });

  ipcMain.on('get-is-auto-mix-setting-enabled', (event) => {
    event.returnValue = store.get('isAutoMixSettingEnabled');
  });

  ipcMain.on('get-is-echo-cancellation-enabled', (event) => {
    event.returnValue = store.get('isEchoCancellationEnabled');
  });

  ipcMain.on('get-is-noise-cancellation-enabled', (event) => {
    event.returnValue = store.get('isNoiseCancellationEnabled');
  });

  ipcMain.on('get-is-microphone-amplification-enabled', (event) => {
    event.returnValue = store.get('isMicrophoneAmplificationEnabled');
  });

  ipcMain.on('get-is-manual-mix-mode', (event) => {
    event.returnValue = store.get('isManualMixMode');
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

  ipcMain.on('get-disable-message-history', (event) => {
    event.returnValue = store.get('disableMessageHistory');
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

  ipcMain.on('get-is-enter-voice-channel-sound-enabled', (event) => {
    event.returnValue = store.get('isEnterVoiceChannelSoundEnabled');
  });

  ipcMain.on('get-is-leave-voice-channel-sound-enabled', (event) => {
    event.returnValue = store.get('isLeaveVoiceChannelSoundEnabled');
  });

  ipcMain.on('get-is-start-speaking-sound-enabled', (event) => {
    event.returnValue = store.get('isStartSpeakingSoundEnabled');
  });

  ipcMain.on('get-is-stop-speaking-sound-enabled', (event) => {
    event.returnValue = store.get('isStopSpeakingSoundEnabled');
  });

  ipcMain.on('get-is-receive-direct-message-sound-enabled', (event) => {
    event.returnValue = store.get('isReceiveDirectMessageSoundEnabled');
  });

  ipcMain.on('get-is-receive-channel-message-sound-enabled', (event) => {
    event.returnValue = store.get('isReceiveChannelMessageSoundEnabled');
  });

  ipcMain.on('get-is-auto-check-for-updates-enabled', (event) => {
    event.returnValue = store.get('isAutoCheckForUpdatesEnabled');
  });

  ipcMain.on('get-update-check-interval', (event) => {
    event.returnValue = store.get('updateCheckInterval');
  });

  ipcMain.on('get-update-channel', (event) => {
    event.returnValue = store.get('updateChannel');
  });

  ipcMain.on('get-locale', (event) => {
    event.returnValue = store.get('locale');
  });

  ipcMain.on('set-is-auto-login-enabled', (_, enable = false) => {
    store.set('isAutoLoginEnabled', enable);
    broadcast('is-auto-login-enabled', enable);
  });

  ipcMain.on('set-is-auto-launch-enabled', (_, enable = false) => {
    setIsAutoLaunchEnabled(enable);
    broadcast('is-auto-launch-enabled', enable);
  });

  ipcMain.on('set-is-always-on-top', (_, enable = false) => {
    store.set('isAlwaysOnTop', enable);
    broadcast('is-always-on-top', enable);
    mainWindow?.setAlwaysOnTop(enable);
  });

  ipcMain.on('set-is-status-auto-idle-enabled', (_, enable = false) => {
    store.set('isStatusAutoIdleEnabled', enable);
    broadcast('is-status-auto-idle-enabled', enable);
  });

  ipcMain.on('set-status-auto-idle-minutes', (_, value = 10) => {
    store.set('statusAutoIdleMinutes', value);
    broadcast('status-auto-idle-minutes', value);
  });

  ipcMain.on('set-is-status-auto-dnd-enabled', (_, enable = false) => {
    store.set('isStatusAutoDndEnabled', enable);
    broadcast('is-status-auto-dnd-enabled', enable);
  });

  ipcMain.on('set-channel-ui-mode', (_, mode = 'classic') => {
    store.set('channelUIMode', mode);
    broadcast('channel-ui-mode', mode);
  });

  ipcMain.on('set-close-to-tray', (_, enable = false) => {
    store.set('closeToTray', enable);
    broadcast('close-to-tray', enable);
  });

  ipcMain.on('set-font', (_, font = '') => {
    store.set('font', font);
    broadcast('font', font);
  });

  ipcMain.on('set-font-size', (_, fontSize = 13) => {
    store.set('fontSize', fontSize);
    broadcast('font-size', fontSize);
  });

  ipcMain.on('set-input-audio-device', (_, deviceId = '') => {
    store.set('inputAudioDevice', deviceId);
    broadcast('input-audio-device', deviceId);
  });

  ipcMain.on('set-output-audio-device', (_, deviceId = '') => {
    store.set('outputAudioDevice', deviceId);
    broadcast('output-audio-device', deviceId);
  });

  ipcMain.on('set-record-format', (_, format = 'wav') => {
    store.set('recordFormat', format);
    broadcast('record-format', format);
  });

  ipcMain.on('set-record-save-path', (_, path = app.getPath('documents')) => {
    store.set('recordSavePath', path);
    broadcast('record-save-path', path);
  });

  ipcMain.on('set-is-mix-effect-enabled', (_, enable = false) => {
    store.set('isMixEffectEnabled', enable);
    broadcast('is-mix-effect-enabled', enable);
  });

  ipcMain.on('set-mix-effect-type', (_, type = '') => {
    store.set('mixEffectType', type);
    broadcast('mix-effect-type', type);
  });

  ipcMain.on('set-is-auto-mix-setting-enabled', (_, enable = false) => {
    store.set('isAutoMixSettingEnabled', enable);
    broadcast('is-auto-mix-setting-enabled', enable);
  });

  ipcMain.on('set-is-echo-cancellation-enabled', (_, enable = false) => {
    store.set('isEchoCancellationEnabled', enable);
    broadcast('is-echo-cancellation-enabled', enable);
  });

  ipcMain.on('set-is-noise-cancellation-enabled', (_, enable = false) => {
    store.set('isNoiseCancellationEnabled', enable);
    broadcast('is-noise-cancellation-enabled', enable);
  });

  ipcMain.on('set-is-microphone-amplification-enabled', (_, enable = false) => {
    store.set('isMicrophoneAmplificationEnabled', enable);
    broadcast('is-microphone-amplification-enabled', enable);
  });

  ipcMain.on('set-is-manual-mix-mode', (_, enable = false) => {
    store.set('isManualMixMode', enable);
    broadcast('is-manual-mix-mode', enable);
  });

  ipcMain.on('set-mix-mode', (_, mode = 'all') => {
    store.set('mixMode', mode);
    broadcast('mix-mode', mode);
  });

  ipcMain.on('set-speaking-mode', (_, mode = 'key') => {
    store.set('speakingMode', mode);
    broadcast('speaking-mode', mode);
  });

  ipcMain.on('set-default-speaking-key', (_, key = '') => {
    store.set('defaultSpeakingKey', key);
    broadcast('default-speaking-key', key);
  });

  ipcMain.on('set-disable-message-history', (_, enable = false) => {
    store.set('disableMessageHistory', enable);
    broadcast('disable-message-history', enable);
  });

  ipcMain.on('set-hot-key-open-main-window', (_, key = '') => {
    store.set('hotKeyOpenMainWindow', key);
    broadcast('hot-key-open-main-window', key);
  });

  ipcMain.on('set-hot-key-increase-volume', (_, key = '') => {
    store.set('hotKeyIncreaseVolume', key);
    broadcast('hot-key-increase-volume', key);
  });

  ipcMain.on('set-hot-key-decrease-volume', (_, key = '') => {
    store.set('hotKeyDecreaseVolume', key);
    broadcast('hot-key-decrease-volume', key);
  });

  ipcMain.on('set-hot-key-toggle-speaker', (_, key = '') => {
    store.set('hotKeyToggleSpeaker', key);
    broadcast('hot-key-toggle-speaker', key);
  });

  ipcMain.on('set-hot-key-toggle-microphone', (_, key = '') => {
    store.set('hotKeyToggleMicrophone', key);
    broadcast('hot-key-toggle-microphone', key);
  });

  ipcMain.on('set-disable-all-sound-effect', (_, enable = false) => {
    store.set('disableAllSoundEffect', enable);
    broadcast('disable-all-sound-effect', enable);
  });

  ipcMain.on('set-is-enter-voice-channel-sound-enabled', (_, enable = false) => {
    store.set('isEnterVoiceChannelSoundEnabled', enable);
    broadcast('is-enter-voice-channel-sound-enabled', enable);
  });

  ipcMain.on('set-is-leave-voice-channel-sound-enabled', (_, enable = false) => {
    store.set('isLeaveVoiceChannelSoundEnabled', enable);
    broadcast('is-leave-voice-channel-sound-enabled', enable);
  });

  ipcMain.on('set-is-start-speaking-sound-enabled', (_, enable = false) => {
    store.set('isStartSpeakingSoundEnabled', enable);
    broadcast('is-start-speaking-sound-enabled', enable);
  });

  ipcMain.on('set-is-stop-speaking-sound-enabled', (_, enable = false) => {
    store.set('isStopSpeakingSoundEnabled', enable);
    broadcast('is-stop-speaking-sound-enabled', enable);
  });

  ipcMain.on('set-is-receive-direct-message-sound-enabled', (_, enable = false) => {
    store.set('isReceiveDirectMessageSoundEnabled', enable);
    broadcast('is-receive-direct-message-sound-enabled', enable);
  });

  ipcMain.on('set-is-receive-channel-message-sound-enabled', (_, enable = false) => {
    store.set('isReceiveChannelMessageSoundEnabled', enable);
    broadcast('is-receive-channel-message-sound-enabled', enable);
  });

  ipcMain.on('set-is-auto-check-for-updates-enabled', (_, enable = false) => {
    store.set('isAutoCheckForUpdatesEnabled', enable);

    if (enable) startCheckForUpdates();
    else stopCheckForUpdates();

    broadcast('is-auto-check-for-updates-enabled', enable);
  });

  ipcMain.on('set-update-check-interval', (_, interval = 1 * 60 * 1000) => {
    store.set('updateCheckInterval', interval);
    broadcast('update-check-interval', interval);
  });

  ipcMain.on('set-update-channel', (_, channel = 'latest') => {
    store.set('updateChannel', channel);
    broadcast('update-channel', channel);
  });

  ipcMain.on('set-locale', (_, locale: Types.Locale = getSystemLocale()) => {
    store.set('locale', locale);
    changeLocale(locale);
    setTrayDetail();
    broadcast('locale', locale);
  });
}
