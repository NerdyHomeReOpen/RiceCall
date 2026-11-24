import type * as Types from '@/types';

import { SYSTEM_FONT_LIST } from '@/constants';

import { store, eventEmitter, getSettings, getSystemLocale } from '@/main/web';

export function getSystemSettings(): Types.SystemSettings {
  return getSettings();
}

export function getIsAutoLoginEnabled(): boolean {
  return store.get('isAutoLoginEnabled');
}

export function getIsAutoLaunchEnabled(): boolean {
  return false;
}

export function getIsAlwaysOnTop(): boolean {
  return store.get('isAlwaysOnTop');
}

export function getIsStatusAutoIdleEnabled(): boolean {
  return store.get('isStatusAutoIdleEnabled');
}

export function getStatusAutoIdleMinutes(): number {
  return store.get('statusAutoIdleMinutes');
}

export function getIsStatusAutoDndEnabled(): boolean {
  return store.get('isStatusAutoDndEnabled');
}

export function getChannelUIMode(): Types.ChannelUIMode {
  return store.get('channelUIMode');
}

export function getCloseToTray(): boolean {
  return store.get('closeToTray');
}

export function getFont(): string {
  return store.get('font');
}

export function getFontSize(): number {
  return store.get('fontSize');
}

export function getFontList(): string[] {
  const fonts = SYSTEM_FONT_LIST;
  return fonts;
}

export function getInputAudioDevice(): string {
  return store.get('inputAudioDevice');
}

export function getOutputAudioDevice(): string {
  return store.get('outputAudioDevice');
}

export function getRecordFormat(): Types.RecordFormat {
  return store.get('recordFormat');
}

export function getRecordSavePath(): string {
  return store.get('recordSavePath');
}

export function getIsMixEffectEnabled(): boolean {
  return store.get('isMixEffectEnabled');
}

export function getMixEffectType(): string {
  return store.get('mixEffectType');
}

export function getIsAutoMixSettingEnabled(): boolean {
  return store.get('isAutoMixSettingEnabled');
}

export function getIsEchoCancellationEnabled(): boolean {
  return store.get('isEchoCancellationEnabled');
}

export function getIsNoiseCancellationEnabled(): boolean {
  return store.get('isNoiseCancellationEnabled');
}

export function getIsMicrophoneAmplificationEnabled(): boolean {
  return store.get('isMicrophoneAmplificationEnabled');
}

export function getIsManualMixMode(): boolean {
  return store.get('isManualMixMode');
}

export function getMixMode(): Types.MixMode {
  return store.get('mixMode');
}

export function getSpeakingMode(): Types.SpeakingMode {
  return store.get('speakingMode');
}

export function getDefaultSpeakingKey(): string {
  return store.get('defaultSpeakingKey');
}

export function getDisableMessageHistory(): boolean {
  return store.get('disableMessageHistory');
}

export function getHotKeyOpenMainWindow(): string {
  return store.get('hotKeyOpenMainWindow');
}

export function getHotKeyIncreaseVolume(): string {
  return store.get('hotKeyIncreaseVolume');
}

export function getHotKeyDecreaseVolume(): string {
  return store.get('hotKeyDecreaseVolume');
}

export function getHotKeyToggleSpeaker(): string {
  return store.get('hotKeyToggleSpeaker');
}

export function getHotKeyToggleMicrophone(): string {
  return store.get('hotKeyToggleMicrophone');
}

export function getDisableAllSoundEffect(): boolean {
  return store.get('disableAllSoundEffect');
}

export function getIsEnterVoiceChannelSoundEnabled(): boolean {
  return store.get('isEnterVoiceChannelSoundEnabled');
}

export function getIsLeaveVoiceChannelSoundEnabled(): boolean {
  return store.get('isLeaveVoiceChannelSoundEnabled');
}

export function getIsStartSpeakingSoundEnabled(): boolean {
  return store.get('isStartSpeakingSoundEnabled');
}

export function getIsStopSpeakingSoundEnabled(): boolean {
  return store.get('isStopSpeakingSoundEnabled');
}

export function getIsReceiveDirectMessageSoundEnabled(): boolean {
  return store.get('isReceiveDirectMessageSoundEnabled');
}

export function getIsReceiveChannelMessageSoundEnabled(): boolean {
  return store.get('isReceiveChannelMessageSoundEnabled');
}

export function getIsAutoCheckForUpdatesEnabled(): boolean {
  return store.get('isAutoCheckForUpdatesEnabled');
}

export function getUpdateCheckInterval(): number {
  return store.get('updateCheckInterval');
}

export function getUpdateChannel(): string {
  return store.get('updateChannel');
}

export function getLocale(): Types.Locale {
  return store.get('locale');
}

export function setIsAutoLoginEnabled(enable: boolean = false): void {
  store.set('isAutoLoginEnabled', enable);
  eventEmitter.emit('is-auto-login-enabled', enable);
}

export function setIsAutoLaunchEnabled(enable: boolean = false): void {
  store.set('isAutoLaunchEnabled', enable);
  eventEmitter.emit('is-auto-launch-enabled', enable);
}

export function setIsAlwaysOnTop(enable: boolean = false): void {
  store.set('isAlwaysOnTop', enable);
  eventEmitter.emit('is-always-on-top', enable);
}

export function setIsStatusAutoIdleEnabled(enable: boolean = false): void {
  store.set('isStatusAutoIdleEnabled', enable);
  eventEmitter.emit('is-status-auto-idle-enabled', enable);
}

export function setStatusAutoIdleMinutes(minutes: number = 10): void {
  store.set('statusAutoIdleMinutes', minutes);
  eventEmitter.emit('status-auto-idle-minutes', minutes);
}

export function setIsStatusAutoDndEnabled(enable: boolean = false): void {
  store.set('isStatusAutoDndEnabled', enable);
  eventEmitter.emit('is-status-auto-dnd-enabled', enable);
}

export function setChannelUIMode(mode: Types.ChannelUIMode = 'classic'): void {
  store.set('channelUIMode', mode);
  eventEmitter.emit('channel-ui-mode', mode);
}

export function setCloseToTray(enable: boolean = false): void {
  store.set('closeToTray', enable);
  eventEmitter.emit('close-to-tray', enable);
}

export function setFont(font: string = ''): void {
  store.set('font', font);
  eventEmitter.emit('font', font);
}

export function setFontSize(fontSize: number = 13): void {
  store.set('fontSize', fontSize);
  eventEmitter.emit('font-size', fontSize);
}

export function setInputAudioDevice(deviceId: string = ''): void {
  store.set('inputAudioDevice', deviceId);
  eventEmitter.emit('input-audio-device', deviceId);
}

export function setOutputAudioDevice(deviceId: string = ''): void {
  store.set('outputAudioDevice', deviceId);
  eventEmitter.emit('output-audio-device', deviceId);
}

export function setRecordFormat(format: Types.RecordFormat = 'wav'): void {
  store.set('recordFormat', format);
  eventEmitter.emit('record-format', format);
}

export function setRecordSavePath(path: string = ''): void {
  store.set('recordSavePath', path);
  eventEmitter.emit('record-save-path', path);
}

export function setIsMixEffectEnabled(enable: boolean = false): void {
  store.set('isMixEffectEnabled', enable);
  eventEmitter.emit('is-mix-effect-enabled', enable);
}

export function setMixEffectType(type: string = ''): void {
  store.set('mixEffectType', type);
  eventEmitter.emit('mix-effect-type', type);
}

export function setIsAutoMixSettingEnabled(enable: boolean = false): void {
  store.set('isAutoMixSettingEnabled', enable);
  eventEmitter.emit('is-auto-mix-setting-enabled', enable);
}

export function setIsEchoCancellationEnabled(enable: boolean = false): void {
  store.set('isEchoCancellationEnabled', enable);
  eventEmitter.emit('is-echo-cancellation-enabled', enable);
}

export function setIsNoiseCancellationEnabled(enable: boolean = false): void {
  store.set('isNoiseCancellationEnabled', enable);
  eventEmitter.emit('is-noise-cancellation-enabled', enable);
}

export function setIsMicrophoneAmplificationEnabled(enable: boolean = false): void {
  store.set('isMicrophoneAmplificationEnabled', enable);
  eventEmitter.emit('is-microphone-amplification-enabled', enable);
}

export function setIsManualMixMode(enable: boolean = false): void {
  store.set('isManualMixMode', enable);
  eventEmitter.emit('is-manual-mix-mode', enable);
}

export function setMixMode(mode: Types.MixMode = 'all'): void {
  store.set('mixMode', mode);
  eventEmitter.emit('mix-mode', mode);
}

export function setSpeakingMode(mode: 'key' | 'auto' = 'key'): void {
  store.set('speakingMode', mode);
  eventEmitter.emit('speaking-mode', mode);
}

export function setDefaultSpeakingKey(key: string = ''): void {
  store.set('defaultSpeakingKey', key);
  eventEmitter.emit('default-speaking-key', key);
}

export function setDisableMessageHistory(enable: boolean = false): void {
  store.set('disableMessageHistory', enable);
  eventEmitter.emit('disable-message-history', enable);
}

export function setHotKeyOpenMainWindow(key: string = ''): void {
  store.set('hotKeyOpenMainWindow', key);
  eventEmitter.emit('hot-key-open-main-window', key);
}

export function setHotKeyIncreaseVolume(key: string = ''): void {
  store.set('hotKeyIncreaseVolume', key);
  eventEmitter.emit('hot-key-increase-volume', key);
}

export function setHotKeyDecreaseVolume(key: string = ''): void {
  store.set('hotKeyDecreaseVolume', key);
  eventEmitter.emit('hot-key-decrease-volume', key);
}

export function setHotKeyToggleSpeaker(key: string = ''): void {
  store.set('hotKeyToggleSpeaker', key);
  eventEmitter.emit('hot-key-toggle-speaker', key);
}

export function setHotKeyToggleMicrophone(key: string = ''): void {
  store.set('hotKeyToggleMicrophone', key);
  eventEmitter.emit('hot-key-toggle-microphone', key);
}

export function setDisableAllSoundEffect(enable: boolean = false): void {
  store.set('disableAllSoundEffect', enable);
  eventEmitter.emit('disable-all-sound-effect', enable);
}

export function setIsEnterVoiceChannelSoundEnabled(enable: boolean = false): void {
  store.set('isEnterVoiceChannelSoundEnabled', enable);
  eventEmitter.emit('is-enter-voice-channel-sound-enabled', enable);
}

export function setIsLeaveVoiceChannelSoundEnabled(enable: boolean = false): void {
  store.set('isLeaveVoiceChannelSoundEnabled', enable);
  eventEmitter.emit('is-leave-voice-channel-sound-enabled', enable);
}

export function setIsStartSpeakingSoundEnabled(enable: boolean = false): void {
  store.set('isStartSpeakingSoundEnabled', enable);
  eventEmitter.emit('is-start-speaking-sound-enabled', enable);
}

export function setIsStopSpeakingSoundEnabled(enable: boolean = false): void {
  store.set('isStopSpeakingSoundEnabled', enable);
  eventEmitter.emit('is-stop-speaking-sound-enabled', enable);
}

export function setIsReceiveDirectMessageSoundEnabled(enable: boolean = false): void {
  store.set('isReceiveDirectMessageSoundEnabled', enable);
  eventEmitter.emit('is-receive-direct-message-sound-enabled', enable);
}

export function setIsReceiveChannelMessageSoundEnabled(enable: boolean = false): void {
  store.set('isReceiveChannelMessageSoundEnabled', enable);
  eventEmitter.emit('is-receive-channel-message-sound-enabled', enable);
}

export function setIsAutoCheckForUpdatesEnabled(enable: boolean = false): void {
  store.set('isAutoCheckForUpdatesEnabled', enable);
  eventEmitter.emit('is-auto-check-for-updates-enabled', enable);
}

export function setUpdateCheckInterval(interval: number = 1 * 60 * 1000): void {
  store.set('updateCheckInterval', interval);
  eventEmitter.emit('update-check-interval', interval);
}

export function setUpdateChannel(channel: string = 'latest'): void {
  store.set('updateChannel', channel);
  eventEmitter.emit('update-channel', channel);
}

export function setLocale(locale: string = getSystemLocale()): void {
  store.set('locale', locale);
  eventEmitter.emit('locale', locale);
}
