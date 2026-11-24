import React from 'react';
import { useTranslation } from 'react-i18next';

interface UnreadMessageAlertProps {
  unreadMessageCount: number;
  onAlertClick: () => void;
}

const UnreadMessageAlert: React.FC<UnreadMessageAlertProps> = React.memo(({ unreadMessageCount, onAlertClick }) => {
  const { t } = useTranslation();

  return (
    <>
      {unreadMessageCount > 0 && (
        <div
          className="absolute right-[10px] h-[24px] px-[5px] text-[0.9rem] leading-[24px] text-white text-center bg-[#ff3b3b] rounded-[12px] transition-[color,background-color] duration-200 ease-[ease] hover:cursor-pointer hover:bg-[#cc2121]"
          onClick={onAlertClick}
        >
          {t('has-new-message', { 0: unreadMessageCount })}
        </div>
      )}
    </>
  );
});

UnreadMessageAlert.displayName = 'UnreadMessageAlert';

export default UnreadMessageAlert;
