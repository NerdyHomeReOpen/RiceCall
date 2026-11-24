import React, { useRef } from 'react';

import { useAppSelector } from '@/hooks/useStore';

import { useWebRTC } from '@/providers/WebRTC';

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
    if (!isBtnHoveredRef.current || !sliderRef.current) return;
    const newValue = parseInt(sliderRef.current.value);

    if (e.deltaY > 0) sliderRef.current.value = (newValue - 4).toString();
    else sliderRef.current.value = (newValue + 4).toString();

    changeSpeakerVolume(parseInt(sliderRef.current.value));
  };

  return (
    <div className="relative flex gap-[5px] items-center">
      <div
        className={`peer relative w-[18px] min-w-[18px] h-[18px] min-h-[18px] cursor-pointer bg-[url('/channel/speaker.svg')] bg-no-repeat bg-[position:0_0] after:absolute after:min-w-[18px] after:min-h-[18px] after:content-[''] after:bg-[url('/channel/speaker.svg')] after:bg-no-repeat after:bg-[position:-18px_0] ${isSpeakerMuted ? 'after:opacity-100' : 'after:opacity-0'}`}
      />
      <div className="absolute bottom-[-3px] left-[-3px] z-10000 hidden flex-col items-center justify-end w-[24px] h-fit p-[3px] bg-background rounded-[3px] shadow-box-shadow peer-hover:flex hover:flex">
        <div className="relative flex w-[4px] h-[120px] m-[10px] rounded-[2px]">
          <input
            ref={sliderRef}
            type="range"
            min="0"
            max="100"
            value={speakerVolume}
            onChange={handleSliderChange}
            className="absolute top-[calc(50%-4px)] left-[-58px] w-[120px] h-[4px] appearance-none bg-border rounded-[2px] -rotate-90 [&::-webkit-slider-thumb]:w-[14px] [&::-webkit-slider-thumb]:h-[14px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-border-secondary [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        <div
          className={`relative w-[18px] min-w-[18px] h-[18px] min-h-[18px] cursor-pointer bg-[url('/channel/speaker.svg')] bg-no-repeat bg-[position:0_0] after:absolute after:min-w-[18px] after:min-h-[18px] after:content-[''] after:bg-[url('/channel/speaker.svg')] after:bg-no-repeat after:bg-[position:-18px_0] ${isSpeakerMuted ? 'after:opacity-100' : 'after:opacity-0'}`}
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
