import React, { useEffect, useState } from 'react';
import packageJson from '../../../package.json';
const version = packageJson.version;

// CSS
import setting from '@/styles/popups/setting.module.css';
import popup from '@/styles/popup.module.css';

// Providers
import { useLanguage } from '@/providers/Language';

// Services
import ipcService from '@/services/ipc.service';

const SystemSettingPopup: React.FC = React.memo(() => {
  // Hooks
  const lang = useLanguage();

  // Constants
  const DEVELOPERS_INFO = [
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
  ];

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
      <div className={popup['popupBody']}>
        {/* Sidebar */}
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

        {/* System Settings */}
        <div
          className={setting['right']}
          style={activeTabIndex === 0 ? {} : { display: 'none' }}
        >
          <div className={popup['col']}>
            <div className={popup['label']}>{lang.tr.generalSettings}</div>
            <div className={popup['inputGroup']}>
              <div className={`${popup['inputBox']} ${popup['row']}`}>
                <input
                  name="autoLaunch"
                  type="checkbox"
                  checked={autoLaunch}
                  onChange={(e) => setAutoLaunch(e.target.checked)}
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
                  name="minimizeToTray"
                  type="checkbox"
                  checked={minimizeToTray}
                  onChange={(e) => setMinimizeToTray(e.target.checked)}
                />
                <div>
                  <div className={popup['label']}>
                    {lang.tr.minimizeToTray + lang.tr.soon}
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
                  name="startMinimized"
                  type="checkbox"
                  checked={startMinimized}
                  onChange={(e) => setStartMinimized(e.target.checked)}
                />
                <div>
                  <div className={popup['label']}>
                    {lang.tr.startMinimized + lang.tr.soon}
                  </div>
                  <div className={popup['hint']}>
                    {lang.tr.startMinimizedDescription}
                  </div>
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
                  <div className={popup['label']}>
                    {lang.tr.notificationSound}
                  </div>
                  <div className={popup['hint']}>
                    {lang.tr.notificationSoundDescription}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Voice Settings */}
        <div
          className={setting['right']}
          style={activeTabIndex === 1 ? {} : { display: 'none' }}
        >
          <div className={popup['col']}>
            <div className={popup['label']}>{lang.tr.voiceSettings}</div>
            <div className={popup['inputGroup']}>
              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div className={popup['label']}>{lang.tr.inputDevice}</div>
                <div className={popup['selectBox']}>
                  <select
                    value={selectedInput}
                    onChange={(e) => setSelectedInput(e.target.value)}
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
              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div className={popup['label']}>{lang.tr.outputDevice}</div>
                <div className={popup['selectBox']}>
                  <select
                    value={selectedOutput}
                    onChange={(e) => setSelectedOutput(e.target.value)}
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
        </div>

        {/* About Us */}
        <div
          className={setting['right']}
          style={activeTabIndex === 2 ? {} : { display: 'none' }}
        >
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
                      className={setting['linkText']}
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
                    className={setting['linkText']}
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
                  <div className={setting['developerCardGrid']}>
                    {DEVELOPERS_INFO.map((dev) => (
                      <div key={dev.name} className={setting['developerCard']}>
                        <div
                          onClick={() =>
                            ipcService.window.openExternal(dev.github)
                          }
                          className={setting['nameText']}
                        >
                          {dev.name}
                        </div>
                        <div className={setting['roleText']}>{dev.role}</div>
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
        </div>
      </div>

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
