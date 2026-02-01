/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line
import type * as Types from '@/types';

/**
 * Shared settings handlers logic.
 * Decoupled from Electron/Web specific APIs.
 * 
 * @param ipc - Object with .on(channel, listener) method
 * @param storage - Object with .get(key) and .set(key, val) methods
 * @param broadcast - Function to notify all windows/tabs about a change
 * @param getSettings - Function to get the full settings object
 */
export function registerSharedSettingsHandlers(
  ipc: any,
  store: any,
  broadcast: (channel: string, value: any) => void,
  getSettings: () => any
) {
  // --------------------------------------------------------------------------
  // Getters
  // --------------------------------------------------------------------------

  ipc.on('get-system-settings', (event: any) => {
    event.returnValue = getSettings();
  });

  ipc.on('get-auto-login', (event: any) => {
    event.returnValue = store.get('autoLogin');
  });

  ipc.on('get-always-on-top', (event: any) => {
    event.returnValue = store.get('alwaysOnTop');
  });

  ipc.on('get-status-auto-idle', (event: any) => {
    event.returnValue = store.get('statusAutoIdle');
  });

  ipc.on('get-status-auto-idle-minutes', (event: any) => {
    event.returnValue = store.get('statusAutoIdleMinutes');
  });

  ipc.on('get-status-auto-dnd', (event: any) => {
    event.returnValue = store.get('statusAutoDnd');
  });

  ipc.on('get-channel-ui-mode', (event: any) => {
    event.returnValue = store.get('channelUIMode');
  });

  ipc.on('get-close-to-tray', (event: any) => {
    event.returnValue = store.get('closeToTray');
  });

  ipc.on('get-font', (event: any) => {
    event.returnValue = store.get('font');
  });

  ipc.on('get-font-size', (event: any) => {
    event.returnValue = store.get('fontSize');
  });

  ipc.on('get-input-audio-device', (event: any) => {
    event.returnValue = store.get('inputAudioDevice');
  });

  ipc.on('get-output-audio-device', (event: any) => {
    event.returnValue = store.get('outputAudioDevice');
  });

  ipc.on('get-record-format', (event: any) => {
    event.returnValue = store.get('recordFormat');
  });

  ipc.on('get-mix-effect', (event: any) => {
    event.returnValue = store.get('mixEffect');
  });

  ipc.on('get-mix-effect-type', (event: any) => {
    event.returnValue = store.get('mixEffectType');
  });

  ipc.on('get-auto-mix-setting', (event: any) => {
    event.returnValue = store.get('autoMixSetting');
  });

  ipc.on('get-echo-cancellation', (event: any) => {
    event.returnValue = store.get('echoCancellation');
  });

  ipc.on('get-noise-cancellation', (event: any) => {
    event.returnValue = store.get('noiseCancellation');
  });

  ipc.on('get-microphone-amplification', (event: any) => {
    event.returnValue = store.get('microphoneAmplification');
  });

  ipc.on('get-manual-mix-mode', (event: any) => {
    event.returnValue = store.get('manualMixMode');
  });

  ipc.on('get-mix-mode', (event: any) => {
    event.returnValue = store.get('mixMode');
  });

  ipc.on('get-speaking-mode', (event: any) => {
    event.returnValue = store.get('speakingMode');
  });

  ipc.on('get-default-speaking-key', (event: any) => {
    event.returnValue = store.get('defaultSpeakingKey');
  });

  ipc.on('get-not-save-message-history', (event: any) => {
    event.returnValue = store.get('notSaveMessageHistory');
  });

  ipc.on('get-hot-key-open-main-window', (event: any) => {
    event.returnValue = store.get('hotKeyOpenMainWindow');
  });

  ipc.on('get-hot-key-increase-volume', (event: any) => {
    event.returnValue = store.get('hotKeyIncreaseVolume');
  });

  ipc.on('get-hot-key-decrease-volume', (event: any) => {
    event.returnValue = store.get('hotKeyDecreaseVolume');
  });

  ipc.on('get-hot-key-toggle-speaker', (event: any) => {
    event.returnValue = store.get('hotKeyToggleSpeaker');
  });

  ipc.on('get-hot-key-toggle-microphone', (event: any) => {
    event.returnValue = store.get('hotKeyToggleMicrophone');
  });

  ipc.on('get-disable-all-sound-effect', (event: any) => {
    event.returnValue = store.get('disableAllSoundEffect');
  });

  ipc.on('get-enter-voice-channel-sound', (event: any) => {
    event.returnValue = store.get('enterVoiceChannelSound');
  });

  ipc.on('get-leave-voice-channel-sound', (event: any) => {
    event.returnValue = store.get('leaveVoiceChannelSound');
  });

  ipc.on('get-start-speaking-sound', (event: any) => {
    event.returnValue = store.get('startSpeakingSound');
  });

  ipc.on('get-stop-speaking-sound', (event: any) => {
    event.returnValue = store.get('stopSpeakingSound');
  });

  ipc.on('get-receive-direct-message-sound', (event: any) => {
    event.returnValue = store.get('receiveDirectMessageSound');
  });

  ipc.on('get-receive-channel-message-sound', (event: any) => {
    event.returnValue = store.get('receiveChannelMessageSound');
  });

  ipc.on('get-auto-check-for-updates', (event: any) => {
    event.returnValue = store.get('autoCheckForUpdates');
  });

  ipc.on('get-update-check-interval', (event: any) => {
    event.returnValue = store.get('updateCheckInterval');
  });

  ipc.on('get-update-channel', (event: any) => {
    event.returnValue = store.get('updateChannel');
  });

  // --------------------------------------------------------------------------
  // Setters
  // --------------------------------------------------------------------------

  ipc.on('set-auto-login', (_: any, enable: any) => {
    store.set('autoLogin', enable ?? false);
    broadcast('auto-login', enable);
  });

  ipc.on('set-status-auto-idle', (_: any, enable: any) => {
    store.set('statusAutoIdle', enable ?? false);
    broadcast('status-auto-idle', enable);
  });

  ipc.on('set-status-auto-idle-minutes', (_: any, value: any) => {
    store.set('statusAutoIdleMinutes', value ?? 10);
    broadcast('status-auto-idle-minutes', value);
  });

  ipc.on('set-status-auto-dnd', (_: any, enable: any) => {
    store.set('statusAutoDnd', enable ?? false);
    broadcast('status-auto-dnd', enable);
  });

  ipc.on('set-channel-ui-mode', (_: any, mode: any) => {
    store.set('channelUIMode', mode ?? 'classic');
    broadcast('channel-ui-mode', mode);
  });

  ipc.on('set-close-to-tray', (_: any, enable: any) => {
    store.set('closeToTray', enable ?? false);
    broadcast('close-to-tray', enable);
  });

  ipc.on('set-font', (_: any, font: any) => {
    store.set('font', font ?? '');
    broadcast('font', font);
  });

  ipc.on('set-font-size', (_: any, fontSize: any) => {
    store.set('fontSize', fontSize ?? 13);
    broadcast('font-size', fontSize);
  });

  ipc.on('set-input-audio-device', (_: any, deviceId: any) => {
    store.set('inputAudioDevice', deviceId ?? '');
    broadcast('input-audio-device', deviceId);
  });

  ipc.on('set-output-audio-device', (_: any, deviceId: any) => {
    store.set('outputAudioDevice', deviceId ?? '');
    broadcast('output-audio-device', deviceId);
  });

  ipc.on('set-record-format', (_: any, format: any) => {
    store.set('recordFormat', format ?? 'wav');
    broadcast('record-format', format);
  });

  ipc.on('set-mix-effect', (_: any, enable: any) => {
    store.set('mixEffect', enable ?? false);
    broadcast('mix-effect', enable);
  });

  ipc.on('set-mix-effect-type', (_: any, type: any) => {
    store.set('mixEffectType', type ?? '');
    broadcast('mix-effect-type', type);
  });

  ipc.on('set-auto-mix-setting', (_: any, enable: any) => {
    store.set('autoMixSetting', enable ?? false);
    broadcast('auto-mix-setting', enable);
  });

  ipc.on('set-echo-cancellation', (_: any, enable: any) => {
    store.set('echoCancellation', enable ?? false);
    broadcast('echo-cancellation', enable);
  });

  ipc.on('set-noise-cancellation', (_: any, enable: any) => {
    store.set('noiseCancellation', enable ?? false);
    broadcast('noise-cancellation', enable);
  });

  ipc.on('set-microphone-amplification', (_: any, enable: any) => {
    store.set('microphoneAmplification', enable ?? false);
    broadcast('microphone-amplification', enable);
  });

  ipc.on('set-manual-mix-mode', (_: any, enable: any) => {
    store.set('manualMixMode', enable ?? false);
    broadcast('manual-mix-mode', enable);
  });

  ipc.on('set-mix-mode', (_: any, mode: any) => {
    store.set('mixMode', mode ?? 'all');
    broadcast('mix-mode', mode);
  });

  ipc.on('set-speaking-mode', (_: any, mode: any) => {
    store.set('speakingMode', mode ?? 'key');
    broadcast('speaking-mode', mode);
  });

  ipc.on('set-default-speaking-key', (_: any, key: any) => {
    store.set('defaultSpeakingKey', key ?? '');
    broadcast('default-speaking-key', key);
  });

  ipc.on('set-not-save-message-history', (_: any, enable: any) => {
    store.set('notSaveMessageHistory', enable ?? false);
    broadcast('not-save-message-history', enable);
  });

  ipc.on('set-hot-key-open-main-window', (_: any, key: any) => {
    store.set('hotKeyOpenMainWindow', key ?? '');
    broadcast('hot-key-open-main-window', key);
  });

  ipc.on('set-hot-key-increase-volume', (_: any, key: any) => {
    store.set('hotKeyIncreaseVolume', key ?? '');
    broadcast('hot-key-increase-volume', key);
  });

  ipc.on('set-hot-key-decrease-volume', (_: any, key: any) => {
    store.set('hotKeyDecreaseVolume', key ?? '');
    broadcast('hot-key-decrease-volume', key);
  });

  ipc.on('set-hot-key-toggle-speaker', (_: any, key: any) => {
    store.set('hotKeyToggleSpeaker', key ?? '');
    broadcast('hot-key-toggle-speaker', key);
  });

  ipc.on('set-hot-key-toggle-microphone', (_: any, key: any) => {
    store.set('hotKeyToggleMicrophone', key ?? '');
    broadcast('hot-key-toggle-microphone', key);
  });

  ipc.on('set-disable-all-sound-effect', (_: any, enable: any) => {
    store.set('disableAllSoundEffect', enable ?? false);
    broadcast('disable-all-sound-effect', enable);
  });

  ipc.on('set-enter-voice-channel-sound', (_: any, enable: any) => {
    store.set('enterVoiceChannelSound', enable ?? false);
    broadcast('enter-voice-channel-sound', enable);
  });

  ipc.on('set-leave-voice-channel-sound', (_: any, enable: any) => {
    store.set('leaveVoiceChannelSound', enable ?? false);
    broadcast('leave-voice-channel-sound', enable);
  });

  ipc.on('set-start-speaking-sound', (_: any, enable: any) => {
    store.set('startSpeakingSound', enable ?? false);
    broadcast('start-speaking-sound', enable);
  });

  ipc.on('set-stop-speaking-sound', (_: any, enable: any) => {
    store.set('stopSpeakingSound', enable ?? false);
    broadcast('stop-speaking-sound', enable);
  });

  ipc.on('set-receive-direct-message-sound', (_: any, enable: any) => {
    store.set('receiveDirectMessageSound', enable ?? false);
    broadcast('receive-direct-message-sound', enable);
  });

  ipc.on('set-receive-channel-message-sound', (_: any, enable: any) => {
    store.set('receiveChannelMessageSound', enable ?? false);
    broadcast('receive-channel-message-sound', enable);
  });

  ipc.on('set-update-check-interval', (_: any, interval: any) => {
    store.set('updateCheckInterval', interval ?? 1 * 60 * 1000);
    broadcast('update-check-interval', interval);
  });

  ipc.on('set-update-channel', (_: any, channel: any) => {
    store.set('updateChannel', channel ?? 'latest');
    broadcast('update-channel', channel);
  });
}