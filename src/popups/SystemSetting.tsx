import React, { useEffect, useState, useRef } from 'react';

// Types
import type { SystemSettings, User, UserSetting } from '@/types';

// CSS
import setting from '@/styles/setting.module.css';
import popup from '@/styles/popup.module.css';

// Providers
import { useTranslation } from 'react-i18next';
import { useSoundPlayer } from '@/providers/SoundPlayer';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { objDiff } from '@/utils/objDiff';

interface SystemSettingPopupProps {
  userId: User['userId'];
  user: User;
  systemSettings: SystemSettings;
}

const SystemSettingPopup: React.FC<SystemSettingPopupProps> = React.memo(({ user: userData, systemSettings: systemSettingsData }) => {
  // Hooks
  const { t } = useTranslation();
  const soundPlayer = useSoundPlayer();

  // Refs
  const activeInputRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // States
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(systemSettingsData);
  const [userSettings, setUserSettings] = useState<UserSetting>(userData);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [fontList, setFontList] = useState<string[]>([]);
  const [inputFocus, setInputFocus] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);

  // Variables
  const {
    autoLogin,
    autoLaunch,
    alwaysOnTop,
    statusAutoIdle,
    statusAutoIdleMinutes,
    statusAutoDnd,
    channelUIMode,
    closeToTray,
    fontSize,
    font,
    inputAudioDevice,
    outputAudioDevice,
    recordFormat,
    echoCancellation,
    noiseCancellation,
    microphoneAmplification,
    speakingMode,
    defaultSpeakingKey,
    hotKeyOpenMainWindow,
    hotKeyIncreaseVolume,
    hotKeyDecreaseVolume,
    hotKeyToggleSpeaker,
    hotKeyToggleMicrophone,
    disableAllSoundEffect,
    enterVoiceChannelSound,
    leaveVoiceChannelSound,
    startSpeakingSound,
    stopSpeakingSound,
    receiveDirectMessageSound,
    receiveChannelMessageSound,
    autoCheckForUpdates,
    updateCheckInterval,
    updateChannel,
  } = systemSettings;
  const { forbidFriendApplications, forbidShakeMessages, forbidMemberInvitations, forbidStrangerMessages, shareCurrentServer, shareRecentServers, shareJoinedServers, shareFavoriteServers } =
    userSettings;

  // Handlers
  const handleEditUserSetting = (update: Partial<UserSetting>) => {
    ipc.socket.send('editUserSetting', { update });
    ipc.window.close();
  };

  const handleCheckForUpdates = () => {
    ipc.checkForUpdates();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  const handlePlaySound = (...args: ('enterVoiceChannel' | 'leaveVoiceChannel' | 'receiveChannelMessage' | 'receiveDirectMessage' | 'startSpeaking' | 'stopSpeaking')[]) => {
    args.forEach((s) => soundPlayer.playSound(s, true));
  };

  // Effects
  useEffect(() => {
    const defaultHotKeyConfig = {
      speakingKey: { default: 'v', setFunc: (value: string) => setSystemSettings((prev) => ({ ...prev, defaultSpeakingKey: value })) },
      openMainWindow: { default: 'F1', setFunc: (value: string) => setSystemSettings((prev) => ({ ...prev, hotKeyOpenMainWindow: value })) },
      increaseVolume: { default: 'PageUp', setFunc: (value: string) => setSystemSettings((prev) => ({ ...prev, hotKeyIncreaseVolume: value })) },
      decreaseVolume: { default: 'PageDown', setFunc: (value: string) => setSystemSettings((prev) => ({ ...prev, hotKeyDecreaseVolume: value })) },
      toggleSpeaker: { default: 'Alt+m', setFunc: (value: string) => setSystemSettings((prev) => ({ ...prev, hotKeyToggleSpeaker: value })) },
      toggleMicrophone: { default: 'Alt+v', setFunc: (value: string) => setSystemSettings((prev) => ({ ...prev, hotKeyToggleMicrophone: value })) },
    };

    const closeDelection = () => {
      setConflicts([]);
      setInputFocus(null);
      activeInputRef.current = null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const current = activeInputRef.current;
      if (!current || e.isComposing) return;

      e.preventDefault();

      // Reset to default
      if (e.key === 'Escape') {
        const target = defaultHotKeyConfig[current as keyof typeof defaultHotKeyConfig];
        target.setFunc(target.default);
        closeDelection();
        return;
      }

      // Set to empty
      if (e.key === 'Backspace') {
        const target = defaultHotKeyConfig[current as keyof typeof defaultHotKeyConfig];
        target.setFunc('');
        closeDelection();
        return;
      }

      if (new Set(['Shift', 'Control', 'Alt', 'Meta']).has(e.key)) return;

      const parts = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.shiftKey) parts.push('Shift');
      if (e.altKey) parts.push('Alt');

      let key = e.key;

      if (key === ' ') key = 'Space';
      if (key === 'Meta') key = 'Cmd';
      if (/^f\d+$/i.test(key)) key = key.toUpperCase();

      parts.push(key.length === 1 ? key.toLowerCase() : key);
      const mergeKey = parts.join('+');

      const usedBy = [
        ['speakingKey', defaultSpeakingKey],
        ['openMainWindow', hotKeyOpenMainWindow],
        ['increaseVolume', hotKeyIncreaseVolume],
        ['decreaseVolume', hotKeyDecreaseVolume],
        ['toggleSpeaker', hotKeyToggleSpeaker],
        ['toggleMicrophone', hotKeyToggleMicrophone],
      ]
        .filter(([action, value]) => value === mergeKey && action !== current)
        .map(([, value]) => value);

      if (usedBy.length > 0) {
        setConflicts(usedBy);
      } else {
        const target = defaultHotKeyConfig[current as keyof typeof defaultHotKeyConfig];
        const targetValue = mergeKey ?? target.default;
        target.setFunc(targetValue);
        closeDelection();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [defaultSpeakingKey, hotKeyOpenMainWindow, hotKeyIncreaseVolume, hotKeyDecreaseVolume, hotKeyToggleSpeaker, hotKeyToggleMicrophone]);

  useEffect(() => {
    setFontList(ipc.fontList.get());

    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const inputs = devices.filter((device) => device.kind === 'audioinput');
      const outputs = devices.filter((device) => device.kind === 'audiooutput');
      setInputDevices(inputs);
      setOutputDevices(outputs);
    });
  }, []);

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        {/* Sidebar */}
        <div className={setting['left']}>
          <div className={setting['tabs']}>
            {[t('basic-setting'), t('audio-setting'), t('voice-setting'), t('privacy-setting'), t('hot-key-setting'), t('sound-effect-setting'), t('update-setting')].map((title, index) => (
              <div className={`${setting['tab']} ${activeTabIndex === index ? setting['active'] : ''}`} onClick={() => setActiveTabIndex(index)} key={index}>
                {title}
              </div>
            ))}
          </div>
        </div>

        {/* Basic Settings */}
        <div className={setting['right']} style={activeTabIndex === 0 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            {/* General Setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('general-setting')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} ${'disabled'}`}>
              <input name="autoLogin" type="checkbox" checked={autoLogin} onChange={(e) => setSystemSettings((prev) => ({ ...prev, autoLogin: e.target.checked }))} />
              <div className={popup['label']}>{t('auto-login-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="autoLaunch" type="checkbox" checked={autoLaunch} onChange={(e) => setSystemSettings((prev) => ({ ...prev, autoLaunch: e.target.checked }))} />
              <div className={popup['label']}>{t('auto-launch-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="alwaysOnTop" type="checkbox" checked={alwaysOnTop} onChange={(e) => setSystemSettings((prev) => ({ ...prev, alwaysOnTop: e.target.checked }))} />
              <div className={popup['label']}>{t('always-on-top-label')}</div>
            </div>

            {/* Status Setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('status-setting')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="status-auto-idle" type="checkbox" checked={statusAutoIdle} onChange={(e) => setSystemSettings((prev) => ({ ...prev, statusAutoIdle: e.target.checked }))} />
              <div className={popup['label']}>
                {t('status-auto-idle-label-1')}
                <input
                  name="status-auto-idle-minutes"
                  type="number"
                  value={statusAutoIdleMinutes}
                  min={1}
                  max={60}
                  style={{ maxWidth: '50px' }}
                  onChange={(e) => setSystemSettings((prev) => ({ ...prev, statusAutoIdleMinutes: Number(e.target.value) }))}
                />
                {t('status-auto-idle-label-2')}
              </div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} ${'disabled'}`}>
              <input name="status-auto-dnd" type="checkbox" checked={statusAutoDnd} onChange={(e) => setSystemSettings((prev) => ({ ...prev, statusAutoDnd: e.target.checked }))} />
              <div className={popup['label']}>{t('status-auto-dnd-label') + ' ' + t('soon')}</div>
            </div>

            {/* Channel Setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('channel-setting')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="channel-classic-mode" type="radio" checked={channelUIMode === 'classic'} onChange={() => setSystemSettings((prev) => ({ ...prev, channelUIMode: 'classic' }))} />
              <div className={popup['label']}>{t('channel-ui-mode-classic-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="channel-three-line-mode" type="radio" checked={channelUIMode === 'three-line'} onChange={() => setSystemSettings((prev) => ({ ...prev, channelUIMode: 'three-line' }))} />
              <div className={popup['label']}>{t('channel-ui-mode-three-line-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} ${'disabled'}`}>
              <input name="channel-auto-mode" type="radio" checked={channelUIMode === 'auto'} onChange={() => setSystemSettings((prev) => ({ ...prev, channelUIMode: 'auto' }))} />
              <div className={popup['label']}>{t('channel-ui-mode-auto-label')}</div>
            </div>

            {/* Close Setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('close-setting')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="close-to-tray" type="radio" checked={closeToTray} onChange={() => setSystemSettings((prev) => ({ ...prev, closeToTray: true }))} />
              <div className={popup['label']}>{t('close-to-tray-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="close-to-exit" type="radio" checked={!closeToTray} onChange={() => setSystemSettings((prev) => ({ ...prev, closeToTray: false }))} />
              <div className={popup['label']}>{t('close-to-exit-label')}</div>
            </div>

            {/* Font Setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('font-setting')}</div>
            </div>
            <div className={popup['row']}>
              <div className={`${popup['input-box']} ${popup['col']}`}>
                <div className={popup['label']}>{t('font')}</div>
                <div className={popup['select-box']}>
                  <select value={font} style={{ minWidth: '100px', fontFamily: font }} onChange={(e) => setSystemSettings((prev) => ({ ...prev, font: e.target.value }))}>
                    {fontList.map((font) => (
                      <option key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={`${popup['input-box']} ${popup['col']}`}>
                <div className={popup['label']}>{t('font-size')}</div>
                <div className={popup['input-box']}>
                  <input type="number" value={fontSize} min={10} max={14} onChange={(e) => setSystemSettings((prev) => ({ ...prev, fontSize: Math.max(10, Math.min(16, Number(e.target.value))) }))} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Settings */}
        <div className={setting['right']} style={activeTabIndex === 1 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            {/* Input/Output Device Setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('audio-setting')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['col']}`}>
              <div className={popup['label']}>{t('input-device')}</div>
              <div className={popup['select-box']} style={{ width: '100%', minWidth: '0' }}>
                <select value={inputAudioDevice} onChange={(e) => setSystemSettings((prev) => ({ ...prev, inputAudioDevice: e.target.value }))}>
                  <option value="">
                    {t('default-microphone')} ({inputDevices[0]?.label || t('unknown-device')})
                  </option>
                  {inputDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `${t('microphone')} ${inputDevices.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={`${popup['input-box']} ${popup['col']}`}>
              <div className={popup['label']}>{t('output-device')}</div>
              <div className={popup['select-box']} style={{ width: '100%', minWidth: '0' }}>
                <select value={outputAudioDevice} onChange={(e) => setSystemSettings((prev) => ({ ...prev, outputAudioDevice: e.target.value }))}>
                  <option value="">
                    {t('default-speaker')} ({outputDevices[0]?.label || t('unknown-device')})
                  </option>
                  {outputDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `${t('speaker')} ${outputDevices.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Record Setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('record-setting')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['col']}`}>
              <div className={popup['label']}>{t('record-format')}</div>
              <div className={popup['select-box']}>
                <select value={recordFormat} onChange={(e) => setSystemSettings((prev) => ({ ...prev, recordFormat: e.target.value as 'wav' | 'mp3' }))}>
                  <option value="wav">{'WAV'}</option>
                  <option value="mp3">{'MP3'}</option>
                </select>
              </div>
            </div>

            {/* Mix Setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('mix-setting')}</div>
            </div>
            {/* <div className={`${popup['input-box']} ${popup['row']} disabled`}>
              <input name="mix-effect" type="checkbox" checked={mixEffect} onChange={(e) => setSystemSettings((prev) => ({ ...prev, mixEffect: e.target.checked }))} />
              <div className={popup['label']}>{t('mix-effect-label')}</div>
              <div className={popup['select-box']} style={{ maxWidth: '100px', minWidth: '0' }}>
                <select name="mix-mode" value={mixEffectType} onChange={(e) => setSystemSettings((prev) => ({ ...prev, mixEffectType: e.target.value }))}>
                  <option value="">{t('mix-mode-classic')}</option>
                  <option value="">{t('mix-mode-cave')}</option>
                  <option value="">{t('mix-mode-alley')}</option>
                  <option value="">{t('mix-mode-airplane-hangar')}</option>
                  <option value="">{t('mix-mode-staircase')}</option>
                </select>
              </div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} disabled`}>
              <input name="mix-setting-auto" type="radio" checked={autoMixSetting} onChange={() => setSystemSettings((prev) => ({ ...prev, autoMixSetting: true }))} />
              <div className={popup['label']}>{t('mix-setting-auto-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} disabled`}>
              <input name="mix-setting-manual" type="radio" checked={!autoMixSetting} onChange={() => setSystemSettings((prev) => ({ ...prev, autoMixSetting: false }))} />
              <div className={popup['label']}>{t('mix-setting-manual-label')}</div>
            </div> */}
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="echo-cancellation" type="checkbox" checked={echoCancellation} onChange={(e) => setSystemSettings((prev) => ({ ...prev, echoCancellation: e.target.checked }))} />
              <div className={popup['label']}>{t('echo-cancellation-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="noise-cancellation" type="checkbox" checked={noiseCancellation} onChange={(e) => setSystemSettings((prev) => ({ ...prev, noiseCancellation: e.target.checked }))} />
              <div className={popup['label']}>{t('noise-cancellation-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input
                name="microphone-amplification"
                type="checkbox"
                checked={microphoneAmplification}
                onChange={(e) => setSystemSettings((prev) => ({ ...prev, microphoneAmplification: e.target.checked }))}
              />
              <div className={popup['label']}>{t('microphone-amplification-label')}</div>
            </div>

            {/* Mix mode setting */}
            {/* <div className={popup['header']}>
              <div className={popup['label']}>{t('mix-mode-setting') + ' ' + t('soon')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} disabled`}>
              <input name="manual-mix-mode" type="checkbox" checked={manualMixMode} onChange={() => setSystemSettings((prev) => ({ ...prev, manualMixMode: !manualMixMode }))} />
              <div className={popup['label']}>{t('manual-mix-mode-label')}</div>
            </div>
            <div className={popup['col']} style={{ marginLeft: '10px' }}>
              <div className={`${popup['input-box']} ${popup['row']} ${!manualMixMode && 'disabled'} disabled`}>
                <input name="mix-all-source" type="radio" checked={mixMode === 'all'} disabled={!manualMixMode} onChange={() => setSystemSettings((prev) => ({ ...prev, mixMode: 'all' }))} />
                <div className={popup['label']}>{t('mix-all-source-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']} ${!manualMixMode && 'disabled'} disabled`}>
                <input name="mix-app-source" type="radio" checked={mixMode === 'app'} disabled={!manualMixMode} onChange={() => setSystemSettings((prev) => ({ ...prev, mixMode: 'app' }))} />
                <div className={popup['label']}>{t('mix-app-source-label')}</div>
              </div>
            </div> */}
          </div>
        </div>

        {/* Voice Settings */}
        <div className={setting['right']} style={activeTabIndex === 2 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            {/* Default Speaking Mode */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('default-speaking-mode')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="default-speaking-auto" type="radio" checked={speakingMode === 'key'} onChange={() => setSystemSettings((prev) => ({ ...prev, speakingMode: 'key' }))} />
              <div className={popup['label']}>{t('default-speaking-mode-key-label')}</div>
            </div>
            {speakingMode == 'key' && (
              <>
                <div key={'speakingKey'} className={popup['input-box']}>
                  <input
                    name="speaking-key"
                    type="text"
                    value={inputFocus === 'speakingKey' ? `> ${defaultSpeakingKey} <` : defaultSpeakingKey}
                    style={{ maxWidth: '200px' }}
                    onClick={() => {
                      activeInputRef.current = 'speakingKey';
                      setInputFocus('speakingKey');
                    }}
                    readOnly
                    onBlur={() => (activeInputRef.current = null)}
                  />
                  {inputFocus === 'speakingKey' && conflicts.length > 0 && <div className={popup['error']}>{t('set-hotkey-error', { '0': conflicts.join(',') })}</div>}
                </div>
                <div className={popup['label']}>{t('setting-speaking-key-description')}</div>
              </>
            )}
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="default-speaking-auto" type="radio" checked={speakingMode === 'auto'} onChange={() => setSystemSettings((prev) => ({ ...prev, speakingMode: 'auto' }))} />
              <div className={popup['label']}>{t('default-speaking-mode-auto-label')}</div>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className={setting['right']} style={activeTabIndex === 3 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            {/* Anti-spam setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('anti-spam-setting')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input
                name="forbid-friend-applications"
                type="checkbox"
                checked={!!forbidFriendApplications}
                onChange={(e) => setUserSettings((prev) => ({ ...prev, forbidFriendApplications: e.target.checked }))}
              />
              <div className={popup['label']}>{t('forbid-friend-applications-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="forbid-shake-messages" type="checkbox" checked={!!forbidShakeMessages} onChange={(e) => setUserSettings((prev) => ({ ...prev, forbidShakeMessages: e.target.checked }))} />
              <div className={popup['label']}>{t('forbid-shake-messages-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input
                name="forbid-member-invitations"
                type="checkbox"
                checked={!!forbidMemberInvitations}
                onChange={(e) => setUserSettings((prev) => ({ ...prev, forbidMemberInvitations: e.target.checked }))}
              />
              <div className={popup['label']}>{t('forbid-member-invitations-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input
                name="forbid-stranger-messages"
                type="checkbox"
                checked={!!forbidStrangerMessages}
                onChange={(e) => setUserSettings((prev) => ({ ...prev, forbidStrangerMessages: e.target.checked }))}
              />
              <div className={popup['label']}>{t('forbid-stranger-messages-label')}</div>
            </div>

            {/* Privacy setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('privacy-setting')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="share-current-server" type="checkbox" checked={!!shareCurrentServer} onChange={(e) => setUserSettings((prev) => ({ ...prev, shareCurrentServer: e.target.checked }))} />
              <div className={popup['label']}>{t('share-current-server-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="share-recent-servers" type="checkbox" checked={!!shareRecentServers} onChange={(e) => setUserSettings((prev) => ({ ...prev, shareRecentServers: e.target.checked }))} />
              <div className={popup['label']}>{t('share-recent-servers-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="share-joined-servers" type="checkbox" checked={!!shareJoinedServers} onChange={(e) => setUserSettings((prev) => ({ ...prev, shareJoinedServers: e.target.checked }))} />
              <div className={popup['label']}>{t('share-joined-servers-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input
                name="share-favorite-servers"
                type="checkbox"
                checked={!!shareFavoriteServers}
                onChange={(e) => setUserSettings((prev) => ({ ...prev, shareFavoriteServers: e.target.checked }))}
              />
              <div className={popup['label']}>{t('share-favorite-servers-label')}</div>
            </div>

            {/* Message history setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('message-history-setting')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} disabled`}>
              <input name="not-save-message-history" type="checkbox" checked={true} onChange={() => setUserSettings((prev) => ({ ...prev, notSaveMessageHistory: true }))} />
              <div className={popup['label']}>{t('not-save-message-history-label') + t('soon')}</div>
            </div>
          </div>
        </div>

        {/* Hot Key Settings */}
        <div className={setting['right']} style={activeTabIndex === 4 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            {/* Hot Key Settings */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('hot-key-setting')}</div>
            </div>
            <div key={'openMainWindow'} className={`${popup['input-box']} ${popup['col']}`}>
              <div className={popup['label']}>{t('hot-key-open-main-window-label')}</div>
              <input
                ref={inputRef}
                name={'hot-key-open-main-window'}
                type="text"
                value={inputFocus === 'openMainWindow' ? `> ${hotKeyOpenMainWindow} <` : hotKeyOpenMainWindow}
                style={{ maxWidth: '300px' }}
                onClick={() => {
                  activeInputRef.current = 'openMainWindow';
                  setInputFocus('openMainWindow');
                }}
                readOnly
                onBlur={() => {
                  setConflicts([]);
                  setInputFocus(null);
                  activeInputRef.current = null;
                }}
              />
              {inputFocus === 'openMainWindow' && conflicts.length > 0 && <div className={popup['error']}>{t('set-hotkey-error', { '0': conflicts.join(',') })}</div>}
            </div>
            <div key={'increaseVolume'} className={`${popup['input-box']} ${popup['col']}`}>
              <div className={popup['label']}>{t('hot-key-increase-volume-label')}</div>
              <input
                ref={inputRef}
                name={'hot-key-increase-volume'}
                type="text"
                value={inputFocus === 'increaseVolume' ? `> ${hotKeyIncreaseVolume} <` : hotKeyIncreaseVolume}
                style={{ maxWidth: '300px' }}
                onClick={() => {
                  activeInputRef.current = 'increaseVolume';
                  setInputFocus('increaseVolume');
                }}
                readOnly
                onBlur={() => {
                  setConflicts([]);
                  setInputFocus(null);
                  activeInputRef.current = null;
                }}
              />
              {inputFocus === 'increaseVolume' && conflicts.length > 0 && <div className={popup['error']}>{t('set-hotkey-error', { '0': conflicts.join(',') })}</div>}
            </div>
            <div key={'decreaseVolume'} className={`${popup['input-box']} ${popup['col']}`}>
              <div className={popup['label']}>{t('hot-key-decrease-volume-label')}</div>
              <input
                ref={inputRef}
                name={'hot-key-decrease-volume'}
                type="text"
                value={inputFocus === 'decreaseVolume' ? `> ${hotKeyDecreaseVolume} <` : hotKeyDecreaseVolume}
                style={{ maxWidth: '300px' }}
                onClick={() => {
                  activeInputRef.current = 'decreaseVolume';
                  setInputFocus('decreaseVolume');
                }}
                readOnly
                onBlur={() => {
                  setConflicts([]);
                  setInputFocus(null);
                  activeInputRef.current = null;
                }}
              />
              {inputFocus === 'decreaseVolume' && conflicts.length > 0 && <div className={popup['error']}>{t('set-hotkey-error', { '0': conflicts.join(',') })}</div>}
            </div>
            <div key={'toggleSpeaker'} className={`${popup['input-box']} ${popup['col']}`}>
              <div className={popup['label']}>{t('hot-key-toggle-speaker-label')}</div>
              <input
                ref={inputRef}
                name={'hot-key-toggle-speaker'}
                type="text"
                value={inputFocus === 'toggleSpeaker' ? `> ${hotKeyToggleSpeaker} <` : hotKeyToggleSpeaker}
                style={{ maxWidth: '300px' }}
                onClick={() => {
                  activeInputRef.current = 'toggleSpeaker';
                  setInputFocus('toggleSpeaker');
                }}
                readOnly
                onBlur={() => {
                  setConflicts([]);
                  setInputFocus(null);
                  activeInputRef.current = null;
                }}
              />
              {inputFocus === 'toggleSpeaker' && conflicts.length > 0 && <div className={popup['error']}>{t('set-hotkey-error', { '0': conflicts.join(',') })}</div>}
            </div>
            <div key={'toggleMicrophone'} className={`${popup['input-box']} ${popup['col']}`}>
              <div className={popup['label']}>{t('hot-key-toggle-microphone-label')}</div>
              <input
                ref={inputRef}
                name={'hot-key-toggle-microphone'}
                type="text"
                value={inputFocus === 'toggleMicrophone' ? `> ${hotKeyToggleMicrophone} <` : hotKeyToggleMicrophone}
                style={{ maxWidth: '300px' }}
                onClick={() => {
                  activeInputRef.current = 'toggleMicrophone';
                  setInputFocus('toggleMicrophone');
                }}
                readOnly
                onBlur={() => {
                  setConflicts([]);
                  setInputFocus(null);
                  activeInputRef.current = null;
                }}
              />
              {inputFocus === 'toggleMicrophone' && conflicts.length > 0 && <div className={popup['error']}>{t('set-hotkey-error', { '0': conflicts.join(',') })}</div>}
            </div>
          </div>
        </div>

        {/* Sound Effect Settings */}
        <div className={setting['right']} style={activeTabIndex === 5 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input
                name="disable-sound-effect-all"
                type="checkbox"
                checked={disableAllSoundEffect}
                onChange={(e) => setSystemSettings((prev) => ({ ...prev, disableAllSoundEffect: e.target.checked }))}
              />
              <div className={popup['label']}>{t('disable-all-sound-effect-label')}</div>
            </div>
            {/* Sound Effect Settings */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('sound-effect-setting')}</div>
            </div>
            <div>{t('sound-effect-setting-description')}</div>
            <div className={`${popup['input-box']} ${popup['col']}`}>
              <table style={{ height: '330px' }}>
                <thead>
                  <tr>
                    <th>{t('sound-effect-type-label')}</th>
                    <th>{t('sound-effect-preview-label')}</th>
                    <th>{t('sound-effect-status-label')}</th>
                  </tr>
                </thead>
                <tbody className={setting['tableContainer']}>
                  <tr>
                    <td>{t('enter-channel-sound-label')}</td>
                    <td>
                      <div className={popup['sound-effect-preview']} onClick={() => handlePlaySound('enterVoiceChannel')} />
                    </td>
                    <td className={popup['sound-effect-enable']} onClick={() => setSystemSettings((prev) => ({ ...prev, enterVoiceChannelSound: !enterVoiceChannelSound }))}>
                      {!enterVoiceChannelSound || disableAllSoundEffect ? <div className={'disabled'}>{t('disable')}</div> : <div>{t('enable')}</div>}
                    </td>
                  </tr>
                  <tr>
                    <td>{t('leave-channel-sound-label')}</td>
                    <td>
                      <div className={popup['sound-effect-preview']} onClick={() => handlePlaySound('leaveVoiceChannel')} />
                    </td>
                    <td className={popup['sound-effect-enable']} onClick={() => setSystemSettings((prev) => ({ ...prev, leaveVoiceChannelSound: !leaveVoiceChannelSound }))}>
                      {!leaveVoiceChannelSound || disableAllSoundEffect ? <div className={'disabled'}>{t('disable')}</div> : <div>{t('enable')}</div>}
                    </td>
                  </tr>
                  <tr>
                    <td>{t('start-speaking-sound-label')}</td>
                    <td>
                      <div className={popup['sound-effect-preview']} onClick={() => handlePlaySound('startSpeaking')} />
                    </td>
                    <td className={popup['sound-effect-enable']} onClick={() => setSystemSettings((prev) => ({ ...prev, startSpeakingSound: !startSpeakingSound }))}>
                      {!startSpeakingSound || disableAllSoundEffect ? <div className={'disabled'}>{t('disable')}</div> : <div>{t('enable')}</div>}
                    </td>
                  </tr>
                  <tr>
                    <td>{t('stop-speaking-sound-label')}</td>
                    <td>
                      <div className={popup['sound-effect-preview']} onClick={() => handlePlaySound('stopSpeaking')} />
                    </td>
                    <td className={popup['sound-effect-enable']} onClick={() => setSystemSettings((prev) => ({ ...prev, stopSpeakingSound: !stopSpeakingSound }))}>
                      {!stopSpeakingSound || disableAllSoundEffect ? <div className={'disabled'}>{t('disable')}</div> : <div>{t('enable')}</div>}
                    </td>
                  </tr>
                  <tr>
                    <td>{t('receive-direct-message-sound-label')}</td>
                    <td>
                      <div className={popup['sound-effect-preview']} onClick={() => handlePlaySound('receiveDirectMessage')} />
                    </td>
                    <td className={popup['sound-effect-enable']} onClick={() => setSystemSettings((prev) => ({ ...prev, receiveDirectMessageSound: !receiveDirectMessageSound }))}>
                      {!receiveDirectMessageSound || disableAllSoundEffect ? <div className={'disabled'}>{t('disable')}</div> : <div>{t('enable')}</div>}
                    </td>
                  </tr>
                  <tr>
                    <td>{t('receive-channel-message-sound-label')}</td>
                    <td>
                      <div className={popup['sound-effect-preview']} onClick={() => handlePlaySound('receiveChannelMessage')} />
                    </td>
                    <td className={popup['sound-effect-enable']} onClick={() => setSystemSettings((prev) => ({ ...prev, receiveChannelMessageSound: !receiveChannelMessageSound }))}>
                      {!receiveChannelMessageSound || disableAllSoundEffect ? <div className={'disabled'}>{t('disable')}</div> : <div>{t('enable')}</div>}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Update Settings */}
        <div className={setting['right']} style={activeTabIndex === 6 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={popup['header']}>
              <div className={popup['label']}>{t('update-setting')}</div>
            </div>
            <div className={popup['row']}>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input
                  name="auto-check-for-updates"
                  type="checkbox"
                  checked={autoCheckForUpdates}
                  onChange={(e) => setSystemSettings((prev) => ({ ...prev, autoCheckForUpdates: e.target.checked }))}
                />
                <div className={popup['label']}>{t('auto-check-for-updates-label')}</div>
              </div>
              <div className={popup['button']} onClick={() => handleCheckForUpdates()}>
                {t('check-for-updates')}
              </div>
            </div>
            <div className={popup['row']}>
              <div className={`${popup['input-box']} ${popup['col']}`}>
                <div className={popup['label']}>{t('update-channel-label')}</div>
                <div className={popup['select-box']} style={{ width: '100%' }}>
                  <select value={updateChannel} onChange={(e) => setSystemSettings((prev) => ({ ...prev, updateChannel: e.target.value }))}>
                    <option value="latest">{t('update-channel-latest-label')}</option>
                    <option value="dev">{t('update-channel-dev-label')}</option>
                  </select>
                </div>
              </div>
              <div className={`${popup['input-box']} ${popup['col']}`}>
                <div className={popup['label']}>{t('update-check-interval-label')}</div>
                <div className={`${popup['input-box']} ${popup['row']}`}>
                  <input
                    name="update-check-interval"
                    type="number"
                    min={1}
                    max={600}
                    value={updateCheckInterval / 60 / 1000}
                    onChange={(e) => setSystemSettings((prev) => ({ ...prev, updateCheckInterval: Math.max(1, Math.min(600, Number(e.target.value))) * 60 * 1000 }))}
                  />
                  <div className={popup['label']}>{t('minute')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={popup['button']}
          onClick={() => {
            ipc.systemSettings.set(objDiff(systemSettings, systemSettingsData));
            handleEditUserSetting(objDiff(userSettings, userData));
          }}
        >
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

SystemSettingPopup.displayName = 'SystemSettingPopup';

export default SystemSettingPopup;
