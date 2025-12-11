import React, { useState } from 'react';

// Types
import type { Member, Server, Channel, User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/ipc';

interface KickMemberFromChannelPopupProps {
  serverId: Server['serverId'];
  channel: Channel;
  member: Member;
}

const KickMemberFromChannelPopup: React.FC<KickMemberFromChannelPopupProps> = React.memo(({ serverId, channel, member }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [formatType, setFormatType] = useState<string>('hours');
  const [selectTime, setSelectTime] = useState<number>(1);
  const [selectReason, setSelectReason] = useState<string>('');
  const [otherReason, setOtherReason] = useState<string>('');

  // Variables
  const { userId, name: memberName, nickname: memberNickname } = member;
  const formatTypeOptions = [
    { key: 'seconds', label: t('second') },
    { key: 'minutes', label: t('minute') },
    { key: 'hours', label: t('hour') },
    { key: 'days', label: t('day') },
    { key: 'month', label: t('month') },
    { key: 'years', label: t('year') },
  ];
  const kickReasonOptions = [
    { key: 'spam', label: t('reason-spam') },
    { key: 'abuse', label: t('reason-abuse') },
    { key: 'harassment', label: t('reason-harassment') },
    { key: 'inappropriate-content', label: t('reason-inappropriate-content') },
    { key: 'other', label: t('reason-other') },
  ];

  // Handlers
  const getLengthOptions = () => {
    switch (formatType) {
      case 'seconds':
        return Array.from({ length: 60 }, (_, i) => i + 1);
      case 'minutes':
        return Array.from({ length: 60 }, (_, i) => i + 1);
      case 'hours':
        return Array.from({ length: 24 }, (_, i) => i + 1);
      case 'days':
        return Array.from({ length: 30 }, (_, i) => i + 1);
      case 'month':
        return Array.from({ length: 12 }, (_, i) => i + 1);
      case 'years':
        return Array.from({ length: 100 }, (_, i) => i + 1);
      default:
        return [];
    }
  };

  const getBlockTime = () => {
    switch (formatType) {
      case 'seconds':
        return 1000 * selectTime;
      case 'minutes':
        return 1000 * 60 * selectTime;
      case 'hours':
        return 1000 * 60 * 60 * selectTime;
      case 'days':
        return 1000 * 60 * 60 * 24 * selectTime;
      case 'month':
        return 1000 * 60 * 60 * 24 * 30 * selectTime;
      case 'years':
        return 1000 * 60 * 60 * 24 * 30 * 12 * selectTime;
      default:
        return 1000;
    }
  };

  const handleBlockUserFromChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId'], blockUntil: number) => {
    ipc.socket.send('blockUserFromChannel', { userId, serverId, channelId, blockUntil });
    ipc.window.close();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popup['popup-wrapper']}>
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={`${popup['dialog-icon']} ${popup['alert']}`} />
          <div className={popup['col']}>
            <div className={popup['label']} style={{ minWidth: '0' }}>
              {t('confirm-kick-user-from-channel', { '0': memberNickname || memberName, '1': channel.name })}
            </div>
            <div className={popup['col']}>
              <div className={`${popup['input-box']} ${popup['col']}`}>
                <div className={popup['label']}>{t('kick-time')}</div>
                <div className={`${popup['row']}`}>
                  <div className={popup['select-box']}>
                    <select value={selectTime} onChange={(e) => setSelectTime(parseInt(e.target.value))}>
                      {getLengthOptions().map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={popup['select-box']}>
                    <select value={formatType} onChange={(e) => setFormatType(e.target.value)}>
                      {formatTypeOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className={`${popup['input-box']} ${popup['col']}`}>
                <div className={popup['label']}>{t('kick-reason')}</div>
                <div className={`${popup['row']}`}>
                  <div className={popup['select-box']}>
                    <select value={selectReason} onChange={(e) => setSelectReason(e.target.value)}>
                      {kickReasonOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectReason === 'other' && (
                    <div className={popup['input-box']}>
                      <input type="text" value={otherReason} placeholder={`${t('reason')}(${t('limit-text', { 0: '20' })})`} maxLength={20} onChange={(e) => setOtherReason(e.target.value)} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={popup['popup-footer']}>
        <div className={popup['button']} onClick={() => handleBlockUserFromChannel(userId, serverId, channel.channelId, Date.now() + getBlockTime())}>
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

KickMemberFromChannelPopup.displayName = 'BKickMemberFromChannelPopup';

export default KickMemberFromChannelPopup;
