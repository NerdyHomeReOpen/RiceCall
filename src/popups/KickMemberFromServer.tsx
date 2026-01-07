import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Popup from '@/utils/popup';

import popupStyles from '@/styles/popup.module.css';

import { KICK_TIME_FORMAT_OPTIONS, KICK_REASON_OPTIONS, KICK_REASON_OTHER_MAX_LENGTH } from '@/constant';

interface KickMemberFromServerPopupProps {
  serverId: Types.Server['serverId'];
  member: Types.Member;
}

const KickMemberFromServerPopup: React.FC<KickMemberFromServerPopupProps> = React.memo(({ serverId, member }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [formatType, setFormatType] = useState<string>('hours');
  const [time, setTime] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [otherReason, setOtherReason] = useState<string>('');

  // Variables
  const { userId, name: memberName, nickname: memberNickname } = member;

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
        return 1000 * time;
      case 'minutes':
        return 1000 * 60 * time;
      case 'hours':
        return 1000 * 60 * 60 * time;
      case 'days':
        return 1000 * 60 * 60 * 24 * time;
      case 'month':
        return 1000 * 60 * 60 * 24 * 30 * time;
      case 'years':
        return 1000 * 60 * 60 * 24 * 30 * 12 * time;
      default:
        return 1000;
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTime(parseInt(e.target.value));
  };

  const handleFormatTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormatType(e.target.value);
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReason(e.target.value);
  };

  const handleOtherReasonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtherReason(e.target.value);
  };

  const handleConfirmBtnClick = () => {
    Popup.blockUserFromServer(userId, serverId, Date.now() + getBlockTime());
    ipc.window.close();
  };

  const handleCloseBtnClick = () => {
    ipc.window.close();
  };

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={popupStyles['dialog-content']}>
          <div className={`${popupStyles['dialog-icon']} ${popupStyles['alert']}`} />
          <div className={popupStyles['col']}>
            <div className={popupStyles['label']}>{t('confirm-kick-user-from-server', { '0': memberNickname || memberName })}</div>
            <div className={popupStyles['col']}>
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <div className={popupStyles['label']}>{t('kick-time')}</div>
                <div className={`${popupStyles['row']}`}>
                  <div className={popupStyles['select-box']}>
                    <select value={time} onChange={handleTimeChange}>
                      {getLengthOptions().map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={popupStyles['select-box']}>
                    <select value={formatType} onChange={handleFormatTypeChange}>
                      {KICK_TIME_FORMAT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(option.tKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className={`${popupStyles['input-box']} ${popupStyles['col']}`}>
                <div className={popupStyles['label']}>{t('kick-reason')}</div>
                <div className={`${popupStyles['row']}`}>
                  <div className={popupStyles['select-box']}>
                    <select value={reason} onChange={handleReasonChange}>
                      {KICK_REASON_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(option.tKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {reason === 'other' && (
                    <div className={popupStyles['input-box']}>
                      <input
                        type="text"
                        value={otherReason}
                        placeholder={`${t('reason')}(${t('limit-text', { 0: KICK_REASON_OTHER_MAX_LENGTH.toString() })})`}
                        maxLength={KICK_REASON_OTHER_MAX_LENGTH}
                        onChange={handleOtherReasonChange}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={popupStyles['button']} onClick={handleConfirmBtnClick}>
          {t('confirm')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

KickMemberFromServerPopup.displayName = 'KickMemberFromServerPopup';

export default KickMemberFromServerPopup;
