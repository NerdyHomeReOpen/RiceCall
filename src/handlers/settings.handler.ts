/**
 * Settings handlers - shared between Electron and Web.
 * Provides get/set for all system settings.
 */

import type { HandlerContext, HandlerRegistration } from '@/platform/ipc/types';
import type * as Types from '@/types';

// Default values for settings
const DEFAULTS: Types.SystemSettings = {
  autoLogin: false,
  autoLaunch: false,
  alwaysOnTop: false,
  statusAutoIdle: false,
  statusAutoIdleMinutes: 10,
  statusAutoDnd: false,
  channelUIMode: 'classic',
  closeToTray: false,
  font: '',
  fontSize: 13,
  inputAudioDevice: '',
  outputAudioDevice: '',
  recordFormat: 'wav',
  recordSavePath: '',
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
  autoCheckForUpdates: true,
  updateCheckInterval: 60000,
  updateChannel: 'latest',
};

type SettingKey = keyof Types.SystemSettings;

/**
 * Helper to create get/set handlers for a setting.
 */
function createSettingHandlers(key: SettingKey) {
  return {
    get: (ctx: HandlerContext) => ctx.storage.get(key, DEFAULTS[key]),
    set: (ctx: HandlerContext, value: unknown) => {
      ctx.storage.set(key, value);
      ctx.broadcast(key.replace(/([A-Z])/g, '-$1').toLowerCase(), value);
    },
  };
}

/**
 * Create settings handlers.
 */
export function createSettingsHandlers(): HandlerRegistration {
  const syncHandlers: Record<string, (ctx: HandlerContext, ...args: unknown[]) => unknown> = {
    'get-system-settings': (ctx: HandlerContext): Types.SystemSettings => {
      const result: Partial<Types.SystemSettings> = {};
      for (const key of Object.keys(DEFAULTS) as SettingKey[]) {
        result[key] = ctx.storage.get(key, DEFAULTS[key]) as never;
      }
      return result as Types.SystemSettings;
    },
  };

  const sendHandlers: Record<string, (ctx: HandlerContext, ...args: unknown[]) => void> = {};

  // Generate handlers for each setting
  const settingKeys: SettingKey[] = [
    'autoLogin',
    'autoLaunch',
    'alwaysOnTop',
    'statusAutoIdle',
    'statusAutoIdleMinutes',
    'statusAutoDnd',
    'channelUIMode',
    'closeToTray',
    'font',
    'fontSize',
    'inputAudioDevice',
    'outputAudioDevice',
    'recordFormat',
    'recordSavePath',
    'mixEffect',
    'mixEffectType',
    'autoMixSetting',
    'echoCancellation',
    'noiseCancellation',
    'microphoneAmplification',
    'manualMixMode',
    'mixMode',
    'speakingMode',
    'defaultSpeakingKey',
    'notSaveMessageHistory',
    'hotKeyOpenMainWindow',
    'hotKeyIncreaseVolume',
    'hotKeyDecreaseVolume',
    'hotKeyToggleSpeaker',
    'hotKeyToggleMicrophone',
    'disableAllSoundEffect',
    'enterVoiceChannelSound',
    'leaveVoiceChannelSound',
    'startSpeakingSound',
    'stopSpeakingSound',
    'receiveDirectMessageSound',
    'receiveChannelMessageSound',
    'autoCheckForUpdates',
    'updateCheckInterval',
    'updateChannel',
  ];

  for (const key of settingKeys) {
    const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    const handlers = createSettingHandlers(key);

    syncHandlers[`get-${kebabKey}`] = handlers.get;
    sendHandlers[`set-${kebabKey}`] = handlers.set;
  }

  return {
    sync: syncHandlers,
    send: sendHandlers,
  };
}
