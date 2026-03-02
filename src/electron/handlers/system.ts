import { app, ipcMain } from 'electron';
import fontList from 'font-list';

import * as Types from '@/types';

import { store, getSettings, broadcast, isAutoLaunchEnabled, setAutoLaunch, mainWindow, getRegion } from '@/electron/main';
import { startCheckForUpdates, stopCheckForUpdates } from '@/electron/auto-updater';
import { setTrayDetail } from '@/electron/tray';

import { changeLanguage } from '@/i18n';

export function registerSystemHandlers() {
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

  ipcMain.on('get-language', (event) => {
    event.returnValue = store.get('language');
  });

  ipcMain.on('set-auto-login', (_, enable = false) => {
    store.set('autoLogin', enable);
    broadcast('auto-login', enable);
  });

  ipcMain.on('set-auto-launch', (_, enable = false) => {
    setAutoLaunch(enable);
    broadcast('auto-launch', enable);
  });

  ipcMain.on('set-always-on-top', (_, enable = false) => {
    store.set('alwaysOnTop', enable);
    broadcast('always-on-top', enable);
    mainWindow?.setAlwaysOnTop(enable);
  });

  ipcMain.on('set-status-auto-idle', (_, enable = false) => {
    store.set('statusAutoIdle', enable);
    broadcast('status-auto-idle', enable);
  });

  ipcMain.on('set-status-auto-idle-minutes', (_, value = 10) => {
    store.set('statusAutoIdleMinutes', value);
    broadcast('status-auto-idle-minutes', value);
  });

  ipcMain.on('set-status-auto-dnd', (_, enable = false) => {
    store.set('statusAutoDnd', enable);
    broadcast('status-auto-dnd', enable);
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

  ipcMain.on('set-mix-effect', (_, enable = false) => {
    store.set('mixEffect', enable);
    broadcast('mix-effect', enable);
  });

  ipcMain.on('set-mix-effect-type', (_, type = '') => {
    store.set('mixEffectType', type);
    broadcast('mix-effect-type', type);
  });

  ipcMain.on('set-auto-mix-setting', (_, enable = false) => {
    store.set('autoMixSetting', enable);
    broadcast('auto-mix-setting', enable);
  });

  ipcMain.on('set-echo-cancellation', (_, enable = false) => {
    store.set('echoCancellation', enable);
    broadcast('echo-cancellation', enable);
  });

  ipcMain.on('set-noise-cancellation', (_, enable = false) => {
    store.set('noiseCancellation', enable);
    broadcast('noise-cancellation', enable);
  });

  ipcMain.on('set-microphone-amplification', (_, enable = false) => {
    store.set('microphoneAmplification', enable);
    broadcast('microphone-amplification', enable);
  });

  ipcMain.on('set-manual-mix-mode', (_, enable = false) => {
    store.set('manualMixMode', enable);
    broadcast('manual-mix-mode', enable);
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

  ipcMain.on('set-not-save-message-history', (_, enable = false) => {
    store.set('notSaveMessageHistory', enable);
    broadcast('not-save-message-history', enable);
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

  ipcMain.on('set-enter-voice-channel-sound', (_, enable = false) => {
    store.set('enterVoiceChannelSound', enable);
    broadcast('enter-voice-channel-sound', enable);
  });

  ipcMain.on('set-leave-voice-channel-sound', (_, enable = false) => {
    store.set('leaveVoiceChannelSound', enable);
    broadcast('leave-voice-channel-sound', enable);
  });

  ipcMain.on('set-start-speaking-sound', (_, enable = false) => {
    store.set('startSpeakingSound', enable);
    broadcast('start-speaking-sound', enable);
  });

  ipcMain.on('set-stop-speaking-sound', (_, enable = false) => {
    store.set('stopSpeakingSound', enable);
    broadcast('stop-speaking-sound', enable);
  });

  ipcMain.on('set-receive-direct-message-sound', (_, enable = false) => {
    store.set('receiveDirectMessageSound', enable);
    broadcast('receive-direct-message-sound', enable);
  });

  ipcMain.on('set-receive-channel-message-sound', (_, enable = false) => {
    store.set('receiveChannelMessageSound', enable);
    broadcast('receive-channel-message-sound', enable);
  });

  ipcMain.on('set-auto-check-for-updates', (_, enable = false) => {
    store.set('autoCheckForUpdates', enable);
    if (enable) startCheckForUpdates();
    else stopCheckForUpdates();
    broadcast('auto-check-for-updates', enable);
  });

  ipcMain.on('set-update-check-interval', (_, interval = 1 * 60 * 1000) => {
    store.set('updateCheckInterval', interval);
    broadcast('update-check-interval', interval);
  });

  ipcMain.on('set-update-channel', (_, channel = 'latest') => {
    store.set('updateChannel', channel);
    broadcast('update-channel', channel);
  });

  ipcMain.on('set-language', (_, language: Types.LanguageKey = getRegion()) => {
    store.set('language', language);
    changeLanguage(language);
    setTrayDetail();
    broadcast('language', language);
  });
}
