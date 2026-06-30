import React, { useRef } from 'react';

import { useAppSelector } from '@/hooks/useStore';

import { useWebRTC } from '@/providers/WebRTC';

import styles from './Server.module.css';

const SpeakerVolumeSlider = React.memo(() => {
  const { changeSpeakerVolume, toggleSpeakerMuted } = useWebRTC();

  const sliderEl = useRef<HTMLInputElement>(null);
  const isBtnHovered = useRef<boolean>(false);

  const isSpeakerMuted = useAppSelector((state) => state.webrtc.isSpeakerMuted);
  const speakerVolume = useAppSelector((state) => state.webrtc.speakerVolume);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    changeSpeakerVolume(parseInt(e.target.value));
  };

  const handleBtnClick = () => {
    toggleSpeakerMuted();
  };

  const handleBtnMouseDown = () => {
    isBtnHovered.current = true;
  };

  const handleBtnMouseUp = () => {
    isBtnHovered.current = false;
  };

  const handleBtnWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    if (!isBtnHovered.current || !sliderEl.current) return;

    const newValue = parseInt(sliderEl.current.value);

    if (e.deltaY > 0) {
      sliderEl.current.value = (newValue - 4).toString();
    } else {
      sliderEl.current.value = (newValue + 4).toString();
    }

    changeSpeakerVolume(parseInt(sliderEl.current.value));
  };

  return (
    <div className={styles['speaker-volume-container']}>
      <div className={`${styles['speaker-volume-button']} ${isSpeakerMuted ? styles['muted'] : ''}`} />
      <div className={styles['slider-track']}>
        <div className={styles['slider-container']}>
          <input ref={sliderEl} type="range" min="0" max="100" value={speakerVolume} onChange={handleSliderChange} className={styles['slider']} />
        </div>
        <div
          className={`${styles['speaker-volume-button']} ${isSpeakerMuted ? styles['muted'] : styles['active']}`}
          onClick={handleBtnClick}
          onMouseEnter={handleBtnMouseDown}
          onMouseLeave={handleBtnMouseUp}
          onWheel={handleBtnWheel}
        />
      </div>
    </div>
  );
});

SpeakerVolumeSlider.displayName = 'SpeakerVolumeSlider';

export default SpeakerVolumeSlider;
