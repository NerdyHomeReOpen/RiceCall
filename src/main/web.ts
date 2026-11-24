import packageJson from '../../package.json';

import type * as Types from '@/types';

import Env from '@/utils/env';

import { i18nReady } from '@/i18n';

import { pickLocale } from '@/types/locales';

import { eventEmitter } from '@/main/event';
import { autoLogin } from '@/main/auth/web';

export const START_TIMESTAMP = Date.now();
export const MAIN_TITLE = 'RiceCall';
export const VERSION_TITLE = `RiceCall v${packageJson.version}`;
export const DEV = typeof process !== 'undefined' && Array.isArray(process.argv) ? process.argv.includes('--dev') : false;
export const PORT = 3000;
export const BASE_URI = `http://localhost:${PORT}`;

class Store {
  private defaults: Types.StoreType;

  constructor({ defaults }: { defaults: Types.StoreType }) {
    this.defaults = defaults;
  }

  public get<T extends keyof Types.StoreType>(key: T): Types.StoreType[T] {
    const value = localStorage.getItem(key);
    if (value === null) return this.defaults[key];
    if (value === 'undefined') return this.defaults[key];

    try {
      const parsed = JSON.parse(value);
      if (parsed === null && this.defaults[key] !== null) return this.defaults[key];
      return parsed as Types.StoreType[T];
    } catch {
      return value as unknown as Types.StoreType[T];
    }
  }

  public set(key: keyof Types.StoreType, value: Types.StoreType[keyof Types.StoreType]) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export const store = new Store({
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
    recordSavePath: '',
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

export function getSettings(): Types.SystemSettings {
  return {
    isAutoLoginEnabled: store.get('isAutoLoginEnabled'),
    isAutoLaunchEnabled: false,
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
  return pickLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
}

export function exit(): void {
  window.close();
}

export function listen<A extends unknown[]>(channel: string, listener: (...args: A) => void): () => void {
  eventEmitter.on(channel, listener as (...args: unknown[]) => void);
  return () => eventEmitter.removeListener(channel, listener as (...args: unknown[]) => void);
}

export function createPopup(type: Types.PopupType, id: string, initialData: unknown = {}, force = true): void {
  eventEmitter.emit('open-popup', type, id, initialData, force);
}

export function closeAllPopups(): void {
  eventEmitter.emit('close-all-popups');
}

export function getInitialData(id: string): null {
  return id ? null : null;
}

export async function enableLoopbackAudio(): Promise<void> {
  return;
}

export async function disableLoopbackAudio(): Promise<void> {
  return;
}

export * from '@/main/accounts/web';
export * from '@/main/api/web';
export * from '@/main/app/web';
export * from '@/main/auth/web';
export * from '@/main/custom-themes/web';
export * from '@/main/discord/web';
export * from '@/main/env/web';
export * from '@/main/error/web';
export * from '@/main/network/web';
export * from '@/main/popup/web';
export * from '@/main/record/web';
export * from '@/main/socket/web';
export * from '@/main/system-settings/web';
export * from '@/main/store-state/web';
export * from '@/main/tray/web';
export * from '@/main/window/web';

async function onReady() {
  await Env.load(store.get('env'));
  await i18nReady;

  const token = store.get('token');
  if (!token) {
    if (window.location.pathname !== '/auth') window.location.replace('/auth');
    return;
  }
  autoLogin(token);
}

onReady();

export { eventEmitter };
