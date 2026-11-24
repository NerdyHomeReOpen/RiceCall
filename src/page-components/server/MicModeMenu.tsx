import React from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import * as ipc from '@/main/ipc';

import { useWebRTC } from '@/providers/WebRTC';

import { useAppSelector } from '@/hooks/useStore';

import { getLerpColor } from '@/utils/color';

const MicModeMenu: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const { changeVoiceThreshold } = useWebRTC();

  const voiceThreshold = useAppSelector((state) => state.webrtc.voiceThreshold, shallowEqual);
  const speakingMode = useAppSelector((state) => state.webrtc.speakingMode, shallowEqual);
  const volumePercent = useAppSelector((state) => state.webrtc.volumePercent, shallowEqual);

  const volumeThreshold = voiceThreshold;
  const isActive = volumePercent > volumeThreshold;
  const activeColor = isActive ? getLerpColor('#0fb300', '#be0000', Math.pow(volumePercent / 100, 2)) : 'gray';
  const voiceThresholdColor = `linear-gradient(to right, ${activeColor} ${volumePercent}%, #eee ${volumePercent}%)`;
  const defaultSpeakingKey = ipc.systemSettings.defaultSpeakingKey.get();
  const isKeyMode = speakingMode === 'key';
  const isAutoMode = speakingMode === 'auto';

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
    <div className="mic-mode-menu absolute right-0 bottom-full z-10000 flex flex-col justify-around w-[250px] p-[10px] overflow-hidden cursor-default bg-background rounded-[3px] shadow-box-shadow">
      <div className="col">
        <div className="label">{t('current-speaking-mode')}</div>
        <div className="input-box row">
          <input type="radio" name="visibility" checked={isKeyMode} onChange={handleKeyModeSelect} />
          <div className="label">{t('default-speaking-mode-key-label')}</div>
          <div style={isKeyMode ? {} : { display: 'none' }} className="input-box">
            <input name="speaking-key" type="text" value={defaultSpeakingKey} style={{ maxWidth: '200px' }} readOnly />
          </div>
        </div>
        <div className="input-box row">
          <input type="radio" name="visibility" checked={isAutoMode} onChange={handleAutoModeSelect} />
          <div className="label">{t('default-speaking-mode-auto-label')}</div>
          <div style={isAutoMode ? {} : { display: 'none' }} className="flex gap-[5px] items-center">
            <div className="flex gap-[5px] items-center">
              <input
                className="relative flex-1 h-[8px] appearance-none cursor-pointer border border-border rounded-[5px] shadow-[inset_0_2px_2px_-2px_#0000001f] [&::-webkit-slider-thumb]:w-[8px] [&::-webkit-slider-thumb]:h-[20px] [&::-webkit-slider-thumb]:mt-[-10px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:bg-[url('/channel/Thresholdslider.svg')] before:absolute before:w-full before:h-full before:content-[''] before:bg-[url('/channel/ThresholdLine.svg')] before:bg-repeat-x before:bg-[position:50%_0]"
                type="range"
                min="0"
                max="100"
                value={voiceThreshold}
                style={{ background: voiceThresholdColor }}
                onChange={handleVoiceThresholdChange}
              />
              <div className={`min-w-[12px] min-h-[12px] bg-[url('/channel/audioState.svg')] bg-no-repeat bg-[position:-24px_0] bg-auto ${isActive ? 'opacity-100' : 'opacity-0'}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

MicModeMenu.displayName = 'MicModeMenu';

export default MicModeMenu;
