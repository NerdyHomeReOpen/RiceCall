import React from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

interface PopupHeaderProps {
  title: string;
  buttons: ('minimize' | 'maxsize' | 'close')[];
  popupType: Types.PopupType;
  isFullscreen: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onRestore: () => void;
  onClose: () => void;
}

const PopupHeader: React.FC<PopupHeaderProps> = React.memo(({ title, buttons, popupType, isFullscreen, onMinimize, onMaximize, onRestore, onClose }) => {
  const { t } = useTranslation();

  const handleMinimizeBtnClick = () => {
    onMinimize();
  };

  const handleMaximizeBtnClick = () => {
    onMaximize();
  };

  const handleRestoreBtnClick = () => {
    onRestore();
  };

  const handleCloseBtnClick = () => {
    onClose();
  };

  return (
    <header
      className="z-10 flex justify-between min-h-[30px] text-secondary-color bg-main-color bg-(image:--header-image) bg-no-repeat bg-position-[0_0] bg-cover [-webkit-app-region:drag]"
      data-draggable
    >
      <div
        className="flex flex-row gap-[5px] items-center justify-between px-[10px] before:inline-block before:min-w-[18px] before:min-h-[18px] before:content-[''] before:bg-[url('/rc_logo_small.svg')] before:bg-no-repeat before:bg-center before:bg-auto"
        data-popup-type={popupType}
      >
        <div className="overflow-hidden text-ellipsis text-[13px] whitespace-nowrap">{t(title)}</div>
      </div>
      <div className="flex gap-[5px] items-center justify-end min-w-fit mr-[10px] [-webkit-app-region:no-drag] cursor-pointer">
        {buttons.includes('minimize') && (
          <div
            className="inline-block min-w-[20px] min-h-[20px] cursor-pointer bg-no-repeat bg-position-[0_0] bg-cover hover:bg-position-[-20px_0] active:bg-position-[-40px_0] bg-[url('/Button_Minsize.svg')]"
            onClick={handleMinimizeBtnClick}
          />
        )}
        {buttons.includes('maxsize') &&
          (isFullscreen ? (
            <div
              className="inline-block min-w-[20px] min-h-[20px] cursor-pointer bg-no-repeat bg-position-[0_0] bg-cover hover:bg-position-[-20px_0] active:bg-position-[-40px_0] bg-[url('/Button_Restore.svg')]"
              onClick={handleRestoreBtnClick}
            />
          ) : (
            <div
              className="inline-block min-w-[20px] min-h-[20px] cursor-pointer bg-no-repeat bg-position-[0_0] bg-cover hover:bg-position-[-20px_0] active:bg-position-[-40px_0] bg-[url('/Button_Maxsize.svg')]"
              onClick={handleMaximizeBtnClick}
            />
          ))}
        {buttons.includes('close') && (
          <div
            className="inline-block min-w-[20px] min-h-[20px] cursor-pointer bg-no-repeat bg-position-[0_0] bg-cover hover:bg-position-[-20px_0] active:bg-position-[-40px_0] bg-[url('/Button_Close.svg')]"
            onClick={handleCloseBtnClick}
          />
        )}
      </div>
    </header>
  );
});

PopupHeader.displayName = 'PopupHeader';

export default PopupHeader;
