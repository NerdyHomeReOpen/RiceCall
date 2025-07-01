import React, { useEffect, useState } from 'react';

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

  // States
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInput, setSelectedInput] = useState<string>('');
  const [selectedOutput, setSelectedOutput] = useState<string>('');
  const [autoLaunch, setAutoLaunch] = useState<boolean>(false);
  const [minimizeToTray, setMinimizeToTray] = useState<boolean>(false);
  const [startMinimized, setStartMinimized] = useState<boolean>(false);
  const [soundEffect, setSoundEffect] = useState<boolean>(true);

  // Handlers
  const handleClose = () => {
    ipcService.window.close();
  };

  // Effects
  useEffect(() => {
    ipcService.systemSettings.get((data) => {
      setAutoLaunch(data.autoLaunch);
      setSoundEffect(data.soundEffect);
      setSelectedInput(data.inputAudioDevice);
      setSelectedOutput(data.outputAudioDevice);
    });

    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const inputs = devices.filter((device) => device.kind === 'audioinput');
      const outputs = devices.filter((device) => device.kind === 'audiooutput');
      setInputDevices(inputs);
      setOutputDevices(outputs);
    });
  }, []);

  return (
    <div className={popup['popupContainer']}>
      {/* Body */}
      <div className={popup['popupBody']}>
        {/* Sidebar */}
        <div className={setting['left']}>
          <div className={setting['tabs']}>
            {[t('basic-settings'), t('voice-settings')].map((title, index) => (
              <div
                className={`${setting['item']} ${activeTabIndex === index ? setting['active'] : ''}`}
                onClick={() => setActiveTabIndex(index)}
                key={index}
              >
                {title}
              </div>
            ))}
          </div>
        </div>

        {/* System Settings */}
        <div className={setting['right']} style={activeTabIndex === 0 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={popup['label']}>{t('general-settings')}</div>
            <div className={popup['inputGroup']}>
              <div className={`${popup['inputBox']} ${popup['row']}`}>
                <input
                  name="autoLaunch"
                  type="checkbox"
                  checked={autoLaunch}
                  onChange={(e) => setAutoLaunch(e.target.checked)}
                />
                <div>
                  <div className={popup['label']}>{t('auto-startup')}</div>
                  <div className={popup['hint']}>{t('auto-startup-description')}</div>
                </div>
              </div>

              <div className={`${popup['inputBox']} ${popup['row']} ${popup['disabled']}`}>
                <input
                  name="minimizeToTray"
                  type="checkbox"
                  checked={minimizeToTray}
                  onChange={(e) => setMinimizeToTray(e.target.checked)}
                />
                <div>
                  <div className={popup['label']}>{`${t('minimize-to-tray')} ${t('soon')}`}</div>
                  <div className={popup['hint']}>{t('minimize-to-tray-description')}</div>
                </div>
              </div>
              <div className={`${popup['inputBox']} ${popup['row']} ${popup['disabled']}`}>
                <input
                  name="startMinimized"
                  type="checkbox"
                  checked={startMinimized}
                  onChange={(e) => setStartMinimized(e.target.checked)}
                />
                <div>
                  <div className={popup['label']}>{`${t('start-minimized')} ${t('soon')}`}</div>
                  <div className={popup['hint']}>{t('start-minimized-description')}</div>
                </div>
              </div>

              <div className={`${popup['inputBox']} ${popup['row']}`}>
                <input
                  name="soundEffect"
                  type="checkbox"
                  checked={soundEffect}
                  onChange={(e) => setSoundEffect(e.target.checked)}
                />
                <div>
                  <div className={popup['label']}>{t('notification-sound')}</div>
                  <div className={popup['hint']}>{t('notification-sound-description')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Voice Settings */}
        <div className={setting['right']} style={activeTabIndex === 1 ? {} : { display: 'none' }}>
          <div className={popup['col']}>
            <div className={popup['label']}>{t('voice-settings')}</div>
            <div className={popup['inputGroup']}>
              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div className={popup['label']}>{t('input-device')}</div>
                <div className={popup['selectBox']}>
                  <select
                    value={selectedInput}
                    onChange={(e) => setSelectedInput(e.target.value)}
                    style={{
                      maxWidth: '250px',
                    }}
                  >
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
              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div className={popup['label']}>{t('output-device')}</div>
                <div className={popup['selectBox']}>
                  <select
                    value={selectedOutput}
                    onChange={(e) => setSelectedOutput(e.target.value)}
                    style={{
                      maxWidth: '250px',
                    }}
                  >
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
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popupFooter']}>
        <button
          className={popup['button']}
          onClick={() => {
            ipcService.systemSettings.autoLaunch.set(autoLaunch);
            ipcService.systemSettings.soundEffect.set(soundEffect);
            ipcService.systemSettings.inputAudioDevice.set(selectedInput);
            ipcService.systemSettings.outputAudioDevice.set(selectedOutput);
            handleClose();
          }}
        >
          {t('confirm')}
        </button>
        <button type="button" className={popup['button']} onClick={() => handleClose()}>
          {t('cancel')}
        </button>
      </div>
    </div>
  );
});

SystemSettingPopup.displayName = 'SystemSettingPopup';

export default SystemSettingPopup;
