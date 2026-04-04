import React, { useRef } from 'react';

import { useAppSelector } from '@/hooks/Store';

import { useWebRTC } from '@/providers/WebRTC';

import styles from '@/styles/Server.module.css';

const MicVolumeSlider = React.memo(() => {
  const { changeMicVolume, toggleMicMuted } = useWebRTC();

  const sliderRef = useRef<HTMLInputElement>(null);
  const isBtnHoveredRef = useRef<boolean>(false);

  const isMicMuted = useAppSelector((state) => state.webrtc.isMicMuted);
  const micVolume = useAppSelector((state) => state.webrtc.micVolume);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    changeMicVolume(parseInt(e.target.value));
  };

  const handleBtnClick = () => {
    toggleMicMuted();
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
    changeMicVolume(parseInt(sliderRef.current!.value));
  };

  return (
    <div className={styles['volume-slider']}>
      <div className={styles['slider-container']}>
        <input ref={sliderRef} type="range" min="0" max="100" value={micVolume} onChange={handleSliderChange} className={styles['slider']} />
      </div>
      <div
        className={`${styles['mic-btn']} ${isMicMuted ? styles['muted'] : styles['active']}`}
        onClick={handleBtnClick}
        onMouseEnter={handleBtnMouseDown}
        onMouseLeave={handleBtnMouseUp}
        onWheel={handleBtnWheel}
      />
    </div>
  );
});

MicVolumeSlider.displayName = 'MicVolumeSlider';

export default MicVolumeSlider;
