import packageJson from '../../package.json';

import * as Types from '@/types';

import { LANGUAGES } from '@/constants';

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
    language: getRegion(),
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
    dontShowDisclaimer: false,
    autoCheckForUpdates: true,
    updateCheckInterval: 1 * 60 * 1000,
    updateChannel: 'latest',
    env: 'prod',
    token: '',
  },
});

export function getSettings(): Types.SystemSettings {
  return {
    autoLogin: store.get('autoLogin'),
    autoLaunch: false,
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
  const language = navigator.language;
  const match = LANGUAGES.find(({ code }) => code.includes(language) || language.includes(code));
  if (!match) return 'en-US';
  return match.code;
}

export function exit() {
  window.close();
}

export function listen(channel: string, listener: (...args: unknown[]) => void) {
  eventEmitter.on(channel, listener);
  return () => eventEmitter.removeListener(channel, listener);
}

export function createPopup(type: Types.PopupType, id: string, initialData: unknown = {}, force = true) {
  eventEmitter.emit('open-popup', type, id, initialData, force);
}

export function closeAllPopups() {
  eventEmitter.emit('close-all-popups');
}

export function getInitialData(id: string) {
  return id ? null : null;
}

export async function enableLoopbackAudio(): Promise<void> {
  return;
}

export async function disableLoopbackAudio(): Promise<void> {
  return;
}

export * from '@/main/accounts/web';
export * from '@/main/app/web';
export * from '@/main/auth/web';
export * from '@/main/customThemes/web';
export * from '@/main/data/web';
export * from '@/main/discord/web';
export * from '@/main/env/web';
export * from '@/main/error/web';
export * from '@/main/network/web';
export * from '@/main/popup/web';
export * from '@/main/record/web';
export * from '@/main/socket/web';
export * from '@/main/systemSettings/web';
export * from '@/main/tray/web';
export * from '@/main/window/web';

function onReady() {
  const token = store.get('token');
  if (!token) return;
  autoLogin(token);
}

onReady();

export { eventEmitter };
