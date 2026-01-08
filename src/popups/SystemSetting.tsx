import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import { useSoundPlayer } from '@/providers/SoundPlayer';

import ObjDiff from '@/utils/objDiff';

import settingStyles from '@/styles/setting.module.css';
import popupStyles from '@/styles/popup.module.css';

interface SystemSettingPopupProps {
  userSettings: Types.UserSetting;
  systemSettings: Types.SystemSettings;
}

const SystemSettingPopup: React.FC<SystemSettingPopupProps> = React.memo(({ userSettings: userSettingsData, systemSettings: systemSettingsData }) => {
  // Hooks
  const { t } = useTranslation();
  const { playSound } = useSoundPlayer();

  // Refs
  const activeInputRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // States
  const [systemSettings, setSystemSettings] = useState<Types.SystemSettings>(systemSettingsData);
  const [userSettings, setUserSettings] = useState<Types.UserSetting>(userSettingsData);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [fontList, setFontList] = useState<string[]>([]);
  const [inputFocus, setInputFocus] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);

  // Handlers
  const handleAutoLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSystemSettings((prev) => ({ ...prev, autoLogin: e.target.checked }));
  };

  const handleAutoLaunchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSystemSettings((prev) => ({ ...prev, autoLaunch: e.target.checked }));
  };

  const handleAlwaysOnTopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSystemSettings((prev) => ({ ...prev, alwaysOnTop: e.target.checked }));
  };

  const handleStatusAutoIdleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSystemSettings((prev) => ({ ...prev, statusAutoIdle: e.target.checked }));
  };

  const handleStatusAutoIdleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSystemSettings((prev) => ({ ...prev, statusAutoIdleMinutes: Math.max(1, Math.min(60, Number(e.target.value))) }));
  };

  const handleStatusAutoDndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSystemSettings((prev) => ({ ...prev, statusAutoDnd: e.target.checked }));
  };

  const handleChannelUIModeClassicSelect = () => {
    setSystemSettings((prev) => ({ ...prev, channelUIMode: 'classic' }));
  };

  const handleChannelUIModeThreeLineSelect = () => {
    setSystemSettings((prev) => ({ ...prev, channelUIMode: 'three-line' }));
  };

  const handleChannelUIModeAutoSelect = () => {
    setSystemSettings((prev) => ({ ...prev, channelUIMode: 'auto' }));
  };

  const handleCloseToTraySelect = () => {
    setSystemSettings((prev) => ({ ...prev, closeToTray: true }));
  };

  const handleCloseToExitSelect = () => {
    setSystemSettings((prev) => ({ ...prev, closeToTray: false }));
  };

  const handleFontSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSystemSettings((prev) => ({ ...prev, font: e.target.value }));
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSystemSettings((prev) => ({ ...prev, fontSize: Math.max(10, Math.min(14, Number(e.target.value))) }));
  };

  const handleInputAudioDeviceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSystemSettings((prev) => ({ ...prev, inputAudioDevice: e.target.value }));
  };

  const handleOutputAudioDeviceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSystemSettings((prev) => ({ ...prev, outputAudioDevice: e.target.value }));
  };

  const handleRecordFormatSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSystemSettings((prev) => ({ ...prev, recordFormat: e.target.value as Types.RecordFormat }));
  };

  const handleRecordSavePathSelectBtnClick = () => {
    ipc.record.savePath.select().then((path) => {
      if (path) setSystemSettings((prev) => ({ ...prev, recordSavePath: path }));
    });
  };

  const handleEchoCancellationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSystemSettings((prev) => ({ ...prev, echoCancellation: e.target.checked }));
  };

  const handleNoiseCancellationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSystemSettings((prev) => ({ ...prev, noiseCancellation: e.target.checked }));
  };

  const handleMicrophoneAmplificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSystemSettings((prev) => ({ ...prev, microphoneAmplification: e.target.checked }));
  };

  // const handleManualMixModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setSystemSettings((prev) => ({ ...prev, manualMixMode: e.target.checked }));
  // };

  // const handleMixAllSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setSystemSettings((prev) => ({ ...prev, mixMode: 'all' }));
  // };

  // const handleMixAppSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setSystemSettings((prev) => ({ ...prev, mixMode: 'app' }));
  // };

  const handleDefaultSpeakingModeKeyChange = () => {
    setSystemSettings((prev) => ({ ...prev, speakingMode: 'key' }));
  };

  const handleDefaultSpeakingModeAutoChange = () => {
    setSystemSettings((prev) => ({ ...prev, speakingMode: 'auto' }));
  };

  const handleForbidFriendApplicationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSettings((prev) => ({ ...prev, forbidFriendApplications: e.target.checked }));
  };

  const handleForbidShakeMessagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSettings((prev) => ({ ...prev, forbidShakeMessages: e.target.checked }));
  };

  const handleForbidMemberInvitationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSettings((prev) => ({ ...prev, forbidMemberInvitations: e.target.checked }));
  };

  const handleForbidStrangerMessagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSettings((prev) => ({ ...prev, forbidStrangerMessages: e.target.checked }));
  };

  const handleShareCurrentServerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSettings((prev) => ({ ...prev, shareCurrentServer: e.target.checked }));
  };

  const handleShareRecentServersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSettings((prev) => ({ ...prev, shareRecentServers: e.target.checked }));
  };

  const handleShareJoinedServersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSettings((prev) => ({ ...prev, shareJoinedServers: e.target.checked }));
  };

  const handleShareFavoriteServersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSettings((prev) => ({ ...prev, shareFavoriteServers: e.target.checked }));
  };

  const handleNotSaveMessageHistoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSettings((prev) => ({ ...prev, notSaveMessageHistory: e.target.checked }));
  };

  const handleDisableAllSoundEffectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSettings((prev) => ({ ...prev, disableAllSoundEffect: e.target.checked }));
  };

  const handleEnableEnterVoiceChannelSoundChange = () => {
    setSystemSettings((prev) => ({ ...prev, enterVoiceChannelSound: !prev.enterVoiceChannelSound }));
  };

  const handleEnableLeaveVoiceChannelSoundChange = () => {
    setSystemSettings((prev) => ({ ...prev, leaveVoiceChannelSound: !prev.leaveVoiceChannelSound }));
  };

  const handleEnableStartSpeakingSoundChange = () => {
    setSystemSettings((prev) => ({ ...prev, startSpeakingSound: !prev.startSpeakingSound }));
  };

  const handleEnableStopSpeakingSoundChange = () => {
    setSystemSettings((prev) => ({ ...prev, stopSpeakingSound: !prev.stopSpeakingSound }));
  };

  const handleEnableReceiveDirectMessageSoundChange = () => {
    setSystemSettings((prev) => ({ ...prev, receiveDirectMessageSound: !prev.receiveDirectMessageSound }));
  };

  const handleEnableReceiveChannelMessageSoundChange = () => {
    setSystemSettings((prev) => ({ ...prev, receiveChannelMessageSound: !prev.receiveChannelMessageSound }));
  };

  const handleAutoCheckForUpdatesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSystemSettings((prev) => ({ ...prev, autoCheckForUpdates: e.target.checked }));
  };

  const handleUpdateChannelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSystemSettings((prev) => ({ ...prev, updateChannel: e.target.value }));
  };

  const handleCheckForUpdatesBtnClick = () => {
    ipc.checkForUpdates();
  };

  const handleUpdateCheckIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSystemSettings((prev) => ({ ...prev, updateCheckInterval: Math.max(1, Math.min(600, Number(e.target.value))) * 60 * 1000 }));
  };

  const handleSpeakingKeyInputClick = () => {
    activeInputRef.current = 'speakingKey';
    setInputFocus('speakingKey');
  };

  const handleKeyInputBlur = () => {
    setConflicts([]);
    setInputFocus(null);
    activeInputRef.current = null;
  };

  const handleOpenMainWindowInputClick = () => {
    activeInputRef.current = 'openMainWindow';
    setInputFocus('openMainWindow');
  };

  const handleIncreaseVolumeInputClick = () => {
    activeInputRef.current = 'increaseVolume';
    setInputFocus('increaseVolume');
  };

  const handleDecreaseVolumeInputClick = () => {
    activeInputRef.current = 'decreaseVolume';
    setInputFocus('decreaseVolume');
  };

  const handleToggleSpeakerInputClick = () => {
    activeInputRef.current = 'toggleSpeaker';
    setInputFocus('toggleSpeaker');
  };

  const handleToggleMicrophoneInputClick = () => {
    activeInputRef.current = 'toggleMicrophone';
    setInputFocus('toggleMicrophone');
  };

  const handlePlayEnterVoiceChannelSound = () => {
    playSound('enterVoiceChannel', true);
  };

  const handlePlayLeaveVoiceChannelSound = () => {
    playSound('leaveVoiceChannel', true);
  };

  const handlePlayStartSpeakingSound = () => {
    playSound('startSpeaking', true);
  };

  const handlePlayStopSpeakingSound = () => {
    playSound('stopSpeaking', true);
  };

  const handlePlayReceiveDirectMessageSound = () => {
    playSound('receiveDirectMessage', true);
  };

  const handlePlayReceiveChannelMessageSound = () => {
    playSound('receiveChannelMessage', true);
  };

  const handleConfirmBtnClick = () => {
    ipc.systemSettings.set(ObjDiff(systemSettings, systemSettingsData));
    ipc.socket.send('editUserSetting', { update: ObjDiff(userSettings, userSettingsData) });
    ipc.window.close();
  };

  const handleCloseBtnClick = () => {
    ipc.window.close();
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
        ['speakingKey', systemSettings.defaultSpeakingKey],
        ['openMainWindow', systemSettings.hotKeyOpenMainWindow],
        ['increaseVolume', systemSettings.hotKeyIncreaseVolume],
        ['decreaseVolume', systemSettings.hotKeyDecreaseVolume],
        ['toggleSpeaker', systemSettings.hotKeyToggleSpeaker],
        ['toggleMicrophone', systemSettings.hotKeyToggleMicrophone],
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
  }, [
    systemSettings.defaultSpeakingKey,
    systemSettings.hotKeyOpenMainWindow,
    systemSettings.hotKeyIncreaseVolume,
    systemSettings.hotKeyDecreaseVolume,
    systemSettings.hotKeyToggleSpeaker,
    systemSettings.hotKeyToggleMicrophone,
  ]);

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
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={settingStyles['left']}>
          <div className={settingStyles['tabs']}>
            {[t('basic-setting'), t('audio-setting'), t('voice-setting'), t('privacy-setting'), t('hot-key-setting'), t('sound-effect-setting'), t('update-setting')].map((title, index) => (
              <div className={`${settingStyles['tab']} ${activeTabIndex === index ? settingStyles['active'] : ''}`} onClick={() => setActiveTabIndex(index)} key={index}>
                {title}
              </div>
            ))}
          </div>
        </div>
        <div className={settingStyles['right']} style={activeTabIndex === 0 ? {} : { display: 'none' }}>
          <div className={popupStyles['col']}>
            <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('general-setting')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']} ${'disabled'}`}>
              <input name="autoLogin" type="checkbox" checked={systemSettings.autoLogin} onChange={handleAutoLoginChange} />
              <div className={popupStyles['label']}>{t('auto-login-label')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
              <input name="autoLaunch" type="checkbox" checked={systemSettings.autoLaunch} onChange={handleAutoLaunchChange} />
              <div className={popupStyles['label']}>{t('auto-launch-label')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
              <input name="alwaysOnTop" type="checkbox" checked={systemSettings.alwaysOnTop} onChange={handleAlwaysOnTopChange} />
              <div className={popupStyles['label']}>{t('always-on-top-label')}</div>
            </div>
            <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('status-setting')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
              <input name="status-auto-idle" type="checkbox" checked={systemSettings.statusAutoIdle} onChange={handleStatusAutoIdleChange} />
              <div className={popupStyles['label']}>
                {t('status-auto-idle-label-1')}
                <input
                  name="status-auto-idle-minutes"
                  type="number"
                  value={systemSettings.statusAutoIdleMinutes}
                  min={1}
                  max={60}
                  style={{ maxWidth: '50px' }}
                  onChange={handleStatusAutoIdleMinutesChange}
                />
                {t('status-auto-idle-label-2')}
              </div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']} ${'disabled'}`}>
              <input name="status-auto-dnd" type="checkbox" checked={systemSettings.statusAutoDnd} onChange={handleStatusAutoDndChange} />
              <div className={popupStyles['label']}>{t('status-auto-dnd-label') + ' ' + t('soon')}</div>
            </div>
            <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('channel-setting')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
              <input name="channel-classic-mode" type="radio" checked={systemSettings.channelUIMode === 'classic'} onChange={handleChannelUIModeClassicSelect} />
              <div className={popupStyles['label']}>{t('channel-ui-mode-classic-label')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
              <input name="channel-three-line-mode" type="radio" checked={systemSettings.channelUIMode === 'three-line'} onChange={handleChannelUIModeThreeLineSelect} />
              <div className={popupStyles['label']}>{t('channel-ui-mode-three-line-label')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']} ${'disabled'}`}>
              <input name="channel-auto-mode" type="radio" checked={systemSettings.channelUIMode === 'auto'} onChange={handleChannelUIModeAutoSelect} />
              <div className={popupStyles['label']}>{t('channel-ui-mode-auto-label')}</div>
            </div>
            <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('close-setting')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
              <input name="close-to-tray" type="radio" checked={systemSettings.closeToTray} onChange={handleCloseToTraySelect} />
              <div className={popupStyles['label']}>{t('close-to-tray-label')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
              <input name="close-to-exit" type="radio" checked={!systemSettings.closeToTray} onChange={handleCloseToExitSelect} />
              <div className={popupStyles['label']}>{t('close-to-exit-label')}</div>
            </div>
            <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('font-setting')}</div>
            </div>
            <div className={popupStyles['row']}>
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <div className={popupStyles['label']}>{t('font')}</div>
                <div className={popupStyles['select-box']}>
                  <select value={systemSettings.font} style={{ minWidth: '100px', fontFamily: systemSettings.font }} onChange={handleFontSelect}>
                    {fontList.map((font) => (
                      <option key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <div className={popupStyles['label']}>{t('font-size')}</div>
                <div className={popupStyles['input-box']}>
                  <input type="number" value={systemSettings.fontSize} min={10} max={14} onChange={handleFontSizeChange} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={settingStyles['right']} style={activeTabIndex === 1 ? {} : { display: 'none' }}>
          <div className={popupStyles['col']}>
            <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('audio-setting')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
              <div className={popupStyles['label']}>{t('input-device')}</div>
              <div className={popupStyles['select-box']} style={{ width: '100%', minWidth: '0' }}>
                <select value={systemSettings.inputAudioDevice} onChange={handleInputAudioDeviceSelect}>
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
            <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
              <div className={popupStyles['label']}>{t('output-device')}</div>
              <div className={popupStyles['select-box']} style={{ width: '100%', minWidth: '0' }}>
                <select value={systemSettings.outputAudioDevice} onChange={handleOutputAudioDeviceSelect}>
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
            <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('record-setting')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
              <div className={popupStyles['label']}>{t('record-format')}</div>
              <div className={popupStyles['select-box']}>
                <select value={systemSettings.recordFormat} onChange={handleRecordFormatSelect}>
                  <option value="wav">{'WAV'}</option>
                  <option value="mp3">{'MP3'}</option>
                </select>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <div className={popupStyles['label']}>{t('record-save-path')}</div>
                <div className={popupStyles['row']}>
                  <input name="record-save-path" type="text" value={systemSettings.recordSavePath} style={{ maxWidth: '300px' }} readOnly />
                  <button className={popupStyles['button']} onClick={handleRecordSavePathSelectBtnClick}>
                    {t('select-record-save-path')}
                  </button>
                </div>
              </div>
            </div>
            <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('mix-setting')}</div>
            </div>
            {/* <div className={`${popupStyles['input-box']} ${popupStyles['row']} disabled`}>
              <input name="mix-effect" type="checkbox" checked={mixEffect} onChange={handleMixEffectChange} />
              <div className={popupStyles['label']}>{t('mix-effect-label')}</div>
              <div className={popupStyles['select-box']} style={{ maxWidth: '100px', minWidth: '0' }}>
                <select name="mix-mode" value={mixEffectType} onChange={handleMixEffectTypeSelect}>
                  <option value="">{t('mix-mode-classic')}</option>
                  <option value="">{t('mix-mode-cave')}</option>
                  <option value="">{t('mix-mode-alley')}</option>
                  <option value="">{t('mix-mode-airplane-hangar')}</option>
                  <option value="">{t('mix-mode-staircase')}</option>
                </select>
              </div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']} disabled`}>
              <input name="mix-setting-auto" type="radio" checked={autoMixSetting} onChange={handleAutoMixSettingChange} />
              <div className={popupStyles['label']}>{t('mix-setting-auto-label')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']} disabled`}>
              <input name="mix-setting-manual" type="radio" checked={!autoMixSetting} onChange={handleManualMixSettingChange} />
              <div className={popupStyles['label']}>{t('mix-setting-manual-label')}</div>
            </div> */}
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
              <input name="echo-cancellation" type="checkbox" checked={systemSettings.echoCancellation} onChange={handleEchoCancellationChange} />
              <div className={popupStyles['label']}>{t('echo-cancellation-label')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
              <input name="noise-cancellation" type="checkbox" checked={systemSettings.noiseCancellation} onChange={handleNoiseCancellationChange} />
              <div className={popupStyles['label']}>{t('noise-cancellation-label')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
              <input name="microphone-amplification" type="checkbox" checked={systemSettings.microphoneAmplification} onChange={handleMicrophoneAmplificationChange} />
              <div className={popupStyles['label']}>{t('microphone-amplification-label')}</div>
            </div>
            {/* <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('mix-mode-setting') + ' ' + t('soon')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']} disabled`}>
              <input name="manual-mix-mode" type="checkbox" checked={manualMixMode} onChange={handleManualMixModeChange} />
              <div className={popupStyles['label']}>{t('manual-mix-mode-label')}</div>
            </div>
            <div className={popupStyles['col']} style={{ marginLeft: '10px' }}>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']} ${!manualMixMode && 'disabled'} disabled`}>
                <input name="mix-all-source" type="radio" checked={mixMode === 'all'} disabled={!manualMixMode} onChange={handleMixAllSourceChange} />
                <div className={popupStyles['label']}>{t('mix-all-source-label')}</div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']} ${!manualMixMode && 'disabled'} disabled`}>
                <input name="mix-app-source" type="radio" checked={mixMode === 'app'} disabled={!manualMixMode} onChange={handleMixAppSourceChange} />
                <div className={popupStyles['label']}>{t('mix-app-source-label')}</div>
              </div>
            </div> */}
          </div>
        </div>
        <div className={settingStyles['right']} style={activeTabIndex === 2 ? {} : { display: 'none' }}>
          <div className={popupStyles['col']}>
            <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('default-speaking-mode')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
              <input name="default-speaking-auto" type="radio" checked={systemSettings.speakingMode === 'key'} onChange={handleDefaultSpeakingModeKeyChange} />
              <div className={popupStyles['label']}>{t('default-speaking-mode-key-label')}</div>
            </div>
            {systemSettings.speakingMode == 'key' && (
              <>
                <div key={'speakingKey'} className={popupStyles['input-box']}>
                  <input
                    name="speaking-key"
                    type="text"
                    value={inputFocus === 'speakingKey' ? `> ${systemSettings.defaultSpeakingKey} <` : systemSettings.defaultSpeakingKey}
                    style={{ maxWidth: '200px' }}
                    onClick={handleSpeakingKeyInputClick}
                    onBlur={handleKeyInputBlur}
                    readOnly
                  />
                  {inputFocus === 'speakingKey' && conflicts.length > 0 && <div className={popupStyles['error']}>{t('set-hotkey-error', { '0': conflicts.join(',') })}</div>}
                </div>
                <div className={popupStyles['label']}>{t('setting-speaking-key-description')}</div>
              </>
            )}
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
              <input name="default-speaking-auto" type="radio" checked={systemSettings.speakingMode === 'auto'} onChange={handleDefaultSpeakingModeAutoChange} />
              <div className={popupStyles['label']}>{t('default-speaking-mode-auto-label')}</div>
            </div>
          </div>
        </div>
        <div className={settingStyles['right']} style={activeTabIndex === 3 ? {} : { display: 'none' }}>
          <div className={popupStyles['col']}>
            <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('anti-spam-setting')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
              <input name="forbid-friend-applications" type="checkbox" checked={!!userSettings.forbidFriendApplications} onChange={handleForbidFriendApplicationsChange} />
              <div className={popupStyles['label']}>{t('forbid-friend-applications-label')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
              <input name="forbid-shake-messages" type="checkbox" checked={!!userSettings.forbidShakeMessages} onChange={handleForbidShakeMessagesChange} />
              <div className={popupStyles['label']}>{t('forbid-shake-messages-label')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
              <input name="forbid-member-invitations" type="checkbox" checked={!!userSettings.forbidMemberInvitations} onChange={handleForbidMemberInvitationsChange} />
              <div className={popupStyles['label']}>{t('forbid-member-invitations-label')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
              <input name="forbid-stranger-messages" type="checkbox" checked={!!userSettings.forbidStrangerMessages} onChange={handleForbidStrangerMessagesChange} />
              <div className={popupStyles['label']}>{t('forbid-stranger-messages-label')}</div>
            </div>
            <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('privacy-setting')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
              <input name="share-current-server" type="checkbox" checked={!!userSettings.shareCurrentServer} onChange={handleShareCurrentServerChange} />
              <div className={popupStyles['label']}>{t('share-current-server-label')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
              <input name="share-recent-servers" type="checkbox" checked={!!userSettings.shareRecentServers} onChange={handleShareRecentServersChange} />
              <div className={popupStyles['label']}>{t('share-recent-servers-label')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
              <input name="share-joined-servers" type="checkbox" checked={!!userSettings.shareJoinedServers} onChange={handleShareJoinedServersChange} />
              <div className={popupStyles['label']}>{t('share-joined-servers-label')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
              <input name="share-favorite-servers" type="checkbox" checked={!!userSettings.shareFavoriteServers} onChange={handleShareFavoriteServersChange} />
              <div className={popupStyles['label']}>{t('share-favorite-servers-label')}</div>
            </div>
            <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('message-history-setting')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']} disabled`}>
              <input name="not-save-message-history" type="checkbox" checked={true} onChange={handleNotSaveMessageHistoryChange} />
              <div className={popupStyles['label']}>{t('not-save-message-history-label') + t('soon')}</div>
            </div>
          </div>
        </div>
        <div className={settingStyles['right']} style={activeTabIndex === 4 ? {} : { display: 'none' }}>
          <div className={popupStyles['col']}>
            <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('hot-key-setting')}</div>
            </div>
            <div key={'openMainWindow'} className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
              <div className={popupStyles['label']}>{t('hot-key-open-main-window-label')}</div>
              <input
                ref={inputRef}
                name={'hot-key-open-main-window'}
                type="text"
                value={inputFocus === 'openMainWindow' ? `> ${systemSettings.hotKeyOpenMainWindow} <` : systemSettings.hotKeyOpenMainWindow}
                style={{ maxWidth: '300px' }}
                onClick={handleOpenMainWindowInputClick}
                onBlur={handleKeyInputBlur}
                readOnly
              />
              {inputFocus === 'openMainWindow' && conflicts.length > 0 && <div className={popupStyles['error']}>{t('set-hotkey-error', { '0': conflicts.join(',') })}</div>}
            </div>
            <div key={'increaseVolume'} className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
              <div className={popupStyles['label']}>{t('hot-key-increase-volume-label')}</div>
              <input
                ref={inputRef}
                name={'hot-key-increase-volume'}
                type="text"
                value={inputFocus === 'increaseVolume' ? `> ${systemSettings.hotKeyIncreaseVolume} <` : systemSettings.hotKeyIncreaseVolume}
                style={{ maxWidth: '300px' }}
                onClick={handleIncreaseVolumeInputClick}
                onBlur={handleKeyInputBlur}
                readOnly
              />
              {inputFocus === 'increaseVolume' && conflicts.length > 0 && <div className={popupStyles['error']}>{t('set-hotkey-error', { '0': conflicts.join(',') })}</div>}
            </div>
            <div key={'decreaseVolume'} className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
              <div className={popupStyles['label']}>{t('hot-key-decrease-volume-label')}</div>
              <input
                ref={inputRef}
                name={'hot-key-decrease-volume'}
                type="text"
                value={inputFocus === 'decreaseVolume' ? `> ${systemSettings.hotKeyDecreaseVolume} <` : systemSettings.hotKeyDecreaseVolume}
                style={{ maxWidth: '300px' }}
                onClick={handleDecreaseVolumeInputClick}
                onBlur={handleKeyInputBlur}
                readOnly
              />
              {inputFocus === 'decreaseVolume' && conflicts.length > 0 && <div className={popupStyles['error']}>{t('set-hotkey-error', { '0': conflicts.join(',') })}</div>}
            </div>
            <div key={'toggleSpeaker'} className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
              <div className={popupStyles['label']}>{t('hot-key-toggle-speaker-label')}</div>
              <input
                ref={inputRef}
                name={'hot-key-toggle-speaker'}
                type="text"
                value={inputFocus === 'toggleSpeaker' ? `> ${systemSettings.hotKeyToggleSpeaker} <` : systemSettings.hotKeyToggleSpeaker}
                style={{ maxWidth: '300px' }}
                onClick={handleToggleSpeakerInputClick}
                onBlur={handleKeyInputBlur}
                readOnly
              />
              {inputFocus === 'toggleSpeaker' && conflicts.length > 0 && <div className={popupStyles['error']}>{t('set-hotkey-error', { '0': conflicts.join(',') })}</div>}
            </div>
            <div key={'toggleMicrophone'} className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
              <div className={popupStyles['label']}>{t('hot-key-toggle-microphone-label')}</div>
              <input
                ref={inputRef}
                name={'hot-key-toggle-microphone'}
                type="text"
                value={inputFocus === 'toggleMicrophone' ? `> ${systemSettings.hotKeyToggleMicrophone} <` : systemSettings.hotKeyToggleMicrophone}
                style={{ maxWidth: '300px' }}
                onClick={handleToggleMicrophoneInputClick}
                onBlur={handleKeyInputBlur}
                readOnly
              />
              {inputFocus === 'toggleMicrophone' && conflicts.length > 0 && <div className={popupStyles['error']}>{t('set-hotkey-error', { '0': conflicts.join(',') })}</div>}
            </div>
          </div>
        </div>
        <div className={settingStyles['right']} style={activeTabIndex === 5 ? {} : { display: 'none' }}>
          <div className={popupStyles['col']}>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
              <input name="disable-sound-effect-all" type="checkbox" checked={systemSettings.disableAllSoundEffect} onChange={handleDisableAllSoundEffectChange} />
              <div className={popupStyles['label']}>{t('disable-all-sound-effect-label')}</div>
            </div>
            <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('sound-effect-setting')}</div>
            </div>
            <div>{t('sound-effect-setting-description')}</div>
            <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
              <table style={{ height: '330px' }}>
                <thead>
                  <tr>
                    <th>{t('sound-effect-type-label')}</th>
                    <th>{t('sound-effect-preview-label')}</th>
                    <th>{t('sound-effect-status-label')}</th>
                  </tr>
                </thead>
                <tbody className={settingStyles['tableContainer']}>
                  <tr>
                    <td>{t('enter-channel-sound-label')}</td>
                    <td>
                      <div className={popupStyles['sound-effect-preview']} onClick={handlePlayEnterVoiceChannelSound} />
                    </td>
                    <td className={popupStyles['sound-effect-enable']} onClick={handleEnableEnterVoiceChannelSoundChange}>
                      {!systemSettings.enterVoiceChannelSound || systemSettings.disableAllSoundEffect ? <div className={'disabled'}>{t('disable')}</div> : <div>{t('enable')}</div>}
                    </td>
                  </tr>
                  <tr>
                    <td>{t('leave-channel-sound-label')}</td>
                    <td>
                      <div className={popupStyles['sound-effect-preview']} onClick={handlePlayLeaveVoiceChannelSound} />
                    </td>
                    <td className={popupStyles['sound-effect-enable']} onClick={handleEnableLeaveVoiceChannelSoundChange}>
                      {!systemSettings.leaveVoiceChannelSound || systemSettings.disableAllSoundEffect ? <div className={'disabled'}>{t('disable')}</div> : <div>{t('enable')}</div>}
                    </td>
                  </tr>
                  <tr>
                    <td>{t('start-speaking-sound-label')}</td>
                    <td>
                      <div className={popupStyles['sound-effect-preview']} onClick={handlePlayStartSpeakingSound} />
                    </td>
                    <td className={popupStyles['sound-effect-enable']} onClick={handleEnableStartSpeakingSoundChange}>
                      {!systemSettings.startSpeakingSound || systemSettings.disableAllSoundEffect ? <div className={'disabled'}>{t('disable')}</div> : <div>{t('enable')}</div>}
                    </td>
                  </tr>
                  <tr>
                    <td>{t('stop-speaking-sound-label')}</td>
                    <td>
                      <div className={popupStyles['sound-effect-preview']} onClick={handlePlayStopSpeakingSound} />
                    </td>
                    <td className={popupStyles['sound-effect-enable']} onClick={handleEnableStopSpeakingSoundChange}>
                      {!systemSettings.stopSpeakingSound || systemSettings.disableAllSoundEffect ? <div className={'disabled'}>{t('disable')}</div> : <div>{t('enable')}</div>}
                    </td>
                  </tr>
                  <tr>
                    <td>{t('receive-direct-message-sound-label')}</td>
                    <td>
                      <div className={popupStyles['sound-effect-preview']} onClick={handlePlayReceiveDirectMessageSound} />
                    </td>
                    <td className={popupStyles['sound-effect-enable']} onClick={handleEnableReceiveDirectMessageSoundChange}>
                      {!systemSettings.receiveDirectMessageSound || systemSettings.disableAllSoundEffect ? <div className={'disabled'}>{t('disable')}</div> : <div>{t('enable')}</div>}
                    </td>
                  </tr>
                  <tr>
                    <td>{t('receive-channel-message-sound-label')}</td>
                    <td>
                      <div className={popupStyles['sound-effect-preview']} onClick={handlePlayReceiveChannelMessageSound} />
                    </td>
                    <td className={popupStyles['sound-effect-enable']} onClick={handleEnableReceiveChannelMessageSoundChange}>
                      {!systemSettings.receiveChannelMessageSound || systemSettings.disableAllSoundEffect ? <div className={'disabled'}>{t('disable')}</div> : <div>{t('enable')}</div>}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className={settingStyles['right']} style={activeTabIndex === 6 ? {} : { display: 'none' }}>
          <div className={popupStyles['col']}>
            <div className={popupStyles['header']}>
              <div className={popupStyles['label']}>{t('update-setting')}</div>
            </div>
            <div className={popupStyles['row']}>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <input name="auto-check-for-updates" type="checkbox" checked={systemSettings.autoCheckForUpdates} onChange={handleAutoCheckForUpdatesChange} />
                <div className={popupStyles['label']}>{t('auto-check-for-updates-label')}</div>
              </div>
              <div className={popupStyles['button']} onClick={handleCheckForUpdatesBtnClick}>
                {t('check-for-updates')}
              </div>
            </div>
            <div className={popupStyles['row']}>
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <div className={popupStyles['label']}>{t('update-channel-label')}</div>
                <div className={popupStyles['select-box']} style={{ width: '100%' }}>
                  <select value={systemSettings.updateChannel} onChange={handleUpdateChannelChange}>
                    <option value="latest">{t('update-channel-latest-label')}</option>
                    <option value="dev">{t('update-channel-dev-label')}</option>
                  </select>
                </div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <div className={popupStyles['label']}>{t('update-check-interval-label')}</div>
                <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                  <input name="update-check-interval" type="number" min={1} max={600} value={systemSettings.updateCheckInterval / 60 / 1000} onChange={handleUpdateCheckIntervalChange} />
                  <div className={popupStyles['label']}>{t('minute')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={popupStyles['button']} onClick={handleConfirmBtnClick}>
          {t('confirm')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

SystemSettingPopup.displayName = 'SystemSettingPopup';

export default SystemSettingPopup;
