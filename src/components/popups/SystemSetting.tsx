import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';

// CSS
import setting from '@/styles/popups/setting.module.css';
import popup from '@/styles/popup.module.css';

// Providers
import { useTranslation } from 'react-i18next';

// Services
import ipcService from '@/services/ipc.service';

const SystemSettingPopup: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();

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
  const [channelUIMode, setChannelUIMode] = useState<'classic' | 'three-line' | 'auto'>('auto');
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
  const [shareNowGroup, setShareNowGroup] = useState<boolean>(false);
  const [shareRecentGroup, setShareRecentGroup] = useState<boolean>(false);
  const [shareJoinedGroup, setShareJoinedGroup] = useState<boolean>(false);
  const [shareFavoriteGroup, setShareFavoriteGroup] = useState<boolean>(false);
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
  const [hotKeys, setHotKeys] = useState<Record<string, string>>({
    speakingKey: defaultSpeakingKey,
    openMainWindow: hotKeyOpenMainWindow,
    increaseVolume: hotKeyIncreaseVolume,
    decreaseVolume: hotKeyDecreaseVolume,
    toggleSpeaker: hotKeyToggleSpeaker,
    toggleMicrophone: hotKeyToggleMicrophone,
  });

  // Variables
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
    ipcService.window.close();
  };

  const setHotKey = useCallback(
    (key: string, value: string | null) => {
      const target = defaultHotKeyConfig[key as keyof typeof defaultHotKeyConfig];
      const targetValue = value ? value : target.default;
      target.setFunc(targetValue);
    },
    [defaultHotKeyConfig],
  );

  // Effects
  useEffect(() => {
    setHotKeys({
      speakingKey: defaultSpeakingKey,
      openMainWindow: hotKeyOpenMainWindow,
      increaseVolume: hotKeyIncreaseVolume,
      decreaseVolume: hotKeyDecreaseVolume,
      toggleSpeaker: hotKeyToggleSpeaker,
      toggleMicrophone: hotKeyToggleMicrophone,
    });
  }, [defaultSpeakingKey, hotKeyOpenMainWindow, hotKeyIncreaseVolume, hotKeyDecreaseVolume, hotKeyToggleSpeaker, hotKeyToggleMicrophone]);

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
        setHotKey(current, null);
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

      const usedBy = Object.entries(hotKeys)
        .filter(([action, value]) => value === mergeKey && action !== current)
        .map(([, value]) => value);

      if (usedBy.length > 0) {
        setConflicts(usedBy);
      } else {
        setHotKey(current, mergeKey);
        closeDelection();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hotKeys, setHotKey]);

  useEffect(() => {
    ipcService.systemSettings.get((data) => {
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
      setDefaultSpeakingKey(data.defaultSpeakingKey || defaultHotKeyConfig.speakingKey.default);

      // Privacy settings
      setNotSaveMessageHistory(data.notSaveMessageHistory);

      // Hotkeys settings
      setHotKeyOpenMainWindow(data.hotKeyOpenMainWindow || defaultHotKeyConfig.openMainWindow.default);
      setHotKeyIncreaseVolume(data.hotKeyIncreaseVolume || defaultHotKeyConfig.increaseVolume.default);
      setHotKeyDecreaseVolume(data.hotKeyDecreaseVolume || defaultHotKeyConfig.decreaseVolume.default);
      setHotKeyToggleSpeaker(data.hotKeyToggleSpeaker || defaultHotKeyConfig.toggleSpeaker.default);
      setHotKeyToggleMicrophone(data.hotKeyToggleMicrophone || defaultHotKeyConfig.toggleMicrophone.default);

      // SoundEffect settings
      setDisableAllSoundEffect(data.disableAllSoundEffect);
      setEnterVoiceChannelSound(data.enterVoiceChannelSound);
      setLeaveVoiceChannelSound(data.leaveVoiceChannelSound);
      setStartSpeakingSound(data.startSpeakingSound);
      setStopSpeakingSound(data.stopSpeakingSound);
      setReceiveDirectMessageSound(data.receiveDirectMessageSound);
      setReceiveChannelMessageSound(data.receiveChannelMessageSound);
    });

    ipcService.fontList.get((fonts) => {
      setFontList(fonts);
    });

    activeInputRef.current = null;

    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const inputs = devices.filter((device) => device.kind === 'audioinput');
      const outputs = devices.filter((device) => device.kind === 'audiooutput');
      setInputDevices(inputs);
      setOutputDevices(outputs);
    });
  }, [defaultHotKeyConfig, setHotKey]);

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
            <div className={popup['input-group']}>
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
            </div>

            {/* Status Setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('status-setting')}</div>
            </div>
            <div className={`${popup['input-group']}`}>
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
            </div>

            {/* Channel Setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('channel-setting')}</div>
            </div>
            <div className={`${popup['input-group']}`}>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="channel-classic-mode" type="radio" checked={channelUIMode === 'classic'} onChange={() => setChannelUIMode('classic')} />
                <div className={popup['label']}>{t('channel-classic-mode-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="channel-three-line-mode" type="radio" checked={channelUIMode === 'three-line'} onChange={() => setChannelUIMode('three-line')} />
                <div className={popup['label']}>{t('channel-three-line-mode-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="channel-auto-mode" type="radio" checked={channelUIMode === 'auto'} onChange={() => setChannelUIMode('auto')} />
                <div className={popup['label']}>{t('channel-auto-mode-label')}</div>
              </div>
            </div>

            {/* Close Setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('close-setting')}</div>
            </div>
            <div className={`${popup['input-group']}`}>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="close-to-tray" type="radio" checked={closeToTray} onChange={() => setCloseToTray(true)} />
                <div className={popup['label']}>{t('close-to-tray-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="close-to-exit" type="radio" checked={!closeToTray} onChange={() => setCloseToTray(false)} />
                <div className={popup['label']}>{t('close-to-exit-label')}</div>
              </div>
            </div>

            {/* Font Setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('font-setting')}</div>
            </div>
            <div className={`${popup['input-group']} ${popup['row']}`}>
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
                  <input disabled type="number" value={13} min={10} max={20} onChange={(e) => setFontSize(Number(e.target.value))} />
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
            <div className={popup['input-group']}>
              <div className={`${popup['input-box']} ${popup['col']}`}>
                <div className={popup['label']}>{t('input-device-label')}</div>
                <div className={popup['select-box']}>
                  <select value={selectedInput} onChange={(e) => setSelectedInput(e.target.value)} style={{ maxWidth: '300px' }}>
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
                <div className={popup['label']}>{t('output-device-label')}</div>
                <div className={popup['select-box']}>
                  <select value={selectedOutput} onChange={(e) => setSelectedOutput(e.target.value)} style={{ maxWidth: '300px' }}>
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
            </div>

            {/* Mix Setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('mix-setting') + ' ' + t('soon')}</div>
            </div>
            <div className={`${popup['input-group']} ${'disabled'}`}>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="mix-effect" type="checkbox" checked={mixEffect} onChange={(e) => setMixEffect(e.target.checked)} />
                <div className={popup['label']}>{t('mix-effect-label')}</div>
                <div className={popup['select-box']}>
                  <select name="mix-mode" value={mixEffectType} onChange={(e) => setMixEffectType(e.target.value)} style={{ maxWidth: '250px' }}>
                    <option value="">{t('mix-mode-classic')}</option>
                    <option value="">{t('mix-mode-cave')}</option>
                    <option value="">{t('mix-mode-alley')}</option>
                    <option value="">{t('mix-mode-airplane-hangar')}</option>
                    <option value="">{t('mix-mode-staircase')}</option>
                  </select>
                </div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="auto-mix-setting" type="radio" checked={autoMixSetting} onChange={() => setAutoMixSetting(true)} />
                <div className={popup['label']}>{t('auto-mix-setting-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="manual-mix-setting" type="radio" checked={!autoMixSetting} onChange={() => setAutoMixSetting(false)} />
                <div className={popup['label']}>{t('manual-mix-setting-label')}</div>
              </div>
              <div className={popup['input-group']}>
                <div className={`${popup['input-box']} ${popup['row']} ${autoMixSetting && 'disabled'}`}>
                  <input name="echo-cancellation" type="checkbox" checked={echoCancellation} disabled={autoMixSetting} onChange={(e) => setEchoCancellation(e.target.checked)} />
                  <div className={popup['label']}>{t('echo-cancellation-label')}</div>
                </div>
                <div className={`${popup['input-box']} ${popup['row']} ${autoMixSetting && 'disabled'}`}>
                  <input name="noise-cancellation" type="checkbox" checked={noiseCancellation} disabled={autoMixSetting} onChange={(e) => setNoiseCancellation(e.target.checked)} />
                  <div className={popup['label']}>{t('noise-cancellation-label')}</div>
                </div>
                <div className={`${popup['input-box']} ${popup['row']} ${autoMixSetting && 'disabled'}`}>
                  <input name="microphone-amplification" type="checkbox" checked={microphoneAmplification} disabled={autoMixSetting} onChange={(e) => setMicrophoneAmplification(e.target.checked)} />
                  <div className={popup['label']}>{t('microphone-amplification-label')}</div>
                </div>
              </div>
            </div>

            {/* Mix mode setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('mix-mode-setting') + ' ' + t('soon')}</div>
            </div>
            <div className={`${popup['input-group']} ${'disabled'}`}>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="manual-mix-mode" type="checkbox" checked={manualMixMode} onChange={() => setManualMixMode(!manualMixMode)} />
                <div className={popup['label']}>{t('manual-mix-mode-label')}</div>
              </div>
              <div className={popup['input-group']}>
                <div className={`${popup['input-box']} ${popup['row']} ${!manualMixMode && 'disabled'}`}>
                  <input name="mix-all-source" type="radio" checked={mixMode === 'all'} disabled={!manualMixMode} onChange={() => setMixMode('all')} />
                  <div className={popup['label']}>{t('mix-all-source-label')}</div>
                </div>
                <div className={`${popup['input-box']} ${popup['row']} ${!manualMixMode && 'disabled'}`}>
                  <input name="mix-app-source" type="radio" checked={mixMode === 'app'} disabled={!manualMixMode} onChange={() => setMixMode('app')} />
                  <div className={popup['label']}>{t('mix-app-source-label')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Voice Settings */}
        <div className={setting['right']} style={activeTabIndex === 2 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            {/* Default Speaking Mode */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('default-speaking-mode-label')}</div>
            </div>
            <div className={`${popup['input-group']}`}>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="default-speaking-auto" type="radio" checked={defaultSpeakingMode === 'key'} onChange={() => setDefaultSpeakingMode('key')} />
                <div className={popup['label']}>{t('default-speaking-key-label')}</div>
              </div>
              {defaultSpeakingMode == 'key' && (
                <div className={popup['input-group']}>
                  <div key={'speakingKey'} className={popup['input-box']}>
                    <input
                      name="speaking-key"
                      type="text"
                      value={inputFocus === 'speakingKey' ? `> ${hotKeys['speakingKey']} <` : hotKeys['speakingKey']}
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
                  <div className={popup['label']}>{t('speaking-mode-key-label')}</div>
                </div>
              )}
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="default-speaking-auto" type="radio" checked={defaultSpeakingMode === 'auto'} onChange={() => setDefaultSpeakingMode('auto')} />
                <div className={popup['label']}>{t('default-speaking-auto-label')}</div>
              </div>
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
            <div className={`${popup['input-group']} ${'disabled'}`}>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="forbid-add-friend" type="checkbox" checked={forbidAddFriend} onChange={() => setForbidAddFriend(!forbidAddFriend)} />
                <div className={popup['label']}>{t('forbid-add-friend-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="forbid-shake" type="checkbox" checked={forbidShake} onChange={() => setForbidShake(!forbidShake)} />
                <div className={popup['label']}>{t('forbid-shake-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="forbid-invite-group" type="checkbox" checked={forbidInviteGroup} onChange={() => setForbidInviteGroup(!forbidInviteGroup)} />
                <div className={popup['label']}>{t('forbid-invite-group-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="forbid-stranger-message" type="checkbox" checked={forbidStrangerMessage} onChange={() => setForbidStrangerMessage(!forbidStrangerMessage)} />
                <div className={popup['label']}>{t('forbid-stranger-message-label')}</div>
              </div>
            </div>

            {/* Privacy setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('privacy-setting') + ' ' + t('soon')}</div>
            </div>
            <div className={`${popup['input-group']} ${'disabled'}`}>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="share-now-group" type="checkbox" checked={shareNowGroup} onChange={() => setShareNowGroup(!shareNowGroup)} />
                <div className={popup['label']}>{t('share-now-group-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="share-recent-group" type="checkbox" checked={shareRecentGroup} onChange={() => setShareRecentGroup(!shareRecentGroup)} />
                <div className={popup['label']}>{t('share-recent-group-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="share-joined-group" type="checkbox" checked={shareJoinedGroup} onChange={() => setShareJoinedGroup(!shareJoinedGroup)} />
                <div className={popup['label']}>{t('share-joined-group-label')}</div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="share-favorite-group" type="checkbox" checked={shareFavoriteGroup} onChange={() => setShareFavoriteGroup(!shareFavoriteGroup)} />
                <div className={popup['label']}>{t('share-favorite-group-label')}</div>
              </div>
            </div>

            {/* Message history setting */}
            <div className={popup['header']}>
              <div className={popup['label']}>{t('message-history-setting') + ' ' + t('soon')}</div>
            </div>
            <div className={`${popup['input-group']} ${'disabled'}`}>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <input name="not-save-message-history" type="checkbox" checked={notSaveMessageHistory} onChange={() => setNotSaveMessageHistory(!notSaveMessageHistory)} />
                <div className={popup['label']}>{t('not-save-message-history-label')}</div>
              </div>
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
            <div className={`${popup['input-group']}`}>
              <div key={'openMainWindow'} className={`${popup['input-box']} ${popup['col']}`}>
                <div className={popup['label']}>{t('hot-key-open-main-window-label')}</div>
                <input
                  ref={inputRef}
                  name={'hot-key-open-main-window'}
                  type="text"
                  value={inputFocus === 'openMainWindow' ? `> ${hotKeys['openMainWindow']} <` : hotKeys['openMainWindow']}
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
                  value={inputFocus === 'increaseVolume' ? `> ${hotKeys['increaseVolume']} <` : hotKeys['increaseVolume']}
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
                  value={inputFocus === 'decreaseVolume' ? `> ${hotKeys['decreaseVolume']} <` : hotKeys['decreaseVolume']}
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
                  value={inputFocus === 'toggleSpeaker' ? `> ${hotKeys['toggleSpeaker']} <` : hotKeys['toggleSpeaker']}
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
                  value={inputFocus === 'toggleMicrophone' ? `> ${hotKeys['toggleMicrophone']} <` : hotKeys['toggleMicrophone']}
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
            <div className={popup['input-group']}>
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
                      <td>{t('enter-voice-channel-status-label')}</td>
                      <td>
                        <div className={popup['sound-effect-preview']} />
                      </td>
                      <td className={popup['sound-effect-enable']} onClick={() => setEnterVoiceChannelSound(!enterVoiceChannelSound)}>
                        {!enterVoiceChannelSound || disableAllSoundEffect ? <div className={'disabled'}>{t('disable-sound-effect-label')}</div> : <div>{t('enable-sound-effect-label')}</div>}
                      </td>
                    </tr>
                    <tr>
                      <td>{t('leave-voice-channel-status-label')}</td>
                      <td>
                        <div className={popup['sound-effect-preview']} />
                      </td>
                      <td className={popup['sound-effect-enable']} onClick={() => setLeaveVoiceChannelSound(!leaveVoiceChannelSound)}>
                        {!leaveVoiceChannelSound || disableAllSoundEffect ? <div className={'disabled'}>{t('disable-sound-effect-label')}</div> : <div>{t('enable-sound-effect-label')}</div>}
                      </td>
                    </tr>
                    <tr>
                      <td>{t('start-speaking-status-label')}</td>
                      <td>
                        <div className={popup['sound-effect-preview']} />
                      </td>
                      <td className={popup['sound-effect-enable']} onClick={() => setStartSpeakingSound(!startSpeakingSound)}>
                        {!startSpeakingSound || disableAllSoundEffect ? <div className={'disabled'}>{t('disable-sound-effect-label')}</div> : <div>{t('enable-sound-effect-label')}</div>}
                      </td>
                    </tr>
                    <tr>
                      <td>{t('stop-speaking-status-label')}</td>
                      <td>
                        <div className={popup['sound-effect-preview']} />
                      </td>
                      <td className={popup['sound-effect-enable']} onClick={() => setStopSpeakingSound(!stopSpeakingSound)}>
                        {!stopSpeakingSound || disableAllSoundEffect ? <div className={'disabled'}>{t('disable-sound-effect-label')}</div> : <div>{t('enable-sound-effect-label')}</div>}
                      </td>
                    </tr>
                    <tr>
                      <td>{t('receive-direct-message-status-label')}</td>
                      <td>
                        <div className={popup['sound-effect-preview']} />
                      </td>
                      <td className={popup['sound-effect-enable']} onClick={() => setReceiveDirectMessageSound(!receiveDirectMessageSound)}>
                        {!receiveDirectMessageSound || disableAllSoundEffect ? <div className={'disabled'}>{t('disable-sound-effect-label')}</div> : <div>{t('enable-sound-effect-label')}</div>}
                      </td>
                    </tr>
                    <tr>
                      <td>{t('receive-channel-message-status-label')}</td>
                      <td>
                        <div className={popup['sound-effect-preview']} />
                      </td>
                      <td className={popup['sound-effect-enable']} onClick={() => setReceiveChannelMessageSound(!receiveChannelMessageSound)}>
                        {!receiveChannelMessageSound || disableAllSoundEffect ? <div className={'disabled'}>{t('disable-sound-effect-label')}</div> : <div>{t('enable-sound-effect-label')}</div>}
                      </td>
                    </tr>
                  </tbody>
                </table>
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
            // Basic
            ipcService.systemSettings.autoLogin.set(autoLogin);
            ipcService.systemSettings.autoLaunch.set(autoLaunch);
            ipcService.systemSettings.alwaysOnTop.set(alwaysOnTop);

            ipcService.systemSettings.statusAutoIdle.set(statusAutoIdle);
            ipcService.systemSettings.statusAutoIdleMinutes.set(statusAutoIdleMinutes);
            ipcService.systemSettings.statusAutoDnd.set(statusAutoDnd);

            ipcService.systemSettings.channelUIMode.set(channelUIMode);
            ipcService.systemSettings.closeToTray.set(closeToTray);

            ipcService.systemSettings.font.set(fontFamily);
            ipcService.systemSettings.fontSize.set(fontSize);

            // Mix
            ipcService.systemSettings.inputAudioDevice.set(selectedInput);
            ipcService.systemSettings.outputAudioDevice.set(selectedOutput);

            ipcService.systemSettings.mixEffect.set(mixEffect);
            ipcService.systemSettings.mixEffectType.set(mixEffectType);

            ipcService.systemSettings.autoMixSetting.set(autoMixSetting);
            ipcService.systemSettings.echoCancellation.set(echoCancellation);
            ipcService.systemSettings.noiseCancellation.set(noiseCancellation);
            ipcService.systemSettings.microphoneAmplification.set(microphoneAmplification);

            ipcService.systemSettings.manualMixMode.set(manualMixMode);
            ipcService.systemSettings.mixMode.set(mixMode);

            // Voice
            ipcService.systemSettings.speakingMode.set(defaultSpeakingMode);
            ipcService.systemSettings.defaultSpeakingKey.set(defaultSpeakingKey);

            // Privacy
            ipcService.systemSettings.notSaveMessageHistory.set(notSaveMessageHistory);

            // Hotkeys
            ipcService.systemSettings.hotKeyOpenMainWindow.set(hotKeyOpenMainWindow);
            ipcService.systemSettings.hotKeyIncreaseVolume.set(hotKeyIncreaseVolume);
            ipcService.systemSettings.hotKeyDecreaseVolume.set(hotKeyDecreaseVolume);
            ipcService.systemSettings.hotKeyToggleSpeaker.set(hotKeyToggleSpeaker);
            ipcService.systemSettings.hotKeyToggleMicrophone.set(hotKeyToggleMicrophone);

            // SoundEffect
            ipcService.systemSettings.disableAllSoundEffect.set(disableAllSoundEffect);
            ipcService.systemSettings.enterVoiceChannelSound.set(enterVoiceChannelSound);
            ipcService.systemSettings.leaveVoiceChannelSound.set(leaveVoiceChannelSound);
            ipcService.systemSettings.startSpeakingSound.set(startSpeakingSound);
            ipcService.systemSettings.stopSpeakingSound.set(stopSpeakingSound);
            ipcService.systemSettings.receiveDirectMessageSound.set(receiveDirectMessageSound);
            ipcService.systemSettings.receiveChannelMessageSound.set(receiveChannelMessageSound);
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
