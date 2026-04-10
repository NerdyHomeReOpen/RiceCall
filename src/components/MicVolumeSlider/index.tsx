import React, { useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@/hooks/Store';

import { useWebRTC } from '@/providers/WebRTC';

import MicModeMenu from './MicModeMenu';

import styles from './MicVolumeSlider.module.css';

const MicVolumeSlider = React.memo(() => {
  const { changeMicVolume, toggleMicMuted } = useWebRTC();

  const sliderRef = useRef<HTMLInputElement>(null);
  const isBtnHoveredRef = useRef<boolean>(false);

  const isMicMuted = useAppSelector((state) => state.webrtc.isMicMuted);
  const micVolume = useAppSelector((state) => state.webrtc.micVolume);

  const [isMicModeMenuVisible, setIsMicModeMenuVisible] = useState<boolean>(false);

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

  const handleMicModeDropdownBtnClick = () => {
    setIsMicModeMenuVisible(true);
  };

  const handleBtnWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    if (!isBtnHoveredRef.current) return;
    const newValue = parseInt(sliderRef.current!.value);
    if (e.deltaY > 0) sliderRef.current!.value = (newValue - 4).toString();
    else sliderRef.current!.value = (newValue + 4).toString();
    changeMicVolume(parseInt(sliderRef.current!.value));
  };

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(`.${styles['mic-mode-menu']}`)) {
        setIsMicModeMenuVisible(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return (
    <div className={styles['mic-volume-container']}>
      <div className={`${styles['mic-volume-button']} ${isMicMuted ? styles['muted'] : styles['active']}`} />
      <div className={styles['mic-volume-slider']}>
        <div className={styles['mic-volume-slider-container']}>
          <input ref={sliderRef} type="range" min="0" max="100" value={micVolume} onChange={handleSliderChange} className={styles['slider']} />
        </div>
        <div
          className={`${styles['mic-volume-button']} ${isMicMuted ? styles['muted'] : styles['active']}`}
          onClick={handleBtnClick}
          onMouseEnter={handleBtnMouseDown}
          onMouseLeave={handleBtnMouseUp}
          onWheel={handleBtnWheel}
        />
      </div>
      <div className={styles['mic-mode-dropdown-button']} onClick={handleMicModeDropdownBtnClick}>
        {isMicModeMenuVisible ? <MicModeMenu /> : ''}
      </div>
    </div>
  );
});

MicVolumeSlider.displayName = 'MicVolumeSlider';

export default MicVolumeSlider;
