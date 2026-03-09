import * as Types from '@/types';
import { modules } from './modules';

export const systemSettings = {
  set: (settings: Partial<Types.SystemSettings>): void => {
    if (settings.autoLogin !== undefined) modules.default.setAutoLogin(settings.autoLogin);
    if (settings.autoLaunch !== undefined) modules.default.setAutoLaunch(settings.autoLaunch);
    if (settings.alwaysOnTop !== undefined) modules.default.setAlwaysOnTop(settings.alwaysOnTop);
    if (settings.statusAutoIdle !== undefined) modules.default.setStatusAutoIdle(settings.statusAutoIdle);
    if (settings.statusAutoIdleMinutes !== undefined) modules.default.setStatusAutoIdleMinutes(settings.statusAutoIdleMinutes);
    if (settings.statusAutoDnd !== undefined) modules.default.setStatusAutoDnd(settings.statusAutoDnd);
    if (settings.channelUIMode !== undefined) modules.default.setChannelUIMode(settings.channelUIMode);
    if (settings.closeToTray !== undefined) modules.default.setCloseToTray(settings.closeToTray);
    if (settings.font !== undefined) modules.default.setFont(settings.font);
    if (settings.fontSize !== undefined) modules.default.setFontSize(settings.fontSize);
    if (settings.inputAudioDevice !== undefined) modules.default.setInputAudioDevice(settings.inputAudioDevice);
    if (settings.outputAudioDevice !== undefined) modules.default.setOutputAudioDevice(settings.outputAudioDevice);
    if (settings.recordFormat !== undefined) modules.default.setRecordFormat(settings.recordFormat);
    if (settings.recordSavePath !== undefined) modules.default.setRecordSavePath(settings.recordSavePath);
    if (settings.mixEffect !== undefined) modules.default.setMixEffect(settings.mixEffect);
    if (settings.mixEffectType !== undefined) modules.default.setMixEffectType(settings.mixEffectType);
    if (settings.autoMixSetting !== undefined) modules.default.setAutoMixSetting(settings.autoMixSetting);
    if (settings.echoCancellation !== undefined) modules.default.setEchoCancellation(settings.echoCancellation);
    if (settings.noiseCancellation !== undefined) modules.default.setNoiseCancellation(settings.noiseCancellation);
    if (settings.microphoneAmplification !== undefined) modules.default.setMicrophoneAmplification(settings.microphoneAmplification);
    if (settings.manualMixMode !== undefined) modules.default.setManualMixMode(settings.manualMixMode);
    if (settings.mixMode !== undefined) modules.default.setMixMode(settings.mixMode);
    if (settings.speakingMode !== undefined) modules.default.setSpeakingMode(settings.speakingMode);
    if (settings.defaultSpeakingKey !== undefined) modules.default.setDefaultSpeakingKey(settings.defaultSpeakingKey);
    if (settings.notSaveMessageHistory !== undefined) modules.default.setNotSaveMessageHistory(settings.notSaveMessageHistory);
    if (settings.hotKeyOpenMainWindow !== undefined) modules.default.setHotKeyOpenMainWindow(settings.hotKeyOpenMainWindow);
    if (settings.hotKeyIncreaseVolume !== undefined) modules.default.setHotKeyIncreaseVolume(settings.hotKeyIncreaseVolume);
    if (settings.hotKeyDecreaseVolume !== undefined) modules.default.setHotKeyDecreaseVolume(settings.hotKeyDecreaseVolume);
    if (settings.hotKeyToggleSpeaker !== undefined) modules.default.setHotKeyToggleSpeaker(settings.hotKeyToggleSpeaker);
    if (settings.hotKeyToggleMicrophone !== undefined) modules.default.setHotKeyToggleMicrophone(settings.hotKeyToggleMicrophone);
    if (settings.disableAllSoundEffect !== undefined) modules.default.setDisableAllSoundEffect(settings.disableAllSoundEffect);
    if (settings.enterVoiceChannelSound !== undefined) modules.default.setEnterVoiceChannelSound(settings.enterVoiceChannelSound);
    if (settings.leaveVoiceChannelSound !== undefined) modules.default.setLeaveVoiceChannelSound(settings.leaveVoiceChannelSound);
    if (settings.startSpeakingSound !== undefined) modules.default.setStartSpeakingSound(settings.startSpeakingSound);
    if (settings.stopSpeakingSound !== undefined) modules.default.setStopSpeakingSound(settings.stopSpeakingSound);
    if (settings.receiveDirectMessageSound !== undefined) modules.default.setReceiveDirectMessageSound(settings.receiveDirectMessageSound);
    if (settings.receiveChannelMessageSound !== undefined) modules.default.setReceiveChannelMessageSound(settings.receiveChannelMessageSound);
    if (settings.autoCheckForUpdates !== undefined) modules.default.setAutoCheckForUpdates(settings.autoCheckForUpdates);
    if (settings.updateCheckInterval !== undefined) modules.default.setUpdateCheckInterval(settings.updateCheckInterval);
    if (settings.updateChannel !== undefined) modules.default.setUpdateChannel(settings.updateChannel);
  },

  get: (): Types.SystemSettings | null => {
    return modules.default.getSystemSettings();
  },

  autoLogin: {
    set: (enable: boolean): void => {
      modules.default.setAutoLogin(enable);
    },
    get: (): boolean => {
      return modules.default.getAutoLogin();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('auto-login', callback);
    },
  },

  autoLaunch: {
    set: (enable: boolean): void => {
      modules.default.setAutoLaunch(enable);
    },
    get: (): boolean => {
      return modules.default.getAutoLaunch();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('auto-launch', callback);
    },
  },

  alwaysOnTop: {
    set: (enable: boolean): void => {
      modules.default.setAlwaysOnTop(enable);
    },
    get: (): boolean => {
      return modules.default.getAlwaysOnTop();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('always-on-top', callback);
    },
  },

  statusAutoIdle: {
    set: (enable: boolean): void => {
      modules.default.setStatusAutoIdle(enable);
    },
    get: (): boolean => {
      return modules.default.getStatusAutoIdle();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('status-auto-idle', callback);
    },
  },

  statusAutoIdleMinutes: {
    set: (fontSize: number): void => {
      modules.default.setStatusAutoIdleMinutes(fontSize);
    },
    get: (): number => {
      return modules.default.getStatusAutoIdleMinutes();
    },
    onUpdate: (callback: (fontSize: number) => void): (() => void) => {
      return modules.default.listen('status-auto-idle-minutes', callback);
    },
  },

  statusAutoDnd: {
    set: (enable: boolean): void => {
      modules.default.setStatusAutoDnd(enable);
    },
    get: (): boolean => {
      return modules.default.getStatusAutoDnd();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('status-auto-dnd', callback);
    },
  },

  channelUIMode: {
    set: (key: Types.ChannelUIMode): void => {
      modules.default.setChannelUIMode(key);
    },
    get: (): Types.ChannelUIMode => {
      return modules.default.getChannelUIMode();
    },
    onUpdate: (callback: (key: Types.ChannelUIMode) => void): (() => void) => {
      return modules.default.listen('channel-ui-mode', callback);
    },
  },

  closeToTray: {
    set: (enable: boolean): void => {
      modules.default.setCloseToTray(enable);
    },
    get: (): boolean => {
      return modules.default.getCloseToTray();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('close-to-tray', callback);
    },
  },

  font: {
    set: (font: string): void => {
      modules.default.setFont(font);
    },
    get: (): string => {
      return modules.default.getFont();
    },
    onUpdate: (callback: (font: string) => void): (() => void) => {
      return modules.default.listen('font', callback);
    },
  },

  fontSize: {
    set: (fontSize: number): void => {
      modules.default.setFontSize(fontSize);
    },
    get: (): number => {
      return modules.default.getFontSize();
    },
    onUpdate: (callback: (fontSize: number) => void): (() => void) => {
      return modules.default.listen('font-size', callback);
    },
  },

  inputAudioDevice: {
    set: (deviceId: string): void => {
      modules.default.setInputAudioDevice(deviceId);
    },
    get: (): string => {
      return modules.default.getInputAudioDevice();
    },
    onUpdate: (callback: (deviceId: string) => void): (() => void) => {
      return modules.default.listen('input-audio-device', callback);
    },
  },

  outputAudioDevice: {
    set: (deviceId: string): void => {
      modules.default.setOutputAudioDevice(deviceId);
    },
    get: (): string => {
      return modules.default.getOutputAudioDevice();
    },
    onUpdate: (callback: (deviceId: string) => void): (() => void) => {
      return modules.default.listen('output-audio-device', callback);
    },
  },

  recordFormat: {
    set: (format: Types.RecordFormat): void => {
      modules.default.setRecordFormat(format);
    },
    get: (): Types.RecordFormat => {
      return modules.default.getRecordFormat();
    },
  },

  // Note: this onUpdate is intentionally at systemSettings level (not inside recordFormat)
  // to preserve existing API: ipc.systemSettings.onUpdate(...)
  onUpdate: (callback: (format: Types.RecordFormat) => void): (() => void) => {
    return modules.default.listen('record-format', callback);
  },

  recordSavePath: {
    set: (path: string): void => {
      modules.default.setRecordSavePath(path);
    },
    get: (): string => {
      return modules.default.getRecordSavePath();
    },
    onUpdate: (callback: (path: string) => void): (() => void) => {
      return modules.default.listen('record-save-path', callback);
    },
  },

  mixEffect: {
    set: (enabled: boolean): void => {
      modules.default.setMixEffect(enabled);
    },
    get: (): boolean => {
      return modules.default.getMixEffect();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('mix-effect', callback);
    },
  },

  mixEffectType: {
    set: (key: string): void => {
      modules.default.setMixEffectType(key);
    },
    get: (): string => {
      return modules.default.getMixEffectType();
    },
    onUpdate: (callback: (key: string) => void): (() => void) => {
      return modules.default.listen('mix-effect-type', callback);
    },
  },

  autoMixSetting: {
    set: (enabled: boolean): void => {
      modules.default.setAutoMixSetting(enabled);
    },
    get: (): boolean => {
      return modules.default.getAutoMixSetting();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('auto-mix-setting', callback);
    },
  },

  echoCancellation: {
    set: (enabled: boolean): void => {
      modules.default.setEchoCancellation(enabled);
    },
    get: (): boolean => {
      return modules.default.getEchoCancellation();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('echo-cancellation', callback);
    },
  },

  noiseCancellation: {
    set: (enabled: boolean): void => {
      modules.default.setNoiseCancellation(enabled);
    },
    get: (): boolean => {
      return modules.default.getNoiseCancellation();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('noise-cancellation', callback);
    },
  },

  microphoneAmplification: {
    set: (enabled: boolean): void => {
      modules.default.setMicrophoneAmplification(enabled);
    },
    get: (): boolean => {
      return modules.default.getMicrophoneAmplification();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('microphone-amplification', callback);
    },
  },

  manualMixMode: {
    set: (enabled: boolean): void => {
      modules.default.setManualMixMode(enabled);
    },
    get: (): boolean => {
      return modules.default.getManualMixMode();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('manual-mix-mode', callback);
    },
  },

  mixMode: {
    set: (key: Types.MixMode): void => {
      modules.default.setMixMode(key);
    },
    get: (): Types.MixMode => {
      return modules.default.getMixMode();
    },
    onUpdate: (callback: (key: Types.MixMode) => void): (() => void) => {
      return modules.default.listen('mix-mode', callback);
    },
  },

  speakingMode: {
    set: (key: Types.SpeakingMode): void => {
      modules.default.setSpeakingMode(key);
    },
    get: (): Types.SpeakingMode => {
      return modules.default.getSpeakingMode();
    },
    onUpdate: (callback: (key: Types.SpeakingMode) => void): (() => void) => {
      return modules.default.listen('speaking-mode', callback);
    },
  },

  defaultSpeakingKey: {
    set: (key: string): void => {
      modules.default.setDefaultSpeakingKey(key);
    },
    get: (): string => {
      return modules.default.getDefaultSpeakingKey();
    },
    onUpdate: (callback: (key: string) => void): (() => void) => {
      return modules.default.listen('default-speaking-key', callback);
    },
  },

  notSaveMessageHistory: {
    set: (enabled: boolean): void => {
      modules.default.setNotSaveMessageHistory(enabled);
    },
    get: (): boolean => {
      return modules.default.getNotSaveMessageHistory();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('not-save-message-history', callback);
    },
  },

  hotKeyOpenMainWindow: {
    set: (key: string): void => {
      modules.default.setHotKeyOpenMainWindow(key);
    },
    get: (): string => {
      return modules.default.getHotKeyOpenMainWindow();
    },
    onUpdate: (callback: (key: string) => void): (() => void) => {
      return modules.default.listen('hot-key-open-main-window', callback);
    },
  },

  hotKeyIncreaseVolume: {
    set: (key: string): void => {
      modules.default.setHotKeyIncreaseVolume(key);
    },
    get: (): string => {
      return modules.default.getHotKeyIncreaseVolume();
    },
    onUpdate: (callback: (key: string) => void): (() => void) => {
      return modules.default.listen('hot-key-increase-volume', callback);
    },
  },

  hotKeyDecreaseVolume: {
    set: (key: string): void => {
      modules.default.setHotKeyDecreaseVolume(key);
    },
    get: (): string => {
      return modules.default.getHotKeyDecreaseVolume();
    },
    onUpdate: (callback: (key: string) => void): (() => void) => {
      return modules.default.listen('hot-key-decrease-volume', callback);
    },
  },

  hotKeyToggleSpeaker: {
    set: (key: string): void => {
      modules.default.setHotKeyToggleSpeaker(key);
    },
    get: (): string => {
      return modules.default.getHotKeyToggleSpeaker();
    },
    onUpdate: (callback: (key: string) => void): (() => void) => {
      return modules.default.listen('hot-key-toggle-speaker', callback);
    },
  },

  hotKeyToggleMicrophone: {
    set: (key: string): void => {
      modules.default.setHotKeyToggleMicrophone(key);
    },
    get: (): string => {
      return modules.default.getHotKeyToggleMicrophone();
    },
    onUpdate: (callback: (key: string) => void): (() => void) => {
      return modules.default.listen('hot-key-toggle-microphone', callback);
    },
  },

  disableAllSoundEffect: {
    set: (enabled: boolean): void => {
      modules.default.setDisableAllSoundEffect(enabled);
    },
    get: (): boolean => {
      return modules.default.getDisableAllSoundEffect();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('disable-all-sound-effect', callback);
    },
  },

  enterVoiceChannelSound: {
    set: (enabled: boolean): void => {
      modules.default.setEnterVoiceChannelSound(enabled);
    },
    get: (): boolean => {
      return modules.default.getEnterVoiceChannelSound();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('enter-voice-channel-sound', callback);
    },
  },

  leaveVoiceChannelSound: {
    set: (enabled: boolean): void => {
      modules.default.setLeaveVoiceChannelSound(enabled);
    },
    get: (): boolean => {
      return modules.default.getLeaveVoiceChannelSound();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('leave-voice-channel-sound', callback);
    },
  },

  startSpeakingSound: {
    set: (enabled: boolean): void => {
      modules.default.setStartSpeakingSound(enabled);
    },
    get: (): boolean => {
      return modules.default.getStartSpeakingSound();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('start-speaking-sound', callback);
    },
  },

  stopSpeakingSound: {
    set: (enabled: boolean): void => {
      modules.default.setStopSpeakingSound(enabled);
    },
    get: (): boolean => {
      return modules.default.getStopSpeakingSound();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('stop-speaking-sound', callback);
    },
  },

  receiveDirectMessageSound: {
    set: (enabled: boolean): void => {
      modules.default.setReceiveDirectMessageSound(enabled);
    },
    get: (): boolean => {
      return modules.default.getReceiveDirectMessageSound();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('receive-direct-message-sound', callback);
    },
  },

  receiveChannelMessageSound: {
    set: (enabled: boolean): void => {
      modules.default.setReceiveChannelMessageSound(enabled);
    },
    get: (): boolean => {
      return modules.default.getReceiveChannelMessageSound();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('receive-channel-message-sound', callback);
    },
  },

  autoCheckForUpdates: {
    set: (enabled: boolean): void => {
      modules.default.setAutoCheckForUpdates(enabled);
    },
    get: (): boolean => {
      return modules.default.getAutoCheckForUpdates();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('auto-check-for-updates', callback);
    },
  },

  updateCheckInterval: {
    set: (interval: number): void => {
      modules.default.setUpdateCheckInterval(interval);
    },
    get: (): number => {
      return modules.default.getUpdateCheckInterval();
    },
    onUpdate: (callback: (interval: number) => void): (() => void) => {
      return modules.default.listen('update-check-interval', callback);
    },
  },

  updateChannel: {
    set: (channel: string): void => {
      modules.default.setUpdateChannel(channel);
    },
    get: (): string => {
      return modules.default.getUpdateChannel();
    },
    onUpdate: (callback: (channel: string) => void): (() => void) => {
      return modules.default.listen('update-channel', callback);
    },
  },
};
