import React from 'react';
import { useTranslation } from 'react-i18next';

import * as ipc from '@/main/ipc';

import type * as Types from '@/types';

type ServerApplicationPopupProps = Types.PopupProps<'serverApplication'>;

const ServerApplicationPopup: React.FC<ServerApplicationPopupProps> = React.memo(({ id, server }) => {
  const { t } = useTranslation();

  const handleShowFrameBtnClick = () => {
    ipc.popup.submit('serverApplication', 'openShowFrame');
    ipc.popup.close(id);
  };

  const handleChannelEventBtnClick = () => {
    ipc.popup.submit('serverApplication', 'openChannelEvent');
    ipc.popup.close(id);
  };

  return (
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="flex gap-[8px] items-center justify-evenly w-full h-[80px] bg-[url('/channel/dialog_body_bg.svg')] bg-no-repeat bg-center bg-cover">
          <div className="flex flex-col items-center w-[55px] cursor-pointer disabled">
            <div className="w-[44px] h-[44px] bg-position-[-44px_0] bg-[url('/channel/widget_vote.svg')]" />
            <div className="mt-[4px] text-[12px] text-center">{t('vote')}</div>
          </div>
          <div className="flex flex-col items-center w-[55px] cursor-pointer" onClick={handleChannelEventBtnClick}>
            <div className="w-[44px] h-[44px] bg-position-[-44px_0] bg-[url('/channel/widget_chnEvent.svg')]" />
            <div className="mt-[4px] text-[12px] text-center">{t('channel-event')}</div>
          </div>
          <div className="flex flex-col items-center w-[55px] cursor-pointer" onClick={handleShowFrameBtnClick}>
            <div className="w-[44px] h-[44px] bg-position-[-44px_0] bg-[url('/channel/widget_flower.svg')]" />
            <div className="mt-[4px] text-[12px] text-center">{t('send-flower')}</div>
          </div>
          <div className="flex flex-col items-center w-[55px] cursor-pointer disabled">
            <div className="w-[44px] h-[44px] bg-position-[-44px_0] bg-[url('/channel/widget_lottery.svg')]" />
            <div className="mt-[4px] text-[12px] text-center">{t('scratch-card')}</div>
          </div>
          <div className={`flex flex-col items-center w-[55px] cursor-pointer ${server.isShowAvailable ? '' : 'disabled'}`}>
            <div className="w-[44px] h-[44px] bg-position-[-44px_0] bg-[url('/channel/widget_Show.svg')]" />
            <div className="mt-[4px] text-[12px] text-center">{t('show-room')}</div>
          </div>
        </div>
      </div>
      <div className="popup-footer">
        <div className="min-h-[27px]" />
      </div>
    </div>
  );
});

ServerApplicationPopup.displayName = 'ServerApplicationPopup';

export default ServerApplicationPopup;
