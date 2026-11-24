import React, { useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@/hooks/useStore';

import { useWebRTC } from '@/providers/WebRTC';

import MicModeMenu from './MicModeMenu';

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
    if (!isBtnHoveredRef.current || !sliderRef.current) return;

    const newValue = parseInt(sliderRef.current.value);
    if (e.deltaY > 0) sliderRef.current.value = (newValue - 4).toString();
    else sliderRef.current.value = (newValue + 4).toString();
    changeMicVolume(parseInt(sliderRef.current.value));
  };

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.mic-mode-menu')) {
        setIsMicModeMenuVisible(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return (
    <div className="relative flex gap-[5px] items-center">
      <div
        className={`peer relative w-[18px] min-w-[18px] h-[18px] min-h-[18px] cursor-pointer bg-[url('/channel/Mic.svg')] bg-no-repeat bg-[position:0_0] after:absolute after:min-w-[18px] after:min-h-[18px] after:content-[''] after:bg-[url('/channel/Mic.svg')] after:bg-no-repeat after:bg-[position:-16px_0] ${isMicMuted ? 'after:opacity-100' : 'after:opacity-0'}`}
      />
      <div className="absolute bottom-[-3px] left-[-3px] z-10000 hidden flex-col items-center justify-end w-[24px] h-fit p-[3px] bg-background rounded-[3px] shadow-box-shadow peer-hover:flex hover:flex">
        <div className="relative flex w-[4px] h-[120px] m-[10px] rounded-[2px]">
          <input
            ref={sliderRef}
            type="range"
            min="0"
            max="100"
            value={micVolume}
            onChange={handleSliderChange}
            className="absolute top-[calc(50%-4px)] left-[-58px] w-[120px] h-[4px] appearance-none bg-border rounded-[2px] -rotate-90 [&::-webkit-slider-thumb]:w-[14px] [&::-webkit-slider-thumb]:h-[14px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-border-secondary [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        <div
          className={`relative w-[18px] min-w-[18px] h-[18px] min-h-[18px] cursor-pointer bg-[url('/channel/Mic.svg')] bg-no-repeat bg-[position:0_0] after:absolute after:min-w-[18px] after:min-h-[18px] after:content-[''] after:bg-[url('/channel/Mic.svg')] after:bg-no-repeat after:bg-[position:-16px_0] ${isMicMuted ? 'after:opacity-100' : 'after:opacity-0'}`}
          onClick={handleBtnClick}
          onMouseEnter={handleBtnMouseDown}
          onMouseLeave={handleBtnMouseUp}
          onWheel={handleBtnWheel}
        />
      </div>
      <div
        className="relative w-[8px] min-w-[8px] h-[8px] min-h-[8px] cursor-pointer after:absolute after:min-w-[8px] after:min-h-[8px] after:content-[''] after:bg-[url('/channel/triangle.svg')] after:bg-no-repeat after:bg-[position:0_0] after:rotate-180 hover:after:bg-[position:-9px_0] active:after:bg-[position:-18px_0]"
        onClick={handleMicModeDropdownBtnClick}
      >
        {isMicModeMenuVisible ? <MicModeMenu /> : ''}
      </div>
    </div>
  );
});

MicVolumeSlider.displayName = 'MicVolumeSlider';

export default MicVolumeSlider;
