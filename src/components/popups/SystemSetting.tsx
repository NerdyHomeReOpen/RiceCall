import React, { useEffect, useState } from 'react';
import packageJson from '../../../package.json';
const version = packageJson.version;

// CSS
import setting from '@/styles/popups/editServer.module.css';
import popup from '@/styles/common/popup.module.css';
import styles from '@/styles/popups/systemSetting.module.css';

// Providers
import { useLanguage } from '@/providers/Language';
import { useWebRTC } from '@/providers/WebRTC';

// Services
import ipcService from '@/services/ipc.service';

const SystemSettingPopup: React.FC = React.memo(() => {
  // Hooks
  const lang = useLanguage();
  const webRTC = useWebRTC();

  // States
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInput, setSelectedInput] = useState<string>('');
  const [selectedOutput, setSelectedOutput] = useState<string>('');
  const [autoLaunch, setAutoLaunch] = useState<boolean>(false);
  const [minimizeToTray, setMinimizeToTray] = useState<boolean>(false);
  const [startMinimized, setStartMinimized] = useState<boolean>(false);
  const [notificationSound, setNotificationSound] = useState<boolean>(true);

  useEffect(() => {
    ipcService.autoLaunch.get(setAutoLaunch);
  }, []);

  const handleAutoLaunchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setAutoLaunch(enabled);
    ipcService.autoLaunch.set(enabled);
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  useEffect(() => {
    ipcService.audio.get((devices) => {
      setSelectedInput(devices.input || '');
      setSelectedOutput(devices.output || '');
    });

    // 獲取可用的音訊設備
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const inputs = devices.filter((device) => device.kind === 'audioinput');
      const outputs = devices.filter((device) => device.kind === 'audiooutput');
      setInputDevices(inputs);
      setOutputDevices(outputs);
    });
  }, []);

  useEffect(() => {
    if (selectedInput) {
      navigator.mediaDevices
        .getUserMedia({ audio: { deviceId: selectedInput } })
        // .then((stream) => {
        //   console.log('使用選擇的輸入裝置:', selectedInput);
        //   // 這裡可以將 stream 傳遞給音訊處理的邏輯
        // })
        .catch((err) => console.error('無法存取麥克風', err));
    }
  }, [selectedInput]);

  const handleConfirm = () => {
    ipcService.autoLaunch.set(autoLaunch);
    ipcService.audio.set(selectedInput, 'input');
    ipcService.audio.set(selectedOutput, 'output');
    handleClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedInput(deviceId);
    webRTC.updateInputDevice?.(deviceId);
  };

  const handleOutputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedOutput(deviceId);
    webRTC.updateOutputDevice?.(deviceId);
  };

  return (
    <div className={popup['popupContainer']}>
      <div className={popup['popupBody']}>
        {/* Left Sidebar */}
        <div className={setting['left']}>
          <div className={setting['tabs']}>
            {[
              lang.tr.basicSettings,
              lang.tr.voiceSettings,
              lang.tr.aboutUs,
            ].map((title, index) => (
              <div
                className={`${setting['item']} ${
                  activeTabIndex === index ? setting['active'] : ''
                }`}
                onClick={() => setActiveTabIndex(index)}
                key={index}
              >
                {title}
              </div>
            ))}
          </div>
        </div>
        {/* Right Content */}
        <div className={setting['right']}>
          {activeTabIndex === 0 ? (
            <div className={popup['col']}>
              <div className={popup['label']}>{lang.tr.generalSettings}</div>
              <div className={popup['inputGroup']}>
                <div className={`${popup['inputBox']} ${popup['row']}`}>
                  <input
                    type="checkbox"
                    checked={autoLaunch}
                    onChange={handleAutoLaunchChange}
                  />
                  <div>
                    <div className={popup['label']}>{lang.tr.autoStartup}</div>
                    <div className={popup['hint']}>
                      {lang.tr.autoStartupDescription}
                    </div>
                  </div>
                </div>

                <div
                  className={`${popup['inputBox']} ${popup['row']} ${popup['disabled']}`}
                >
                  <input
                    type="checkbox"
                    checked={minimizeToTray}
                    onChange={(e) => setMinimizeToTray(e.target.checked)}
                  />
                  <div>
                    <div className={popup['label']}>
                      {lang.tr.minimizeToTray} (Not implemented)
                    </div>
                    <div className={popup['hint']}>
                      {lang.tr.minimizeToTrayDescription}
                    </div>
                  </div>
                </div>
                <div
                  className={`${popup['inputBox']} ${popup['row']} ${popup['disabled']}`}
                >
                  <input
                    type="checkbox"
                    checked={startMinimized}
                    onChange={(e) => setStartMinimized(e.target.checked)}
                  />
                  <div>
                    <div className={popup['label']}>
                      {lang.tr.startMinimized} (Not implemented)
                    </div>
                    <div className={popup['hint']}>
                      {lang.tr.startMinimizedDescription}
                    </div>
                  </div>
                </div>

                <div
                  className={`${popup['inputBox']} ${popup['row']} ${popup['disabled']}`}
                >
                  <input
                    type="checkbox"
                    checked={notificationSound}
                    onChange={(e) => setNotificationSound(e.target.checked)}
                  />
                  <div>
                    <div className={popup['label']}>
                      {lang.tr.notificationSound} (Not implemented)
                    </div>
                    <div className={popup['hint']}>
                      {lang.tr.notificationSoundDescription}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTabIndex === 1 ? (
            <div className={popup['col']}>
              <div className={popup['label']}>{lang.tr.voiceSettings}</div>
              <div className={popup['inputGroup']}>
                <div
                  className={`${popup['inputBox']} ${popup['col']} ${popup['disabled']}`}
                >
                  <div className={popup['label']}>{lang.tr.inputDevice}</div>
                  <div className={popup['selectBox']}>
                    <select
                      value={selectedInput}
                      onChange={handleInputChange}
                      style={{
                        maxWidth: '250px',
                      }}
                    >
                      <option value="">
                        {lang.tr.defaultMicrophone} (
                        {inputDevices[0]?.label || lang.tr.unknownDevice})
                      </option>
                      {inputDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label ||
                            `${lang.tr.microphone} ${
                              inputDevices.indexOf(device) + 1
                            }`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div
                  className={`${popup['inputBox']} ${popup['col']} ${popup['disabled']}`}
                >
                  <div className={popup['label']}>{lang.tr.outputDevice}</div>
                  <div className={popup['selectBox']}>
                    <select
                      value={selectedOutput}
                      onChange={handleOutputChange}
                      style={{
                        maxWidth: '250px',
                      }}
                    >
                      <option value="">
                        {lang.tr.defaultSpeaker} (
                        {outputDevices[0]?.label || lang.tr.unknownDevice})
                      </option>
                      {outputDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label ||
                            `${lang.tr.speaker} ${
                              outputDevices.indexOf(device) + 1
                            }`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTabIndex === 2 ? (
            <div className={popup['col']}>
              <div className={popup['label']}>{lang.tr.aboutUs}</div>
              <div className={popup['inputGroup']}>
                <div className={popup['row']}>
                  <div className={`${popup['inputBox']} ${popup['col']}`}>
                    <div className={popup['label']}>{lang.tr.version}</div>
                    <div className={popup['value']}>v{version}</div>
                  </div>
                  <div className={`${popup['inputBox']} ${popup['col']}`}>
                    <div className={popup['label']}>{lang.tr.getHelp}</div>
                    <div className={popup['value']}>
                      <div
                        onClick={() =>
                          ipcService.window.openExternal(
                            'https://discord.gg/adCWzv6wwS',
                          )
                        }
                        className={styles.link}
                      >
                        {lang.tr.discord}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`${popup['inputBox']} ${popup['col']}`}>
                  <div className={popup['label']}>
                    {lang.tr.projectRepo} {lang.tr.projectRepoDescription}
                  </div>
                  <div className={popup['value']}>
                    <div
                      onClick={() =>
                        ipcService.window.openExternal(
                          'https://github.com/NerdyHomeReOpen/RiceCall',
                        )
                      }
                      className={styles.link}
                    >
                      RiceCall
                    </div>
                  </div>
                </div>

                <div className={`${popup['inputBox']} ${popup['col']}`}>
                  <div className={`${popup['label']}`}>
                    {lang.tr.developmentTeam}
                  </div>
                  <div className={`${popup['row']}`}>
                    <div className={styles.developerGrid}>
                      {[
                        {
                          name: '🤓 JoshHuang9508',
                          role: lang.tr.mainDeveloper,
                          github: 'https://github.com/JoshHuang9508',
                        },
                        {
                          name: '🤓 yeci226',
                          role: lang.tr.mainDeveloper,
                          github: 'https://github.com/yeci226',
                        },
                        {
                          name: 'lekoOwO',
                          role: lang.tr.backendDeveloper,
                          github: 'https://github.com/lekoOwO',
                        },
                        {
                          name: 'cablate',
                          role: lang.tr.frontendDeveloper,
                          github: 'https://github.com/cablate',
                        },
                        {
                          name: 'cstrikeasia',
                          role: lang.tr.frontendDeveloper,
                          github: 'https://github.com/cstrikeasia',
                        },
                        {
                          name: 'rytlebsk',
                          role: lang.tr.frontendDeveloper,
                          github: 'https://github.com/rytlebsk',
                        },
                        {
                          name: 'Cooookie16',
                          role: lang.tr.serverMaintainer,
                          github: 'https://github.com/Cooookie16',
                        },
                        {
                          name: 'yayacat',
                          role: lang.tr.serverMaintainer,
                          github: 'https://github.com/yayacat',
                        },
                      ].map((dev) => (
                        <div key={dev.name} className={styles.developerCard}>
                          <div
                            onClick={() =>
                              ipcService.window.openExternal(dev.github)
                            }
                            className={styles.developerName}
                          >
                            {dev.name}
                          </div>
                          <span className={styles.developerRole}>
                            {dev.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className={popup['hint']}>
                {lang.tr.copyright} © {new Date().getFullYear()} NerdyHomeReOpen
                Team. All rights reserved.
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className={popup['popupFooter']}>
        <button className={popup['button']} onClick={handleConfirm}>
          {lang.tr.confirm}
        </button>
        <button
          type="button"
          className={popup['button']}
          onClick={() => handleClose()}
        >
          {lang.tr.cancel}
        </button>
      </div>
    </div>
  );
});

SystemSettingPopup.displayName = 'SystemSettingPopup';

export default SystemSettingPopup;
