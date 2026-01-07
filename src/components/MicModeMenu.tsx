import React from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import { useWebRTC } from '@/providers/WebRTC';

import * as Color from '@/utils/color';

import server from '@/styles/server.module.css';
import popup from '@/styles/popup.module.css';

const MicModeMenu: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();
  const { getVolumePercent, voiceThreshold, speakingMode, changeVoiceThreshold } = useWebRTC();

  // Variables
  const volumePercent = getVolumePercent('user');
  const volumeThreshold = voiceThreshold;
  const isActive = volumePercent > volumeThreshold;
  const activeColor = isActive ? Color.getLerpColor('#0fb300', '#be0000', Math.pow(volumePercent / 100, 2)) : 'gray';
  const voiceThresholdColor = `linear-gradient(to right, ${activeColor} ${volumePercent}%, #eee ${volumePercent}%)`;
  const defaultSpeakingKey = ipc.systemSettings.defaultSpeakingKey.get();
  const isKeyMode = speakingMode === 'key';
  const isAutoMode = speakingMode === 'auto';

  // Handlers
  const handleKeyModeSelect = () => {
    if (isKeyMode) return;
    ipc.systemSettings.speakingMode.set('key');
  };

  const handleAutoModeSelect = () => {
    if (isAutoMode) return;
    ipc.systemSettings.speakingMode.set('auto');
  };

  const handleVoiceThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    changeVoiceThreshold(parseInt(e.target.value));
  };

  return (
    <div className={server['mic-mode-menu']}>
      <div className={popup['col']}>
        <div className={popup['label']}>{t('current-speaking-mode')}</div>
        <div className={`${popup['input-box']} ${popup['row']}`}>
          <input type="radio" name="visibility" checked={isKeyMode} onChange={handleKeyModeSelect} />
          <div className={popup['label']}>{t('default-speaking-mode-key-label')}</div>
          <div style={isKeyMode ? {} : { display: 'none' }} className={popup['input-box']}>
            <input name="speaking-key" type="text" value={defaultSpeakingKey} style={{ maxWidth: '200px' }} readOnly />
          </div>
        </div>
        <div className={`${popup['input-box']} ${popup['row']}`}>
          <input type="radio" name="visibility" checked={isAutoMode} onChange={handleAutoModeSelect} />
          <div className={popup['label']}>{t('default-speaking-mode-auto-label')}</div>
          <div style={isAutoMode ? {} : { display: 'none' }} className={server['voice-threshold-input-wrapper']}>
            <div className={server['voice-threshold-input-wrapper']}>
              <input
                className={server['voice-threshold-input']}
                type="range"
                min="0"
                max="100"
                value={voiceThreshold}
                style={{ background: voiceThresholdColor }}
                onChange={handleVoiceThresholdChange}
              />
              <div className={`${server['voice-state-icon']} ${isActive ? server['active'] : ''}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

MicModeMenu.displayName = 'MicModeMenu';

export default MicModeMenu;
