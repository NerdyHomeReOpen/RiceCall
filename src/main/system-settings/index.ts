import type * as Types from '@/types';

import { modules } from '@/main/modules';

export const systemSettings = {
  set: (settings: Partial<Types.SystemSettings>): void => {
    if (settings.isAutoLoginEnabled !== undefined) modules.default.setIsAutoLoginEnabled(settings.isAutoLoginEnabled);
    if (settings.isAutoLaunchEnabled !== undefined) modules.default.setIsAutoLaunchEnabled(settings.isAutoLaunchEnabled);
    if (settings.isAlwaysOnTop !== undefined) modules.default.setIsAlwaysOnTop(settings.isAlwaysOnTop);
    if (settings.isStatusAutoIdleEnabled !== undefined) modules.default.setIsStatusAutoIdleEnabled(settings.isStatusAutoIdleEnabled);
    if (settings.statusAutoIdleMinutes !== undefined) modules.default.setStatusAutoIdleMinutes(settings.statusAutoIdleMinutes);
    if (settings.isStatusAutoDndEnabled !== undefined) modules.default.setIsStatusAutoDndEnabled(settings.isStatusAutoDndEnabled);
    if (settings.channelUIMode !== undefined) modules.default.setChannelUIMode(settings.channelUIMode);
    if (settings.closeToTray !== undefined) modules.default.setCloseToTray(settings.closeToTray);
    if (settings.font !== undefined) modules.default.setFont(settings.font);
    if (settings.fontSize !== undefined) modules.default.setFontSize(settings.fontSize);
    if (settings.inputAudioDevice !== undefined) modules.default.setInputAudioDevice(settings.inputAudioDevice);
    if (settings.outputAudioDevice !== undefined) modules.default.setOutputAudioDevice(settings.outputAudioDevice);
    if (settings.recordFormat !== undefined) modules.default.setRecordFormat(settings.recordFormat);
    if (settings.recordSavePath !== undefined) modules.default.setRecordSavePath(settings.recordSavePath);
    if (settings.isMixEffectEnabled !== undefined) modules.default.setIsMixEffectEnabled(settings.isMixEffectEnabled);
    if (settings.mixEffectType !== undefined) modules.default.setMixEffectType(settings.mixEffectType);
    if (settings.isAutoMixSettingEnabled !== undefined) modules.default.setIsAutoMixSettingEnabled(settings.isAutoMixSettingEnabled);
    if (settings.isEchoCancellationEnabled !== undefined) modules.default.setIsEchoCancellationEnabled(settings.isEchoCancellationEnabled);
    if (settings.isNoiseCancellationEnabled !== undefined) modules.default.setIsNoiseCancellationEnabled(settings.isNoiseCancellationEnabled);
    if (settings.isMicrophoneAmplificationEnabled !== undefined) modules.default.setIsMicrophoneAmplificationEnabled(settings.isMicrophoneAmplificationEnabled);
    if (settings.isManualMixMode !== undefined) modules.default.setIsManualMixMode(settings.isManualMixMode);
    if (settings.mixMode !== undefined) modules.default.setMixMode(settings.mixMode);
    if (settings.speakingMode !== undefined) modules.default.setSpeakingMode(settings.speakingMode);
    if (settings.defaultSpeakingKey !== undefined) modules.default.setDefaultSpeakingKey(settings.defaultSpeakingKey);
    if (settings.disableMessageHistory !== undefined) modules.default.setDisableMessageHistory(settings.disableMessageHistory);
    if (settings.hotKeyOpenMainWindow !== undefined) modules.default.setHotKeyOpenMainWindow(settings.hotKeyOpenMainWindow);
    if (settings.hotKeyIncreaseVolume !== undefined) modules.default.setHotKeyIncreaseVolume(settings.hotKeyIncreaseVolume);
    if (settings.hotKeyDecreaseVolume !== undefined) modules.default.setHotKeyDecreaseVolume(settings.hotKeyDecreaseVolume);
    if (settings.hotKeyToggleSpeaker !== undefined) modules.default.setHotKeyToggleSpeaker(settings.hotKeyToggleSpeaker);
    if (settings.hotKeyToggleMicrophone !== undefined) modules.default.setHotKeyToggleMicrophone(settings.hotKeyToggleMicrophone);
    if (settings.disableAllSoundEffect !== undefined) modules.default.setDisableAllSoundEffect(settings.disableAllSoundEffect);
    if (settings.isEnterVoiceChannelSoundEnabled !== undefined) modules.default.setIsEnterVoiceChannelSoundEnabled(settings.isEnterVoiceChannelSoundEnabled);
    if (settings.isLeaveVoiceChannelSoundEnabled !== undefined) modules.default.setIsLeaveVoiceChannelSoundEnabled(settings.isLeaveVoiceChannelSoundEnabled);
    if (settings.isStartSpeakingSoundEnabled !== undefined) modules.default.setIsStartSpeakingSoundEnabled(settings.isStartSpeakingSoundEnabled);
    if (settings.isStopSpeakingSoundEnabled !== undefined) modules.default.setIsStopSpeakingSoundEnabled(settings.isStopSpeakingSoundEnabled);
    if (settings.isReceiveDirectMessageSoundEnabled !== undefined) modules.default.setIsReceiveDirectMessageSoundEnabled(settings.isReceiveDirectMessageSoundEnabled);
    if (settings.isReceiveChannelMessageSoundEnabled !== undefined) modules.default.setIsReceiveChannelMessageSoundEnabled(settings.isReceiveChannelMessageSoundEnabled);
    if (settings.isAutoCheckForUpdatesEnabled !== undefined) modules.default.setIsAutoCheckForUpdatesEnabled(settings.isAutoCheckForUpdatesEnabled);
    if (settings.updateCheckInterval !== undefined) modules.default.setUpdateCheckInterval(settings.updateCheckInterval);
    if (settings.updateChannel !== undefined) modules.default.setUpdateChannel(settings.updateChannel);
  },
  get: (): Types.SystemSettings | null => {
    return modules.default.getSystemSettings();
  },
  isAutoLoginEnabled: {
    set: (enable: boolean): void => {
      modules.default.setIsAutoLoginEnabled(enable);
    },
    get: (): boolean => {
      return modules.default.getIsAutoLoginEnabled();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('is-auto-login-enabled', callback);
    },
  },
  isAutoLaunchEnabled: {
    set: (enable: boolean): void => {
      modules.default.setIsAutoLaunchEnabled(enable);
    },
    get: (): boolean => {
      return modules.default.getIsAutoLaunchEnabled();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('is-auto-launch-enabled', callback);
    },
  },
  isAlwaysOnTop: {
    set: (enable: boolean): void => {
      modules.default.setIsAlwaysOnTop(enable);
    },
    get: (): boolean => {
      return modules.default.getIsAlwaysOnTop();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('is-always-on-top', callback);
    },
  },
  isStatusAutoIdleEnabled: {
    set: (enable: boolean): void => {
      modules.default.setIsStatusAutoIdleEnabled(enable);
    },
    get: (): boolean => {
      return modules.default.getIsStatusAutoIdleEnabled();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('is-status-auto-idle-enabled', callback);
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
  isStatusAutoDndEnabled: {
    set: (enable: boolean): void => {
      modules.default.setIsStatusAutoDndEnabled(enable);
    },
    get: (): boolean => {
      return modules.default.getIsStatusAutoDndEnabled();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('is-status-auto-dnd-enabled', callback);
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
    onUpdate: (callback: (format: Types.RecordFormat) => void): (() => void) => {
      return modules.default.listen('record-format', callback);
    },
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
  isMixEffectEnabled: {
    set: (enabled: boolean): void => {
      modules.default.setIsMixEffectEnabled(enabled);
    },
    get: (): boolean => {
      return modules.default.getIsMixEffectEnabled();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('is-mix-effect-enabled', callback);
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
  isAutoMixSettingEnabled: {
    set: (enabled: boolean): void => {
      modules.default.setIsAutoMixSettingEnabled(enabled);
    },
    get: (): boolean => {
      return modules.default.getIsAutoMixSettingEnabled();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('is-auto-mix-setting-enabled', callback);
    },
  },
  isEchoCancellationEnabled: {
    set: (enabled: boolean): void => {
      modules.default.setIsEchoCancellationEnabled(enabled);
    },
    get: (): boolean => {
      return modules.default.getIsEchoCancellationEnabled();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('is-echo-cancellation-enabled', callback);
    },
  },
  isNoiseCancellationEnabled: {
    set: (enabled: boolean): void => {
      modules.default.setIsNoiseCancellationEnabled(enabled);
    },
    get: (): boolean => {
      return modules.default.getIsNoiseCancellationEnabled();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('is-noise-cancellation-enabled', callback);
    },
  },
  isMicrophoneAmplificationEnabled: {
    set: (enabled: boolean): void => {
      modules.default.setIsMicrophoneAmplificationEnabled(enabled);
    },
    get: (): boolean => {
      return modules.default.getIsMicrophoneAmplificationEnabled();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('is-microphone-amplification-enabled', callback);
    },
  },
  isManualMixMode: {
    set: (enabled: boolean): void => {
      modules.default.setIsManualMixMode(enabled);
    },
    get: (): boolean => {
      return modules.default.getIsManualMixMode();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('is-manual-mix-mode', callback);
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
  disableMessageHistory: {
    set: (enabled: boolean): void => {
      modules.default.setDisableMessageHistory(enabled);
    },
    get: (): boolean => {
      return modules.default.getDisableMessageHistory();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('disable-message-history', callback);
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
  isEnterVoiceChannelSoundEnabled: {
    set: (enabled: boolean): void => {
      modules.default.setIsEnterVoiceChannelSoundEnabled(enabled);
    },
    get: (): boolean => {
      return modules.default.getIsEnterVoiceChannelSoundEnabled();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('is-enter-voice-channel-sound-enabled', callback);
    },
  },
  isLeaveVoiceChannelSoundEnabled: {
    set: (enabled: boolean): void => {
      modules.default.setIsLeaveVoiceChannelSoundEnabled(enabled);
    },
    get: (): boolean => {
      return modules.default.getIsLeaveVoiceChannelSoundEnabled();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('is-leave-voice-channel-sound-enabled', callback);
    },
  },
  isStartSpeakingSoundEnabled: {
    set: (enabled: boolean): void => {
      modules.default.setIsStartSpeakingSoundEnabled(enabled);
    },
    get: (): boolean => {
      return modules.default.getIsStartSpeakingSoundEnabled();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('is-start-speaking-sound-enabled', callback);
    },
  },
  isStopSpeakingSoundEnabled: {
    set: (enabled: boolean): void => {
      modules.default.setIsStopSpeakingSoundEnabled(enabled);
    },
    get: (): boolean => {
      return modules.default.getIsStopSpeakingSoundEnabled();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('is-stop-speaking-sound-enabled', callback);
    },
  },
  isReceiveDirectMessageSoundEnabled: {
    set: (enabled: boolean): void => {
      modules.default.setIsReceiveDirectMessageSoundEnabled(enabled);
    },
    get: (): boolean => {
      return modules.default.getIsReceiveDirectMessageSoundEnabled();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('is-receive-direct-message-sound-enabled', callback);
    },
  },
  isReceiveChannelMessageSoundEnabled: {
    set: (enabled: boolean): void => {
      modules.default.setIsReceiveChannelMessageSoundEnabled(enabled);
    },
    get: (): boolean => {
      return modules.default.getIsReceiveChannelMessageSoundEnabled();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('is-receive-channel-message-sound-enabled', callback);
    },
  },
  isAutoCheckForUpdatesEnabled: {
    set: (enabled: boolean): void => {
      modules.default.setIsAutoCheckForUpdatesEnabled(enabled);
    },
    get: (): boolean => {
      return modules.default.getIsAutoCheckForUpdatesEnabled();
    },
    onUpdate: (callback: (enabled: boolean) => void): (() => void) => {
      return modules.default.listen('is-auto-check-for-updates-enabled', callback);
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
  language: {
    set: (language: Types.Locale): void => {
      modules.default.setLanguage(language);
    },
    get: (): Types.Locale => {
      return modules.default.getLanguage();
    },
    onUpdate: (callback: (language: Types.Locale) => void): (() => void) => {
      return modules.default.listen('language', callback);
    },
  },
};
