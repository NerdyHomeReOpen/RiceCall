import React, { useRef } from 'react';

import { useAppSelector } from '@/hooks/Store';

import { useWebRTC } from '@/providers/WebRTC';

import styles from '@/pages/Server/Server.module.css';

const SpeakerVolumeSlider = React.memo(() => {
  const { changeSpeakerVolume, toggleSpeakerMuted } = useWebRTC();

  const sliderRef = useRef<HTMLInputElement>(null);
  const isBtnHoveredRef = useRef<boolean>(false);

  const isSpeakerMuted = useAppSelector((state) => state.webrtc.isSpeakerMuted);
  const speakerVolume = useAppSelector((state) => state.webrtc.speakerVolume);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    changeSpeakerVolume(parseInt(e.target.value));
  };

  const handleBtnClick = () => {
    toggleSpeakerMuted();
  };

  const handleBtnMouseDown = () => {
    isBtnHoveredRef.current = true;
  };

  const handleBtnMouseUp = () => {
    isBtnHoveredRef.current = false;
  };

  const handleBtnWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    if (!isBtnHoveredRef.current) return;
    const newValue = parseInt(sliderRef.current!.value);
    if (e.deltaY > 0) sliderRef.current!.value = (newValue - 4).toString();
    else sliderRef.current!.value = (newValue + 4).toString();
    changeSpeakerVolume(parseInt(sliderRef.current!.value));
  };

  return (
    <div className={styles['volume-slider']}>
      <div className={styles['slider-container']}>
        <input ref={sliderRef} type="range" min="0" max="100" value={speakerVolume} onChange={handleSliderChange} className={styles['slider']} />
      </div>
      <div
        className={`${styles['speaker-btn']} ${isSpeakerMuted ? styles['muted'] : styles['active']}`}
        onClick={handleBtnClick}
        onMouseEnter={handleBtnMouseDown}
        onMouseLeave={handleBtnMouseUp}
        onWheel={handleBtnWheel}
      />
    </div>
  );
});

SpeakerVolumeSlider.displayName = 'SpeakerVolumeSlider';

export default SpeakerVolumeSlider;
