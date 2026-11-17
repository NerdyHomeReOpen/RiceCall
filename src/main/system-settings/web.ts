import type * as Types from '@/types';

import { SYSTEM_FONT_LIST } from '@/constants';

import { store, eventEmitter, getSettings, getLanguage as getLang } from '@/main/web';

export function getSystemSettings(): Types.SystemSettings {
  return getSettings();
}

export function getAutoLogin(): boolean {
  return store.get('autoLogin');
}

export function getAutoLaunch(): boolean {
  return false;
}

export function getAlwaysOnTop(): boolean {
  return store.get('alwaysOnTop');
}

export function getStatusAutoIdle(): boolean {
  return store.get('statusAutoIdle');
}

export function getStatusAutoIdleMinutes(): number {
  return store.get('statusAutoIdleMinutes');
}

export function getStatusAutoDnd(): boolean {
  return store.get('statusAutoDnd');
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

export function getMixEffect(): boolean {
  return store.get('mixEffect');
}

export function getMixEffectType(): string {
  return store.get('mixEffectType');
}

export function getAutoMixSetting(): boolean {
  return store.get('autoMixSetting');
}

export function getEchoCancellation(): boolean {
  return store.get('echoCancellation');
}

export function getNoiseCancellation(): boolean {
  return store.get('noiseCancellation');
}

export function getMicrophoneAmplification(): boolean {
  return store.get('microphoneAmplification');
}

export function getManualMixMode(): boolean {
  return store.get('manualMixMode');
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

export function getEnterVoiceChannelSound(): boolean {
  return store.get('enterVoiceChannelSound');
}

export function getLeaveVoiceChannelSound(): boolean {
  return store.get('leaveVoiceChannelSound');
}

export function getStartSpeakingSound(): boolean {
  return store.get('startSpeakingSound');
}

export function getStopSpeakingSound(): boolean {
  return store.get('stopSpeakingSound');
}

export function getReceiveDirectMessageSound(): boolean {
  return store.get('receiveDirectMessageSound');
}

export function getReceiveChannelMessageSound(): boolean {
  return store.get('receiveChannelMessageSound');
}

export function getAutoCheckForUpdates(): boolean {
  return store.get('autoCheckForUpdates');
}

export function getUpdateCheckInterval(): number {
  return store.get('updateCheckInterval');
}

export function getUpdateChannel(): string {
  return store.get('updateChannel');
}

export function getLanguage(): Types.LanguageKey {
  return store.get('language');
}

export function setAutoLogin(enable: boolean = false): void {
  store.set('autoLogin', enable);
  eventEmitter.emit('auto-login', enable);
}

export function setAutoLaunch(enable: boolean = false): void {
  store.set('autoLaunch', enable);
  eventEmitter.emit('auto-launch', enable);
}

export function setAlwaysOnTop(enable: boolean = false): void {
  store.set('alwaysOnTop', enable);
  eventEmitter.emit('always-on-top', enable);
}

export function setStatusAutoIdle(enable: boolean = false): void {
  store.set('statusAutoIdle', enable);
  eventEmitter.emit('status-auto-idle', enable);
}

export function setStatusAutoIdleMinutes(minutes: number = 10): void {
  store.set('statusAutoIdleMinutes', minutes);
  eventEmitter.emit('status-auto-idle-minutes', minutes);
}

export function setStatusAutoDnd(enable: boolean = false): void {
  store.set('statusAutoDnd', enable);
  eventEmitter.emit('status-auto-dnd', enable);
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

export function setMixEffect(enable: boolean = false): void {
  store.set('mixEffect', enable);
  eventEmitter.emit('mix-effect', enable);
}

export function setMixEffectType(type: string = ''): void {
  store.set('mixEffectType', type);
  eventEmitter.emit('mix-effect-type', type);
}

export function setAutoMixSetting(enable: boolean = false): void {
  store.set('autoMixSetting', enable);
  eventEmitter.emit('auto-mix-setting', enable);
}

export function setEchoCancellation(enable: boolean = false): void {
  store.set('echoCancellation', enable);
  eventEmitter.emit('echo-cancellation', enable);
}

export function setNoiseCancellation(enable: boolean = false): void {
  store.set('noiseCancellation', enable);
  eventEmitter.emit('noise-cancellation', enable);
}

export function setMicrophoneAmplification(enable: boolean = false): void {
  store.set('microphoneAmplification', enable);
  eventEmitter.emit('microphone-amplification', enable);
}

export function setManualMixMode(enable: boolean = false): void {
  store.set('manualMixMode', enable);
  eventEmitter.emit('manual-mix-mode', enable);
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

export function setEnterVoiceChannelSound(enable: boolean = false): void {
  store.set('enterVoiceChannelSound', enable);
  eventEmitter.emit('enter-voice-channel-sound', enable);
}

export function setLeaveVoiceChannelSound(enable: boolean = false): void {
  store.set('leaveVoiceChannelSound', enable);
  eventEmitter.emit('leave-voice-channel-sound', enable);
}

export function setStartSpeakingSound(enable: boolean = false): void {
  store.set('startSpeakingSound', enable);
  eventEmitter.emit('start-speaking-sound', enable);
}

export function setStopSpeakingSound(enable: boolean = false): void {
  store.set('stopSpeakingSound', enable);
  eventEmitter.emit('stop-speaking-sound', enable);
}

export function setReceiveDirectMessageSound(enable: boolean = false): void {
  store.set('receiveDirectMessageSound', enable);
  eventEmitter.emit('receive-direct-message-sound', enable);
}

export function setReceiveChannelMessageSound(enable: boolean = false): void {
  store.set('receiveChannelMessageSound', enable);
  eventEmitter.emit('receive-channel-message-sound', enable);
}

export function setAutoCheckForUpdates(enable: boolean = false): void {
  store.set('autoCheckForUpdates', enable);
  eventEmitter.emit('auto-check-for-updates', enable);
}

export function setUpdateCheckInterval(interval: number = 1 * 60 * 1000): void {
  store.set('updateCheckInterval', interval);
  eventEmitter.emit('update-check-interval', interval);
}

export function setUpdateChannel(channel: string = 'latest'): void {
  store.set('updateChannel', channel);
  eventEmitter.emit('update-channel', channel);
}

export function setLanguage(language: string = getLang()): void {
  store.set('language', language);
  eventEmitter.emit('language', language);
}
