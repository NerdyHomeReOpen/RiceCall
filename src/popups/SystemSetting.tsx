import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';

// Types
import type { ChannelUIMode } from '@/types';

// CSS
import setting from '@/styles/popups/setting.module.css';
import popup from '@/styles/popup.module.css';

// Providers
import { useTranslation } from 'react-i18next';
import { useSoundPlayer } from '@/providers/SoundPlayer';

// Services
import ipc from '@/services/ipc.service';

const SystemSettingPopup: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();
  const soundPlayer = useSoundPlayer();

  // Refs
  const activeInputRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // States
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

  const [autoLaunch, setAutoLaunch] = useState<boolean>(false);
  const [autoLogin, setAutoLogin] = useState<boolean>(false);
  const [alwaysOnTop, setAlwaysOnTop] = useState<boolean>(false);
  const [statusAutoIdle, setStatusAutoIdle] = useState<boolean>(true);
  const [statusAutoIdleMinutes, setStatusAutoIdleMinutes] = useState<number>(10);
  const [statusAutoDnd, setStatusAutoDnd] = useState<boolean>(false);
  const [channelUIMode, setChannelUIMode] = useState<ChannelUIMode>('classic');
  const [closeToTray, setCloseToTray] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<number>(13);
  const [fontFamily, setFontFamily] = useState<string>('Arial');
  const [fontList, setFontList] = useState<string[]>([]);

  const [selectedInput, setSelectedInput] = useState<string>('');
  const [selectedOutput, setSelectedOutput] = useState<string>('');
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [mixEffect, setMixEffect] = useState<boolean>(false);
  const [mixEffectType, setMixEffectType] = useState<string>('');
  const [autoMixSetting, setAutoMixSetting] = useState<boolean>(false);
  const [echoCancellation, setEchoCancellation] = useState<boolean>(false);
  const [noiseCancellation, setNoiseCancellation] = useState<boolean>(false);
  const [microphoneAmplification, setMicrophoneAmplification] = useState<boolean>(false);
  const [manualMixMode, setManualMixMode] = useState<boolean>(false);
  const [mixMode, setMixMode] = useState<'all' | 'app'>('all');

  const [defaultSpeakingMode, setDefaultSpeakingMode] = useState<'key' | 'auto'>('key');
  const [defaultSpeakingKey, setDefaultSpeakingKey] = useState<string>('v');

  const [forbidAddFriend, setForbidAddFriend] = useState<boolean>(false);
  const [forbidShake, setForbidShake] = useState<boolean>(false);
  const [forbidInviteGroup, setForbidInviteGroup] = useState<boolean>(false);
  const [forbidStrangerMessage, setForbidStrangerMessage] = useState<boolean>(false);
  const [shareCurrentServer, setShareCurrentServer] = useState<boolean>(false);
  const [shareRecentServer, setShareRecentServer] = useState<boolean>(false);
  const [shareJoinedServer, setShareJoinedServer] = useState<boolean>(false);
  const [shareFavoriteServer, setShareFavoriteServer] = useState<boolean>(false);
  const [notSaveMessageHistory, setNotSaveMessageHistory] = useState<boolean>(false);

  const [hotKeyOpenMainWindow, setHotKeyOpenMainWindow] = useState<string>('F1');
  const [hotKeyIncreaseVolume, setHotKeyIncreaseVolume] = useState<string>('PageUp');
  const [hotKeyDecreaseVolume, setHotKeyDecreaseVolume] = useState<string>('PageDown');
  const [hotKeyToggleSpeaker, setHotKeyToggleSpeaker] = useState<string>('Alt+m');
  const [hotKeyToggleMicrophone, setHotKeyToggleMicrophone] = useState<string>('Alt+v');

  const [disableAllSoundEffect, setDisableAllSoundEffect] = useState<boolean>(false);
  const [enterVoiceChannelSound, setEnterVoiceChannelSound] = useState<boolean>(false);
  const [leaveVoiceChannelSound, setLeaveVoiceChannelSound] = useState<boolean>(false);
  const [startSpeakingSound, setStartSpeakingSound] = useState<boolean>(false);
  const [stopSpeakingSound, setStopSpeakingSound] = useState<boolean>(false);
  const [receiveDirectMessageSound, setReceiveDirectMessageSound] = useState<boolean>(false);
  const [receiveChannelMessageSound, setReceiveChannelMessageSound] = useState<boolean>(false);

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
        handleSetHotKey(current, null);
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
    const data = ipc.systemSettings.get();
    if (data) {
      // Basic settings
      setAutoLogin(data.autoLogin);
      setAutoLaunch(data.autoLaunch);
      setAlwaysOnTop(data.alwaysOnTop);
      setStatusAutoIdle(data.statusAutoIdle);
      setStatusAutoIdleMinutes(data.statusAutoIdleMinutes);
      setStatusAutoDnd(data.statusAutoDnd);
      setChannelUIMode(data.channelUIMode);
      setCloseToTray(data.closeToTray);
      setFontSize(data.fontSize);
      setFontFamily(data.font);
      // Mix Settings
      setSelectedInput(data.inputAudioDevice);
      setSelectedOutput(data.outputAudioDevice);
      setMixEffect(data.mixEffect);
      setMixEffectType(data.mixEffectType);
      setAutoMixSetting(data.autoMixSetting);
      setEchoCancellation(data.echoCancellation);
      setNoiseCancellation(data.noiseCancellation);
      setMicrophoneAmplification(data.microphoneAmplification);
      setManualMixMode(data.manualMixMode);
      setMixMode(data.mixMode);
      // Voice Settings
      setDefaultSpeakingMode(data.speakingMode);
      setDefaultSpeakingKey(data.defaultSpeakingKey);
      // Privacy settings
      setNotSaveMessageHistory(data.notSaveMessageHistory);
      // Hotkeys settings
      setHotKeyOpenMainWindow(data.hotKeyOpenMainWindow);
      setHotKeyIncreaseVolume(data.hotKeyIncreaseVolume);
      setHotKeyDecreaseVolume(data.hotKeyDecreaseVolume);
      setHotKeyToggleSpeaker(data.hotKeyToggleSpeaker);
      setHotKeyToggleMicrophone(data.hotKeyToggleMicrophone);
      // SoundEffect settings
      setDisableAllSoundEffect(data.disableAllSoundEffect);
      setEnterVoiceChannelSound(data.enterVoiceChannelSound);
      setLeaveVoiceChannelSound(data.leaveVoiceChannelSound);
      setStartSpeakingSound(data.startSpeakingSound);
      setStopSpeakingSound(data.stopSpeakingSound);
      setReceiveDirectMessageSound(data.receiveDirectMessageSound);
      setReceiveChannelMessageSound(data.receiveChannelMessageSound);
    }

    setFontList(ipc.fontList.get());

    activeInputRef.current = null;

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

            {/* Mix Setting */}
            <div className={popup['header']}>
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
            </div>

            {/* Mix mode setting */}
            <div className={popup['header']}>
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
            </div>
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
              <div className={popup['label']}>{t('anti-spam-setting') + ' ' + t('soon')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} disabled`}>
              <input name="forbid-add-friend" type="checkbox" checked={forbidAddFriend} onChange={() => setForbidAddFriend(!forbidAddFriend)} />
              <div className={popup['label']}>{t('forbid-add-friend-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} disabled`}>
              <input name="forbid-shake" type="checkbox" checked={forbidShake} onChange={() => setForbidShake(!forbidShake)} />
              <div className={popup['label']}>{t('forbid-shake-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} disabled`}>
              <input name="forbid-invite-group" type="checkbox" checked={forbidInviteGroup} onChange={() => setForbidInviteGroup(!forbidInviteGroup)} />
              <div className={popup['label']}>{t('forbid-invite-group-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} disabled`}>
              <input name="forbid-stranger-message" type="checkbox" checked={forbidStrangerMessage} onChange={() => setForbidStrangerMessage(!forbidStrangerMessage)} />
              <div className={popup['label']}>{t('forbid-stranger-message-label')}</div>
            </div>

            {/* Privacy setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('privacy-setting') + ' ' + t('soon')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} disabled`}>
              <input name="share-current-server" type="checkbox" checked={shareCurrentServer} onChange={() => setShareCurrentServer(!shareCurrentServer)} />
              <div className={popup['label']}>{t('share-current-server-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} disabled`}>
              <input name="share-recent-server" type="checkbox" checked={shareRecentServer} onChange={() => setShareRecentServer(!shareRecentServer)} />
              <div className={popup['label']}>{t('share-recent-server-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} disabled`}>
              <input name="share-joined-server" type="checkbox" checked={shareJoinedServer} onChange={() => setShareJoinedServer(!shareJoinedServer)} />
              <div className={popup['label']}>{t('share-joined-server-label')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} disabled`}>
              <input name="share-favorite-server" type="checkbox" checked={shareFavoriteServer} onChange={() => setShareFavoriteServer(!shareFavoriteServer)} />
              <div className={popup['label']}>{t('share-favorite-server-label')}</div>
            </div>

            {/* Message history setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('message-history-setting') + ' ' + t('soon')}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['row']} disabled`}>
              <input name="not-save-message-history" type="checkbox" checked={notSaveMessageHistory} onChange={() => setNotSaveMessageHistory(!notSaveMessageHistory)} />
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
            // Basic
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
            // Mix
            ipc.systemSettings.inputAudioDevice.set(selectedInput);
            ipc.systemSettings.outputAudioDevice.set(selectedOutput);
            ipc.systemSettings.mixEffect.set(mixEffect);
            ipc.systemSettings.mixEffectType.set(mixEffectType);
            ipc.systemSettings.autoMixSetting.set(autoMixSetting);
            ipc.systemSettings.echoCancellation.set(echoCancellation);
            ipc.systemSettings.noiseCancellation.set(noiseCancellation);
            ipc.systemSettings.microphoneAmplification.set(microphoneAmplification);
            ipc.systemSettings.manualMixMode.set(manualMixMode);
            ipc.systemSettings.mixMode.set(mixMode);
            // Voice
            ipc.systemSettings.speakingMode.set(defaultSpeakingMode);
            ipc.systemSettings.defaultSpeakingKey.set(defaultSpeakingKey);
            // Privacy
            ipc.systemSettings.notSaveMessageHistory.set(notSaveMessageHistory);
            // Hotkeys
            ipc.systemSettings.hotKeyOpenMainWindow.set(hotKeyOpenMainWindow);
            ipc.systemSettings.hotKeyIncreaseVolume.set(hotKeyIncreaseVolume);
            ipc.systemSettings.hotKeyDecreaseVolume.set(hotKeyDecreaseVolume);
            ipc.systemSettings.hotKeyToggleSpeaker.set(hotKeyToggleSpeaker);
            ipc.systemSettings.hotKeyToggleMicrophone.set(hotKeyToggleMicrophone);
            // SoundEffect
            ipc.systemSettings.disableAllSoundEffect.set(disableAllSoundEffect);
            ipc.systemSettings.enterVoiceChannelSound.set(enterVoiceChannelSound);
            ipc.systemSettings.leaveVoiceChannelSound.set(leaveVoiceChannelSound);
            ipc.systemSettings.startSpeakingSound.set(startSpeakingSound);
            ipc.systemSettings.stopSpeakingSound.set(stopSpeakingSound);
            ipc.systemSettings.receiveDirectMessageSound.set(receiveDirectMessageSound);
            ipc.systemSettings.receiveChannelMessageSound.set(receiveChannelMessageSound);
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
