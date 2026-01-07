import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Popup from '@/utils/popup';

import { MAX_BROADCAST_LENGTH } from '@/constant';

import popupStyles from '@/styles/popup.module.css';

interface ServerBroadcastPopupProps {
  serverId: Types.Server['serverId'];
  channelId: Types.Channel['channelId'];
}

const ServerBroadcastPopup: React.FC<ServerBroadcastPopupProps> = React.memo(({ serverId, channelId }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [sendType, setSendType] = useState<'text' | 'voice'>('text');
  const [broadcastType, setBroadcastType] = useState<'channel' | 'server'>('channel');
  const [broadcastContent, setBroadcastContent] = useState<string>('');

  // Variables
  const canSend = broadcastContent.trim() && broadcastContent.length <= MAX_BROADCAST_LENGTH;

  // Handlers
  const handleBroadcastChannelClick = () => {
    setBroadcastType('channel');
  };

  const handleBroadcastServerClick = () => {
    setBroadcastType('server');
  };

  const handleSendTextClick = () => {
    setSendType('text');
  };

  const handleSendVoiceClick = () => {
    setSendType('voice');
  };

  const handleBroadcastContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBroadcastContent(e.target.value);
  };

  const handleConfirmBtnClick = () => {
    if (!canSend) return;
    if (broadcastType === 'channel') Popup.broadcastChannel(serverId, channelId, { type: 'alert', content: broadcastContent });
    else Popup.broadcastServer(serverId, { type: 'alert', content: broadcastContent });
    ipc.window.close();
  };

  const handleCloseBtnClick = () => {
    ipc.window.close();
  };

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={`${popupStyles['content']} ${popupStyles['col']}`}>
          <div className={popupStyles['row']}>
            <div className={popupStyles['label']}>{t('receive-channel')}</div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`} style={{ width: 'fit-content' }}>
              <input name="channelType" type="radio" checked={broadcastType === 'channel'} onChange={handleBroadcastChannelClick} />
              <div className={popupStyles['label']}>{t('current-channel')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`} style={{ width: 'fit-content' }}>
              <input name="channelType" type="radio" checked={broadcastType === 'server'} onChange={handleBroadcastServerClick} />
              <div className={popupStyles['label']}>{t('all-channel')}</div>
            </div>
          </div>
          <div className={popupStyles['row']}>
            <div className={popupStyles['label']}>{t('broadcast-type')}</div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']}`} style={{ width: 'fit-content' }}>
              <input name="sendType" type="radio" checked={sendType === 'text'} onChange={handleSendTextClick} />
              <div className={popupStyles['label']}>{t('text-broadcast')}</div>
            </div>
            <div className={`${popupStyles['input-box']} ${popupStyles['row']} ${'disabled'}`} style={{ width: 'fit-content' }}>
              <input name="sendType" type="radio" checked={sendType === 'voice'} onChange={handleSendVoiceClick} />
              <div className={popupStyles['label']}>{`${t('voice-broadcast')} ${t('soon')}`}</div>
            </div>
          </div>
          <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
            <div className={popupStyles['label']}>{t('broadcast-content')}</div>
            <textarea name="content" maxLength={MAX_BROADCAST_LENGTH} style={{ minHeight: '90px' }} onChange={handleBroadcastContentChange} />
            <div className={popupStyles['hint-text']}>
              {broadcastContent.length}/{MAX_BROADCAST_LENGTH}
            </div>
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={`${popupStyles['button']} ${!canSend ? 'disabled' : ''}`} onClick={handleConfirmBtnClick}>
          {t('confirm')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

ServerBroadcastPopup.displayName = 'ServerBroadcastPopup';

export default ServerBroadcastPopup;
