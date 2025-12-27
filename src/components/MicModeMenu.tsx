import React from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import { useWebRTC } from '@/providers/WebRTC';

import server from '@/styles/server.module.css';
import popup from '@/styles/popup.module.css';

function lerpColor(color1: string, color2: string, t: number) {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);

  const r1 = (c1 >> 16) & 0xff;
  const g1 = (c1 >> 8) & 0xff;
  const b1 = c1 & 0xff;

  const r2 = (c2 >> 16) & 0xff;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = c2 & 0xff;

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const MicModeMenu: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();
  const webRTC = useWebRTC();

  // Variables
  const volumePercent = webRTC.getVolumePercent('user');
  const volumeThreshold = webRTC.voiceThreshold;
  const isActive = volumePercent > volumeThreshold;
  const activeColor = isActive ? lerpColor('#0fb300', '#be0000', Math.pow(volumePercent / 100, 2)) : 'gray';
  const voiceThresholdColor = `linear-gradient(to right, ${activeColor} ${volumePercent}%, #eee ${volumePercent}%)`;
  const defaultSpeakingKey = ipc.systemSettings.defaultSpeakingKey.get();

  // Handlers
  const editSpeakingMode = (speakingMode: Types.SpeakingMode) => {
    ipc.systemSettings.speakingMode.set(speakingMode);
  };

  const editVoiceThreshold = (voiceThreshold: number) => {
    webRTC.changeVoiceThreshold(voiceThreshold);
  };

  return (
    <div className={server['mic-mode-menu']}>
      <div className={popup['col']}>
        <div className={popup['label']}>{t('current-speaking-mode')}</div>
        <div className={`${popup['input-box']} ${popup['row']}`}>
          <input type="radio" name="visibility" checked={webRTC.speakingMode === 'key'} onChange={() => editSpeakingMode('key')} />
          <div className={popup['label']}>{t('default-speaking-mode-key-label')}</div>
          <div style={webRTC.speakingMode === 'key' ? {} : { display: 'none' }} className={popup['input-box']}>
            <input name="speaking-key" type="text" value={defaultSpeakingKey} style={{ maxWidth: '200px' }} readOnly />
          </div>
        </div>
        <div className={`${popup['input-box']} ${popup['row']}`}>
          <input type="radio" name="visibility" checked={webRTC.speakingMode === 'auto'} onChange={() => editSpeakingMode('auto')} />
          <div className={popup['label']}>{t('default-speaking-mode-auto-label')}</div>
          <div style={webRTC.speakingMode === 'auto' ? {} : { display: 'none' }} className={server['voice-threshold-input-wrapper']}>
            <div className={server['voice-threshold-input-wrapper']}>
              <input
                className={server['voice-threshold-input']}
                type="range"
                min="0"
                max="100"
                value={webRTC.voiceThreshold}
                style={{ background: voiceThresholdColor }}
                onChange={(e) => editVoiceThreshold(parseInt(e.target.value))}
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
