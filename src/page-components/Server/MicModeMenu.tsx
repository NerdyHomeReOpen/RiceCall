import React from 'react';
import { useTranslation } from 'react-i18next';

import * as ipc from '@/main/ipc';

import { useWebRTC } from '@/providers/WebRTC';

import { useAppSelector } from '@/hooks/useStore';

import { getLerpColor } from '@/utils/color';

import styles from './Server.module.css';

const MicModeMenu: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const { changeVoiceThreshold } = useWebRTC();

  const voiceThreshold = useAppSelector((state) => state.webrtc.voiceThreshold);
  const speakingMode = useAppSelector((state) => state.webrtc.speakingMode);
  const volumePercent = useAppSelector((state) => state.webrtc.volumePercent);

  const volumeThreshold = voiceThreshold;
  const isActive = volumePercent > volumeThreshold;
  const activeColor = isActive ? getLerpColor('#0fb300', '#be0000', Math.pow(volumePercent / 100, 2)) : 'gray';
  const voiceThresholdColor = `linear-gradient(to right, ${activeColor} ${volumePercent}%, #eee ${volumePercent}%)`;
  const defaultSpeakingKey = ipc.systemSettings.defaultSpeakingKey.get();
  const speakingModeIsKeyMode = speakingMode === 'key';
  const speakingModeIsAutoMode = speakingMode === 'auto';

  const handleKeyModeSelect = () => {
    if (speakingModeIsKeyMode) return;
    ipc.systemSettings.speakingMode.set('key');
  };

  const handleAutoModeSelect = () => {
    if (speakingModeIsAutoMode) return;
    ipc.systemSettings.speakingMode.set('auto');
  };

  const handleVoiceThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    changeVoiceThreshold(parseInt(e.target.value));
  };

  return (
    <div className={styles['mode-menu']}>
      <div className="col">
        <div className="label">{t('current-speaking-mode')}</div>
        <div className="input-box row">
          <input type="radio" name="visibility" checked={speakingModeIsKeyMode} onChange={handleKeyModeSelect} />
          <div className="label">{t('default-speaking-mode-key-label')}</div>
          <div style={speakingModeIsKeyMode ? {} : { display: 'none' }} className="input-box">
            <input name="speaking-key" type="text" value={defaultSpeakingKey} style={{ maxWidth: '200px' }} readOnly />
          </div>
        </div>
        <div className="input-box row">
          <input type="radio" name="visibility" checked={speakingModeIsAutoMode} onChange={handleAutoModeSelect} />
          <div className="label">{t('default-speaking-mode-auto-label')}</div>
          <div style={speakingModeIsAutoMode ? {} : { display: 'none' }} className={styles['threshold-input-wrapper']}>
            <div className={styles['threshold-input-wrapper']}>
              <input
                className={styles['voice-threshold-input']}
                type="range"
                min="0"
                max="100"
                value={voiceThreshold}
                style={{ background: voiceThresholdColor }}
                onChange={handleVoiceThresholdChange}
              />
              <div className={`${styles['voice-state-icon']} ${isActive ? styles['active'] : ''}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

MicModeMenu.displayName = 'MicModeMenu';

export default MicModeMenu;
