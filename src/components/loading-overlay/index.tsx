import React from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingOverlayProps {
  loadingServerId: string;
  onClose: () => void;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = React.memo(({ loadingServerId, onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed top-0 z-1 flex items-center justify-center w-full h-full">
      <div className="relative flex flex-col items-center justify-center w-[300px] h-[100px] pointer-events-auto bg-background rounded-[3px] shadow-box-shadow">
        <div className="flex mt-[5px] text-center">{t('connecting-server', { '0': loadingServerId })}</div>
        <div className="w-[256px] h-[12px] mt-[15px] bg-[url('/icon_loading.gif')] bg-position-[0_0] bg-contain" />
        <div
          className="absolute top-[5px] right-[6px] w-[18px] h-[18px] cursor-pointer bg-[url('/loading_close.svg')] bg-position-[0_0] bg-cover hover:bg-position-[-18px_0] active:bg-position-[-36px_0]"
          onClick={onClose}
        />
      </div>
    </div>
  );
});

LoadingOverlay.displayName = 'LoadingOverlay';

export default LoadingOverlay;
