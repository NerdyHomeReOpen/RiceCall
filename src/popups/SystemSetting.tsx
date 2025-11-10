import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';

// Types
import type { ChannelUIMode, SystemSettings, User, UserSetting } from '@/types';

// CSS
import setting from '@/styles/setting.module.css';
import popup from '@/styles/popup.module.css';

// Providers
import { useTranslation } from 'react-i18next';
import { useSoundPlayer } from '@/providers/SoundPlayer';

// Services
import ipc from '@/services/ipc.service';

interface SystemSettingPopupProps {
  userId: User['userId'];
  user: User;
  systemSettings: SystemSettings;
}

const SystemSettingPopup: React.FC<SystemSettingPopupProps> = React.memo(({ user, systemSettings }) => {
  // Hooks
  const { t } = useTranslation();
  const soundPlayer = useSoundPlayer();

  // Refs
  const activeInputRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // States
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [fontList, setFontList] = useState<string[]>([]);

  const [autoLaunch, setAutoLaunch] = useState<boolean>(systemSettings.autoLaunch);
  const [autoLogin, setAutoLogin] = useState<boolean>(systemSettings.autoLogin);
  const [alwaysOnTop, setAlwaysOnTop] = useState<boolean>(systemSettings.alwaysOnTop);
  const [statusAutoIdle, setStatusAutoIdle] = useState<boolean>(systemSettings.statusAutoIdle);
  const [statusAutoIdleMinutes, setStatusAutoIdleMinutes] = useState<number>(systemSettings.statusAutoIdleMinutes);
  const [statusAutoDnd, setStatusAutoDnd] = useState<boolean>(systemSettings.statusAutoDnd);
  const [channelUIMode, setChannelUIMode] = useState<ChannelUIMode>(systemSettings.channelUIMode);
  const [closeToTray, setCloseToTray] = useState<boolean>(systemSettings.closeToTray);
  const [fontSize, setFontSize] = useState<number>(systemSettings.fontSize);
  const [fontFamily, setFontFamily] = useState<string>(systemSettings.font);

  const [selectedInput, setSelectedInput] = useState<string>(systemSettings.inputAudioDevice);
  const [selectedOutput, setSelectedOutput] = useState<string>(systemSettings.outputAudioDevice);
  const [recordFormat, setRecordFormat] = useState<'wav' | 'mp3'>(systemSettings.recordFormat);
  // const [mixEffect, setMixEffect] = useState<boolean>(systemSettings.mixEffect);
  // const [mixEffectType, setMixEffectType] = useState<string>(systemSettings.mixEffectType);
  // const [autoMixSetting, setAutoMixSetting] = useState<boolean>(systemSettings.autoMixSetting);
  // const [echoCancellation, setEchoCancellation] = useState<boolean>(systemSettings.echoCancellation);
  // const [noiseCancellation, setNoiseCancellation] = useState<boolean>(systemSettings.noiseCancellation);
  // const [microphoneAmplification, setMicrophoneAmplification] = useState<boolean>(systemSettings.microphoneAmplification);
  // const [manualMixMode, setManualMixMode] = useState<boolean>(systemSettings.manualMixMode);
  // const [mixMode, setMixMode] = useState<'all' | 'app'>(systemSettings.mixMode);

  const [defaultSpeakingMode, setDefaultSpeakingMode] = useState<'key' | 'auto'>(systemSettings.speakingMode);
  const [defaultSpeakingKey, setDefaultSpeakingKey] = useState<string>(systemSettings.defaultSpeakingKey);

  const [forbidFriendApplications, setForbidFriendApplications] = useState<boolean>(user.forbidFriendApplications ?? false);
  const [forbidShakeMessages, setForbidShakeMessages] = useState<boolean>(user.forbidShakeMessages ?? false);
  const [forbidMemberInvitations, setForbidMemberInvitations] = useState<boolean>(user.forbidMemberInvitations ?? false);
  const [forbidStrangerMessages, setForbidStrangerMessages] = useState<boolean>(user.forbidStrangerMessages ?? false);
  const [shareCurrentServer, setShareCurrentServer] = useState<boolean>(user.shareCurrentServer ?? false);
  const [shareRecentServers, setShareRecentServers] = useState<boolean>(user.shareRecentServers ?? false);
  const [shareJoinedServers, setShareJoinedServers] = useState<boolean>(user.shareJoinedServers ?? false);
  const [shareFavoriteServers, setShareFavoriteServers] = useState<boolean>(user.shareFavoriteServers ?? false);
  const [notSaveMessageHistory, setNotSaveMessageHistory] = useState<boolean>(systemSettings.notSaveMessageHistory);

  const [hotKeyOpenMainWindow, setHotKeyOpenMainWindow] = useState<string>(systemSettings.hotKeyOpenMainWindow);
  const [hotKeyIncreaseVolume, setHotKeyIncreaseVolume] = useState<string>(systemSettings.hotKeyIncreaseVolume);
  const [hotKeyDecreaseVolume, setHotKeyDecreaseVolume] = useState<string>(systemSettings.hotKeyDecreaseVolume);
  const [hotKeyToggleSpeaker, setHotKeyToggleSpeaker] = useState<string>(systemSettings.hotKeyToggleSpeaker);
  const [hotKeyToggleMicrophone, setHotKeyToggleMicrophone] = useState<string>(systemSettings.hotKeyToggleMicrophone);

  const [disableAllSoundEffect, setDisableAllSoundEffect] = useState<boolean>(systemSettings.disableAllSoundEffect);
  const [enterVoiceChannelSound, setEnterVoiceChannelSound] = useState<boolean>(systemSettings.enterVoiceChannelSound);
  const [leaveVoiceChannelSound, setLeaveVoiceChannelSound] = useState<boolean>(systemSettings.leaveVoiceChannelSound);
  const [startSpeakingSound, setStartSpeakingSound] = useState<boolean>(systemSettings.startSpeakingSound);
  const [stopSpeakingSound, setStopSpeakingSound] = useState<boolean>(systemSettings.stopSpeakingSound);
  const [receiveDirectMessageSound, setReceiveDirectMessageSound] = useState<boolean>(systemSettings.receiveDirectMessageSound);
  const [receiveChannelMessageSound, setReceiveChannelMessageSound] = useState<boolean>(systemSettings.receiveChannelMessageSound);

  // HotKey binds error
  const [inputFocus, setInputFocus] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);

  // Memos
  const defaultHotKeyConfig = useMemo(
    () => ({
      speakingKey: { default: 'v', setFunc: setDefaultSpeakingKey },
      openMainWindow: { default: 'F1', setFunc: setHotKeyOpenMainWindow },
      increaseVolume: { default: 'PageUp', setFunc: setHotKeyIncreaseVolume },
      decreaseVolume: { default: 'PageDown', setFunc: setHotKeyDecreaseVolume },
      toggleSpeaker: { default: 'Alt+m', setFunc: setHotKeyToggleSpeaker },
      toggleMicrophone: { default: 'Alt+v', setFunc: setHotKeyToggleMicrophone },
    }),
    [],
  );

  // Handlers
  const handleEditUserSetting = (update: Partial<UserSetting>) => {
    ipc.socket.send('editUserSetting', { update });
  };

  const handleClose = () => {
    ipc.window.close();
  };

  const handlePlaySound = (...args: ('enterVoiceChannel' | 'leaveVoiceChannel' | 'receiveChannelMessage' | 'receiveDirectMessage' | 'startSpeaking' | 'stopSpeaking')[]) => {
    args.forEach((s) => soundPlayer.playSound(s, true));
  };

  const handleSetHotKey = useCallback(
    (key: string, value: string | null) => {
      const target = defaultHotKeyConfig[key as keyof typeof defaultHotKeyConfig];
      const targetValue = value ?? target.default;
      target.setFunc(targetValue);
    },
    [defaultHotKeyConfig],
  );

  // Effects
  useEffect(() => {
    const closeDelection = () => {
      setConflicts([]);
      setInputFocus(null);
      activeInputRef.current = null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const current = activeInputRef.current;
      if (!current || e.isComposing) return;

      e.preventDefault();

      // leave setting mode
      if (e.key === 'Backspace') {
        closeDelection();
        return;
      }

      // reset to default
      if (e.key === 'Escape') {
        handleSetHotKey(current, '');
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
        handleSetHotKey(current, mergeKey);
        closeDelection();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSetHotKey, defaultSpeakingKey, hotKeyOpenMainWindow, hotKeyIncreaseVolume, hotKeyDecreaseVolume, hotKeyToggleSpeaker, hotKeyToggleMicrophone]);

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
            {[t('basic-setting'), t('audio-setting'), t('voice-setting'), t('privacy-setting'), t('hot-key-setting'), t('sound-effect-setting')].map((title, index) => (
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
              <input name="autoLogin" type="checkbox" checked={autoLogin} onChange={(e) => setAutoLogin(e.target.checked)} />
              <div className={popup['label']}>{t('auto-login-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="autoLaunch" type="checkbox" checked={autoLaunch} onChange={(e) => setAutoLaunch(e.target.checked)} />
              <div className={popup['label']}>{t('auto-launch-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="alwaysOnTop" type="checkbox" checked={alwaysOnTop} onChange={(e) => setAlwaysOnTop(e.target.checked)} />
              <div className={popup['label']}>{t('always-on-top-label')}</div>
            </div>

            {/* Status Setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('status-setting')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="status-auto-idle" type="checkbox" checked={statusAutoIdle} onChange={(e) => setStatusAutoIdle(e.target.checked)} />
              <div className={popup['label']}>
                {t('status-auto-idle-label-1')}
                <input
                  name="status-auto-idle-minutes"
                  type="number"
                  value={statusAutoIdleMinutes}
                  min={1}
                  max={60}
                  style={{ maxWidth: '50px' }}
                  onChange={(e) => setStatusAutoIdleMinutes(Number(e.target.value))}
                />
                {t('status-auto-idle-label-2')}
              </div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} ${'disabled'}`}>
              <input name="status-auto-dnd" type="checkbox" checked={statusAutoDnd} onChange={(e) => setStatusAutoDnd(e.target.checked)} />
              <div className={popup['label']}>{t('status-auto-dnd-label') + ' ' + t('soon')}</div>
            </div>

            {/* Channel Setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('channel-setting')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="channel-classic-mode" type="radio" checked={channelUIMode === 'classic'} onChange={() => setChannelUIMode('classic')} />
              <div className={popup['label']}>{t('channel-ui-mode-classic-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="channel-three-line-mode" type="radio" checked={channelUIMode === 'three-line'} onChange={() => setChannelUIMode('three-line')} />
              <div className={popup['label']}>{t('channel-ui-mode-three-line-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} ${'disabled'}`}>
              <input name="channel-auto-mode" type="radio" checked={channelUIMode === 'auto'} onChange={() => setChannelUIMode('auto')} />
              <div className={popup['label']}>{t('channel-ui-mode-auto-label')}</div>
            </div>

            {/* Close Setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('close-setting')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="close-to-tray" type="radio" checked={closeToTray} onChange={() => setCloseToTray(true)} />
              <div className={popup['label']}>{t('close-to-tray-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="close-to-exit" type="radio" checked={!closeToTray} onChange={() => setCloseToTray(false)} />
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
                  <select value={fontFamily} style={{ minWidth: '100px', fontFamily: fontFamily }} onChange={(e) => setFontFamily(e.target.value)}>
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
                  <input type="number" value={fontSize} min={10} max={14} onChange={(e) => setFontSize(Math.max(10, Math.min(16, Number(e.target.value))))} />
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
                <select value={selectedInput} onChange={(e) => setSelectedInput(e.target.value)}>
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
                <select value={selectedOutput} onChange={(e) => setSelectedOutput(e.target.value)}>
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
                <select value={recordFormat} onChange={(e) => setRecordFormat(e.target.value as 'wav' | 'mp3')}>
                  <option value="wav">{'WAV'}</option>
                  <option value="mp3">{'MP3'}</option>
                </select>
              </div>
            </div>

            {/* Mix Setting */}
            {/* <div className={popup['header']}>
              <div className={popup['label']}>{t('mix-setting') + ' ' + t('soon')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} disabled`}>
              <input name="mix-effect" type="checkbox" checked={mixEffect} onChange={(e) => setMixEffect(e.target.checked)} />
              <div className={popup['label']}>{t('mix-effect-label')}</div>
              <div className={popup['select-box']} style={{ maxWidth: '100px', minWidth: '0' }}>
                <select name="mix-mode" value={mixEffectType} onChange={(e) => setMixEffectType(e.target.value)}>
                  <option value="">{t('mix-mode-classic')}</option>
                  <option value="">{t('mix-mode-cave')}</option>
                  <option value="">{t('mix-mode-alley')}</option>
                  <option value="">{t('mix-mode-airplane-hangar')}</option>
                  <option value="">{t('mix-mode-staircase')}</option>
                </select>
              </div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} disabled`}>
              <input name="mix-setting-auto" type="radio" checked={autoMixSetting} onChange={() => setAutoMixSetting(true)} />
              <div className={popup['label']}>{t('mix-setting-auto-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} disabled`}>
              <input name="mix-setting-manual" type="radio" checked={!autoMixSetting} onChange={() => setAutoMixSetting(false)} />
              <div className={popup['label']}>{t('mix-setting-manual-label')}</div>
            </div>
            <div className={popup['col']} style={{ marginLeft: '10px' }}>
              <div className={`${popup['input-box']} ${popup['row']} ${autoMixSetting && 'disabled'} disabled`}>
                <input name="echo-cancellation" type="checkbox" checked={echoCancellation} disabled={autoMixSetting} onChange={(e) => setEchoCancellation(e.target.checked)} />
                <div className={popup['label']}>{t('echo-cancellation-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']} ${autoMixSetting && 'disabled'} disabled`}>
                <input name="noise-cancellation" type="checkbox" checked={noiseCancellation} disabled={autoMixSetting} onChange={(e) => setNoiseCancellation(e.target.checked)} />
                <div className={popup['label']}>{t('noise-cancellation-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']} ${autoMixSetting && 'disabled'} disabled`}>
                <input name="microphone-amplification" type="checkbox" checked={microphoneAmplification} disabled={autoMixSetting} onChange={(e) => setMicrophoneAmplification(e.target.checked)} />
                <div className={popup['label']}>{t('microphone-amplification-label')}</div>
              </div>
            </div> */}

            {/* Mix mode setting */}
            {/* <div className={popup['header']}>
              <div className={popup['label']}>{t('mix-mode-setting') + ' ' + t('soon')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} disabled`}>
              <input name="manual-mix-mode" type="checkbox" checked={manualMixMode} onChange={() => setManualMixMode(!manualMixMode)} />
              <div className={popup['label']}>{t('manual-mix-mode-label')}</div>
            </div>
            <div className={popup['col']} style={{ marginLeft: '10px' }}>
              <div className={`${popup['input-box']} ${popup['row']} ${!manualMixMode && 'disabled'} disabled`}>
                <input name="mix-all-source" type="radio" checked={mixMode === 'all'} disabled={!manualMixMode} onChange={() => setMixMode('all')} />
                <div className={popup['label']}>{t('mix-all-source-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']} ${!manualMixMode && 'disabled'} disabled`}>
                <input name="mix-app-source" type="radio" checked={mixMode === 'app'} disabled={!manualMixMode} onChange={() => setMixMode('app')} />
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
              <input name="default-speaking-auto" type="radio" checked={defaultSpeakingMode === 'key'} onChange={() => setDefaultSpeakingMode('key')} />
              <div className={popup['label']}>{t('default-speaking-mode-key-label')}</div>
            </div>
            {defaultSpeakingMode == 'key' && (
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
              <input name="default-speaking-auto" type="radio" checked={defaultSpeakingMode === 'auto'} onChange={() => setDefaultSpeakingMode('auto')} />
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
              <input name="forbid-friend-applications" type="checkbox" checked={forbidFriendApplications} onChange={(e) => setForbidFriendApplications(e.target.checked)} />
              <div className={popup['label']}>{t('forbid-friend-applications-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="forbid-shake-messages" type="checkbox" checked={forbidShakeMessages} onChange={(e) => setForbidShakeMessages(e.target.checked)} />
              <div className={popup['label']}>{t('forbid-shake-messages-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="forbid-member-invitations" type="checkbox" checked={forbidMemberInvitations} onChange={(e) => setForbidMemberInvitations(e.target.checked)} />
              <div className={popup['label']}>{t('forbid-member-invitations-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="forbid-stranger-messages" type="checkbox" checked={forbidStrangerMessages} onChange={(e) => setForbidStrangerMessages(e.target.checked)} />
              <div className={popup['label']}>{t('forbid-stranger-messages-label')}</div>
            </div>

            {/* Privacy setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('privacy-setting')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="share-current-server" type="checkbox" checked={shareCurrentServer} onChange={(e) => setShareCurrentServer(e.target.checked)} />
              <div className={popup['label']}>{t('share-current-server-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="share-recent-servers" type="checkbox" checked={shareRecentServers} onChange={(e) => setShareRecentServers(e.target.checked)} />
              <div className={popup['label']}>{t('share-recent-servers-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="share-joined-servers" type="checkbox" checked={shareJoinedServers} onChange={(e) => setShareJoinedServers(e.target.checked)} />
              <div className={popup['label']}>{t('share-joined-servers-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="share-favorite-servers" type="checkbox" checked={shareFavoriteServers} onChange={(e) => setShareFavoriteServers(e.target.checked)} />
              <div className={popup['label']}>{t('share-favorite-servers-label')}</div>
            </div>

            {/* Message history setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('message-history-setting')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']}`}>
              <input name="not-save-message-history" type="checkbox" checked={notSaveMessageHistory} onChange={(e) => setNotSaveMessageHistory(e.target.checked)} />
              <div className={popup['label']}>{t('not-save-message-history-label')}</div>
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
              <input name="disable-sound-effect-all" type="checkbox" checked={disableAllSoundEffect} onChange={(e) => setDisableAllSoundEffect(e.target.checked)} />
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
                    <td className={popup['sound-effect-enable']} onClick={() => setEnterVoiceChannelSound(!enterVoiceChannelSound)}>
                      {!enterVoiceChannelSound || disableAllSoundEffect ? <div className={'disabled'}>{t('disable')}</div> : <div>{t('enable')}</div>}
                    </td>
                  </tr>
                  <tr>
                    <td>{t('leave-channel-sound-label')}</td>
                    <td>
                      <div className={popup['sound-effect-preview']} onClick={() => handlePlaySound('leaveVoiceChannel')} />
                    </td>
                    <td className={popup['sound-effect-enable']} onClick={() => setLeaveVoiceChannelSound(!leaveVoiceChannelSound)}>
                      {!leaveVoiceChannelSound || disableAllSoundEffect ? <div className={'disabled'}>{t('disable')}</div> : <div>{t('enable')}</div>}
                    </td>
                  </tr>
                  <tr>
                    <td>{t('start-speaking-sound-label')}</td>
                    <td>
                      <div className={popup['sound-effect-preview']} onClick={() => handlePlaySound('startSpeaking')} />
                    </td>
                    <td className={popup['sound-effect-enable']} onClick={() => setStartSpeakingSound(!startSpeakingSound)}>
                      {!startSpeakingSound || disableAllSoundEffect ? <div className={'disabled'}>{t('disable')}</div> : <div>{t('enable')}</div>}
                    </td>
                  </tr>
                  <tr>
                    <td>{t('stop-speaking-sound-label')}</td>
                    <td>
                      <div className={popup['sound-effect-preview']} onClick={() => handlePlaySound('stopSpeaking')} />
                    </td>
                    <td className={popup['sound-effect-enable']} onClick={() => setStopSpeakingSound(!stopSpeakingSound)}>
                      {!stopSpeakingSound || disableAllSoundEffect ? <div className={'disabled'}>{t('disable')}</div> : <div>{t('enable')}</div>}
                    </td>
                  </tr>
                  <tr>
                    <td>{t('receive-direct-message-sound-label')}</td>
                    <td>
                      <div className={popup['sound-effect-preview']} onClick={() => handlePlaySound('receiveDirectMessage')} />
                    </td>
                    <td className={popup['sound-effect-enable']} onClick={() => setReceiveDirectMessageSound(!receiveDirectMessageSound)}>
                      {!receiveDirectMessageSound || disableAllSoundEffect ? <div className={'disabled'}>{t('disable')}</div> : <div>{t('enable')}</div>}
                    </td>
                  </tr>
                  <tr>
                    <td>{t('receive-channel-message-sound-label')}</td>
                    <td>
                      <div className={popup['sound-effect-preview']} onClick={() => handlePlaySound('receiveChannelMessage')} />
                    </td>
                    <td className={popup['sound-effect-enable']} onClick={() => setReceiveChannelMessageSound(!receiveChannelMessageSound)}>
                      {!receiveChannelMessageSound || disableAllSoundEffect ? <div className={'disabled'}>{t('disable')}</div> : <div>{t('enable')}</div>}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={popup['button']}
          onClick={() => {
            ipc.systemSettings.autoLogin.set(autoLogin);
            ipc.systemSettings.autoLaunch.set(autoLaunch);
            ipc.systemSettings.alwaysOnTop.set(alwaysOnTop);
            ipc.systemSettings.statusAutoIdle.set(statusAutoIdle);
            ipc.systemSettings.statusAutoIdleMinutes.set(statusAutoIdleMinutes);
            ipc.systemSettings.statusAutoDnd.set(statusAutoDnd);
            ipc.systemSettings.channelUIMode.set(channelUIMode);
            ipc.systemSettings.closeToTray.set(closeToTray);
            ipc.systemSettings.font.set(fontFamily);
            ipc.systemSettings.fontSize.set(fontSize);

            ipc.systemSettings.inputAudioDevice.set(selectedInput);
            ipc.systemSettings.outputAudioDevice.set(selectedOutput);
            ipc.systemSettings.recordFormat.set(recordFormat);
            // ipc.systemSettings.mixEffect.set(mixEffect);
            // ipc.systemSettings.mixEffectType.set(mixEffectType);
            // ipc.systemSettings.autoMixSetting.set(autoMixSetting);
            // ipc.systemSettings.echoCancellation.set(echoCancellation);
            // ipc.systemSettings.noiseCancellation.set(noiseCancellation);
            // ipc.systemSettings.microphoneAmplification.set(microphoneAmplification);
            // ipc.systemSettings.manualMixMode.set(manualMixMode);
            // ipc.systemSettings.mixMode.set(mixMode);

            ipc.systemSettings.speakingMode.set(defaultSpeakingMode);
            ipc.systemSettings.defaultSpeakingKey.set(defaultSpeakingKey);

            ipc.systemSettings.notSaveMessageHistory.set(notSaveMessageHistory);

            ipc.systemSettings.hotKeyOpenMainWindow.set(hotKeyOpenMainWindow);
            ipc.systemSettings.hotKeyIncreaseVolume.set(hotKeyIncreaseVolume);
            ipc.systemSettings.hotKeyDecreaseVolume.set(hotKeyDecreaseVolume);
            ipc.systemSettings.hotKeyToggleSpeaker.set(hotKeyToggleSpeaker);
            ipc.systemSettings.hotKeyToggleMicrophone.set(hotKeyToggleMicrophone);

            ipc.systemSettings.disableAllSoundEffect.set(disableAllSoundEffect);
            ipc.systemSettings.enterVoiceChannelSound.set(enterVoiceChannelSound);
            ipc.systemSettings.leaveVoiceChannelSound.set(leaveVoiceChannelSound);
            ipc.systemSettings.startSpeakingSound.set(startSpeakingSound);
            ipc.systemSettings.stopSpeakingSound.set(stopSpeakingSound);
            ipc.systemSettings.receiveDirectMessageSound.set(receiveDirectMessageSound);
            ipc.systemSettings.receiveChannelMessageSound.set(receiveChannelMessageSound);

            handleEditUserSetting({
              forbidFriendApplications: !!forbidFriendApplications,
              forbidShakeMessages: !!forbidShakeMessages,
              forbidMemberInvitations: !!forbidMemberInvitations,
              forbidStrangerMessages: !!forbidStrangerMessages,
              shareCurrentServer: !!shareCurrentServer,
              shareRecentServers: !!shareRecentServers,
              shareJoinedServers: !!shareJoinedServers,
              shareFavoriteServers: !!shareFavoriteServers,
              notSaveMessageHistory: !!notSaveMessageHistory,
            });
            handleClose();
          }}
        >
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={() => handleClose()}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

SystemSettingPopup.displayName = 'SystemSettingPopup';

export default SystemSettingPopup;
