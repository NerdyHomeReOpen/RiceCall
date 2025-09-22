import React, { useState } from 'react';

// CSS
import server from '@/styles/pages/server.module.css';
import popup from '@/styles/popup.module.css';

// Types
import type { SpeakingMode } from '@/types';

// Hooks
import { useTranslation } from 'react-i18next';
import { useWebRTC } from '@/providers/WebRTC';

// services
import ipc from '@/services/ipc.service';

const MicModeMenu: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();
  const webRTC = useWebRTC();

  // States
  const [isVoiceThresholdDisabled, setIsVoiceThresholdDisabled] = useState(webRTC.voiceThreshold === 0);

  // Memos
  const volumePercent = webRTC.getVolumePercent('user');
  const voiceThreshold = webRTC.voiceThreshold;
  const activeColor = webRTC.isSpeaking('user') ? '#62a35b' : 'gray';
  const voiceThresholdColor = `linear-gradient(to right, ${activeColor} ${volumePercent}%, #eee ${volumePercent}%)`;

  // Handlers
  const handleEditSpeakingMode = (speakingMode: SpeakingMode) => {
    ipc.systemSettings.speakingMode.set(speakingMode);
  };

  const handleEditVoiceThreshold = (voiceThreshold: number) => {
    webRTC.changeVoiceThreshold(voiceThreshold);
  };

  return (
    <div className={server['mic-mode-menu']}>
      <div className={popup['col']}>
        <div className={`${popup['input-box']} ${popup['row']}`}>
          <input type="radio" name="visibility" checked={webRTC.speakingMode === 'key'} onChange={() => handleEditSpeakingMode('key')} />
          <div className={popup['label']}>{t('default-speaking-mode-key-label')}</div>
        </div>
        <div className={`${popup['input-box']} ${popup['row']}`}>
          <input type="radio" name="visibility" checked={webRTC.speakingMode === 'auto'} onChange={() => handleEditSpeakingMode('auto')} />
          <div className={popup['label']}>{t('default-speaking-mode-auto-label')}</div>
        </div>
        <div className={`${popup['input-box']} ${popup['row']}`}>
          <input
            type="checkbox"
            checked={!isVoiceThresholdDisabled}
            onChange={() => {
              handleEditVoiceThreshold(isVoiceThresholdDisabled ? voiceThreshold : 1);
              setIsVoiceThresholdDisabled(!isVoiceThresholdDisabled);
            }}
          />
          <div className={popup['label']}>{t('manually-adjust')}</div>
        </div>
        <input
          className={server['voice-threshold-input']}
          disabled={isVoiceThresholdDisabled}
          type="range"
          min="0"
          max="100"
          value={webRTC.voiceThreshold}
          style={{ background: voiceThresholdColor }}
          onChange={(e) => handleEditVoiceThreshold(parseInt(e.target.value))}
        />
      </div>
    </div>
  );
});

MicModeMenu.displayName = 'MicModeMenu';

export default MicModeMenu;
