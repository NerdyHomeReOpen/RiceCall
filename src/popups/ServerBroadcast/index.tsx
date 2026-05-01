import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import * as ipc from '@/main/ipc';

import type * as Types from '@/types';

import * as Actions from '@/action';

import { MAX_BROADCAST_LENGTH } from '@/constants';

interface ServerBroadcastPopupProps {
  id: string;
  serverId: Types.Server['serverId'];
  channelId: Types.Channel['channelId'];
}

const ServerBroadcastPopup: React.FC<ServerBroadcastPopupProps> = React.memo(({ id, serverId, channelId }) => {
  const { t } = useTranslation();

  const [sendType, setSendType] = useState<'text' | 'voice'>('text');
  const [broadcastType, setBroadcastType] = useState<'channel' | 'server'>('channel');
  const [broadcastContent, setBroadcastContent] = useState<string>('');

  const canSend = broadcastContent.trim() && broadcastContent.length <= MAX_BROADCAST_LENGTH;

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
    if (broadcastType === 'channel') Actions.broadcastChannel(serverId, channelId, { type: 'alert', content: broadcastContent });
    else Actions.broadcastServer(serverId, { type: 'alert', content: broadcastContent });
    ipc.popup.close(id);
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  return (
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="dialog-content col">
          <div className="row">
            <div className="label">{t('receive-channel')}</div>
            <div className="input-box row" style={{ width: 'fit-content' }}>
              <input name="channelType" type="radio" checked={broadcastType === 'channel'} onChange={handleBroadcastChannelClick} />
              <div className="label">{t('current-channel')}</div>
            </div>
            <div className="input-box row" style={{ width: 'fit-content' }}>
              <input name="channelType" type="radio" checked={broadcastType === 'server'} onChange={handleBroadcastServerClick} />
              <div className="label">{t('all-channel')}</div>
            </div>
          </div>
          <div className="row">
            <div className="label">{t('broadcast-type')}</div>
            <div className="input-box row" style={{ width: 'fit-content' }}>
              <input name="sendType" type="radio" checked={sendType === 'text'} onChange={handleSendTextClick} />
              <div className="label">{t('text-broadcast')}</div>
            </div>
            <div className="input-box row disabled" style={{ width: 'fit-content' }}>
              <input name="sendType" type="radio" checked={sendType === 'voice'} onChange={handleSendVoiceClick} />
              <div className="label">{`${t('voice-broadcast')} ${t('soon')}`}</div>
            </div>
          </div>
          <div className="input-box col">
            <div className="label">{t('broadcast-content')}</div>
            <textarea name="content" maxLength={MAX_BROADCAST_LENGTH} style={{ minHeight: '90px' }} onChange={handleBroadcastContentChange} />
            <div className="hint-text">
              {broadcastContent.length}/{MAX_BROADCAST_LENGTH}
            </div>
          </div>
        </div>
      </div>
      <div className="popup-footer">
        <div className={`button ${!canSend ? 'disabled' : ''}`} onClick={handleConfirmBtnClick}>
          {t('confirm')}
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

ServerBroadcastPopup.displayName = 'ServerBroadcastPopup';

export default ServerBroadcastPopup;
