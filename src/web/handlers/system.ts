import * as Types from '@/types';

import { store, eventEmitter, getSettings, getRegion } from '@/web/main';

import { FONT_LIST } from '@/constant';

export function getSystemSettings() {
  return getSettings();
}

export function getAutoLogin() {
  return store.get('autoLogin');
}

export function getAutoLaunch() {
  return false;
}

export function getAlwaysOnTop() {
  return store.get('alwaysOnTop');
}

export function getStatusAutoIdle() {
  return store.get('statusAutoIdle');
}

export function getStatusAutoIdleMinutes() {
  return store.get('statusAutoIdleMinutes');
}

export function getStatusAutoDnd() {
  return store.get('statusAutoDnd');
}

export function getChannelUIMode() {
  return store.get('channelUIMode');
}

export function getCloseToTray() {
  return store.get('closeToTray');
}

export function getFont() {
  return store.get('font');
}

export function getFontSize() {
  return store.get('fontSize');
}

export function getFontList() {
  const fonts = FONT_LIST.map((font) => font.value);
  return fonts;
}

export function getInputAudioDevice() {
  return store.get('inputAudioDevice');
}

export function getOutputAudioDevice() {
  return store.get('outputAudioDevice');
}

export function getRecordFormat() {
  return store.get('recordFormat');
}

export function getRecordSavePath() {
  return store.get('recordSavePath');
}

export function getMixEffect() {
  return store.get('mixEffect');
}

export function getMixEffectType() {
  return store.get('mixEffectType');
}

export function getAutoMixSetting() {
  return store.get('autoMixSetting');
}

export function getEchoCancellation() {
  return store.get('echoCancellation');
}

export function getNoiseCancellation() {
  return store.get('noiseCancellation');
}

export function getMicrophoneAmplification() {
  return store.get('microphoneAmplification');
}

export function getManualMixMode() {
  return store.get('manualMixMode');
}

export function getMixMode() {
  return store.get('mixMode');
}

export function getSpeakingMode() {
  return store.get('speakingMode');
}

export function getDefaultSpeakingKey() {
  return store.get('defaultSpeakingKey');
}

export function getNotSaveMessageHistory() {
  return store.get('notSaveMessageHistory');
}

export function getHotKeyOpenMainWindow() {
  return store.get('hotKeyOpenMainWindow');
}

export function getHotKeyIncreaseVolume() {
  return store.get('hotKeyIncreaseVolume');
}

export function getHotKeyDecreaseVolume() {
  return store.get('hotKeyDecreaseVolume');
}

export function getHotKeyToggleSpeaker() {
  return store.get('hotKeyToggleSpeaker');
}

export function getHotKeyToggleMicrophone() {
  return store.get('hotKeyToggleMicrophone');
}

export function getDisableAllSoundEffect() {
  return store.get('disableAllSoundEffect');
}

export function getEnterVoiceChannelSound() {
  return store.get('enterVoiceChannelSound');
}

export function getLeaveVoiceChannelSound() {
  return store.get('leaveVoiceChannelSound');
}

export function getStartSpeakingSound() {
  return store.get('startSpeakingSound');
}

export function getStopSpeakingSound() {
  return store.get('stopSpeakingSound');
}

export function getReceiveDirectMessageSound() {
  return store.get('receiveDirectMessageSound');
}

export function getReceiveChannelMessageSound() {
  return store.get('receiveChannelMessageSound');
}

export function getAutoCheckForUpdates() {
  return store.get('autoCheckForUpdates');
}

export function getUpdateCheckInterval() {
  return store.get('updateCheckInterval');
}

export function getUpdateChannel() {
  return store.get('updateChannel');
}

export function getLanguage() {
  return store.get('language');
}

export function setAutoLogin(enable: boolean = false) {
  store.set('autoLogin', enable);
  eventEmitter.emit('auto-login', enable);
}

export function setAutoLaunch(enable: boolean = false) {
  store.set('autoLaunch', enable);
  eventEmitter.emit('auto-launch', enable);
}

export function setAlwaysOnTop(enable: boolean = false) {
  store.set('alwaysOnTop', enable);
  eventEmitter.emit('always-on-top', enable);
}

export function setStatusAutoIdle(enable: boolean = false) {
  store.set('statusAutoIdle', enable);
  eventEmitter.emit('status-auto-idle', enable);
}

export function setStatusAutoIdleMinutes(minutes: number = 10) {
  store.set('statusAutoIdleMinutes', minutes);
  eventEmitter.emit('status-auto-idle-minutes', minutes);
}

export function setStatusAutoDnd(enable: boolean = false) {
  store.set('statusAutoDnd', enable);
  eventEmitter.emit('status-auto-dnd', enable);
}

export function setChannelUIMode(mode: Types.ChannelUIMode = 'classic') {
  store.set('channelUIMode', mode);
  eventEmitter.emit('channel-ui-mode', mode);
}

export function setCloseToTray(enable: boolean = false) {
  store.set('closeToTray', enable);
  eventEmitter.emit('close-to-tray', enable);
}

export function setFont(font: string = '') {
  store.set('font', font);
  eventEmitter.emit('font', font);
}

export function setFontSize(fontSize: number = 13) {
  store.set('fontSize', fontSize);
  eventEmitter.emit('font-size', fontSize);
}

export function setInputAudioDevice(deviceId: string = '') {
  store.set('inputAudioDevice', deviceId);
  eventEmitter.emit('input-audio-device', deviceId);
}

export function setOutputAudioDevice(deviceId: string = '') {
  store.set('outputAudioDevice', deviceId);
  eventEmitter.emit('output-audio-device', deviceId);
}

export function setRecordFormat(format: Types.RecordFormat = 'wav') {
  store.set('recordFormat', format);
  eventEmitter.emit('record-format', format);
}

export function setRecordSavePath(path: string = '') {
  store.set('recordSavePath', path);
  eventEmitter.emit('record-save-path', path);
}

export function setMixEffect(enable: boolean = false) {
  store.set('mixEffect', enable);
  eventEmitter.emit('mix-effect', enable);
}

export function setMixEffectType(type: string = '') {
  store.set('mixEffectType', type);
  eventEmitter.emit('mix-effect-type', type);
}

export function setAutoMixSetting(enable: boolean = false) {
  store.set('autoMixSetting', enable);
  eventEmitter.emit('auto-mix-setting', enable);
}

export function setEchoCancellation(enable: boolean = false) {
  store.set('echoCancellation', enable);
  eventEmitter.emit('echo-cancellation', enable);
}

export function setNoiseCancellation(enable: boolean = false) {
  store.set('noiseCancellation', enable);
  eventEmitter.emit('noise-cancellation', enable);
}

export function setMicrophoneAmplification(enable: boolean = false) {
  store.set('microphoneAmplification', enable);
  eventEmitter.emit('microphone-amplification', enable);
}

export function setManualMixMode(enable: boolean = false) {
  store.set('manualMixMode', enable);
  eventEmitter.emit('manual-mix-mode', enable);
}

export function setMixMode(mode: Types.MixMode = 'all') {
  store.set('mixMode', mode);
  eventEmitter.emit('mix-mode', mode);
}

export function setSpeakingMode(mode: 'key' | 'auto' = 'key') {
  store.set('speakingMode', mode);
  eventEmitter.emit('speaking-mode', mode);
}

export function setDefaultSpeakingKey(key: string = '') {
  store.set('defaultSpeakingKey', key);
  eventEmitter.emit('default-speaking-key', key);
}

export function setNotSaveMessageHistory(enable: boolean = false) {
  store.set('notSaveMessageHistory', enable);
  eventEmitter.emit('not-save-message-history', enable);
}

export function setHotKeyOpenMainWindow(key: string = '') {
  store.set('hotKeyOpenMainWindow', key);
  eventEmitter.emit('hot-key-open-main-window', key);
}

export function setHotKeyIncreaseVolume(key: string = '') {
  store.set('hotKeyIncreaseVolume', key);
  eventEmitter.emit('hot-key-increase-volume', key);
}

export function setHotKeyDecreaseVolume(key: string = '') {
  store.set('hotKeyDecreaseVolume', key);
  eventEmitter.emit('hot-key-decrease-volume', key);
}

export function setHotKeyToggleSpeaker(key: string = '') {
  store.set('hotKeyToggleSpeaker', key);
  eventEmitter.emit('hot-key-toggle-speaker', key);
}

export function setHotKeyToggleMicrophone(key: string = '') {
  store.set('hotKeyToggleMicrophone', key);
  eventEmitter.emit('hot-key-toggle-microphone', key);
}

export function setDisableAllSoundEffect(enable: boolean = false) {
  store.set('disableAllSoundEffect', enable);
  eventEmitter.emit('disable-all-sound-effect', enable);
}

export function setEnterVoiceChannelSound(enable: boolean = false) {
  store.set('enterVoiceChannelSound', enable);
  eventEmitter.emit('enter-voice-channel-sound', enable);
}

export function setLeaveVoiceChannelSound(enable: boolean = false) {
  store.set('leaveVoiceChannelSound', enable);
  eventEmitter.emit('leave-voice-channel-sound', enable);
}

export function setStartSpeakingSound(enable: boolean = false) {
  store.set('startSpeakingSound', enable);
  eventEmitter.emit('start-speaking-sound', enable);
}

export function setStopSpeakingSound(enable: boolean = false) {
  store.set('stopSpeakingSound', enable);
  eventEmitter.emit('stop-speaking-sound', enable);
}

export function setReceiveDirectMessageSound(enable: boolean = false) {
  store.set('receiveDirectMessageSound', enable);
  eventEmitter.emit('receive-direct-message-sound', enable);
}

export function setReceiveChannelMessageSound(enable: boolean = false) {
  store.set('receiveChannelMessageSound', enable);
  eventEmitter.emit('receive-channel-message-sound', enable);
}

export function setAutoCheckForUpdates(enable: boolean = false) {
  store.set('autoCheckForUpdates', enable);
  eventEmitter.emit('auto-check-for-updates', enable);
}

export function setUpdateCheckInterval(interval: number = 1 * 60 * 1000) {
  store.set('updateCheckInterval', interval);
  eventEmitter.emit('update-check-interval', interval);
}

export function setUpdateChannel(channel: string = 'latest') {
  store.set('updateChannel', channel);
  eventEmitter.emit('update-channel', channel);
}

export function setLanguage(language: string = getRegion()) {
  store.set('language', language);
  eventEmitter.emit('language', language);
}
