import React from 'react';
import { useTranslation } from 'react-i18next';

import * as ipc from '@/main/ipc';

interface MaximizedPopupProps {
  id: string;
  title: string;
  buttons: ('minimize' | 'maxsize' | 'close')[];
  onRestore: () => void;
}

const MaximizedPopup: React.FC<MaximizedPopupProps> = React.memo(({ title, buttons, id, onRestore }) => {
  const { t } = useTranslation();

  const handleRestoreBtnClick = () => {
    onRestore();
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  return (
    <button
      key={id}
      type="button"
      onClick={handleRestoreBtnClick}
      title={t(title)}
      className="flex gap-[8px] items-center justify-between h-[40px] px-[10px] py-[8px] overflow-hidden text-ellipsis text-secondary-color whitespace-nowrap bg-main-color rounded-[20px] opacity-50 transition-opacity duration-100 ease-[ease-in-out] hover:opacity-100"
    >
      <div className="text-[14px] font-bold">{t(title)}</div>
      {buttons.includes('close') && (
        <div
          className="inline-block min-w-[20px] min-h-[20px] cursor-pointer bg-[url('/Button_Close.svg')] bg-no-repeat bg-position-[0_0] bg-cover hover:bg-position-[-20px_0] active:bg-position-[-40px_0]"
          onClick={handleCloseBtnClick}
          title={t('close')}
        />
      )}
    </button>
  );
});

MaximizedPopup.displayName = 'MaximizedPopup';

export default MaximizedPopup;
