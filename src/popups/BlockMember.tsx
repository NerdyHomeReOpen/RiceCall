import React, { useState, useMemo } from 'react';

// Types
import type { Member, Server, User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/services/ipc.service';

interface BlockMemberPopupProps {
  serverId: Server['serverId'];
  member: Member;
}

const BlockMemberPopup: React.FC<BlockMemberPopupProps> = React.memo(({ serverId, member }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [blockType, setBlockType] = useState<'block-temporary' | 'block-permanent' | 'block-ip'>('block-temporary');
  const [formatType, setFormatType] = useState<string>('hours');
  const [selectTime, setSelectTime] = useState<number>(1);

  // Destructuring
  const { userId, name: memberName, nickname: memberNickname } = member;

  // Memos
  const BLOCK_TYPE_OPTIONS = useMemo(
    () => [
      { key: 'block-temporary', label: t('block-temporary'), disabled: false },
      { key: 'block-permanent', label: t('block-permanent'), disabled: false },
      { key: 'block-ip', label: t('block-ip'), disabled: true },
    ],
    [t],
  );
  const FORMAT_TYPE_OPTIONS = useMemo(
    () => [
      { key: 'seconds', label: t('second') },
      { key: 'minutes', label: t('minute') },
      { key: 'hours', label: t('hour') },
      { key: 'days', label: t('day') },
      { key: 'month', label: t('month') },
      { key: 'years', label: t('year') },
    ],
    [t],
  );
  const LENGTH_OPTIONS = useMemo(() => {
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
  }, [formatType]);
  const BLOCK_TIME = useMemo(() => {
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
  }, [formatType, selectTime]);

  // Variables
  const isBlock = blockType === 'block-temporary';

  // Handlers
  const handleBlockUserFromServer = (userId: User['userId'], serverId: Server['serverId'], blockUntil: number) => {
    ipc.socket.send('blockUserFromServer', { userId, serverId, blockUntil });
    ipc.socket.send('terminateMember', { userId, serverId });
    ipc.window.close();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={`${popup['dialog-icon']} ${popup['alert']}`} />
          <div className={popup['col']}>
            <div className={popup['label']}>{t('confirm-block-user', { '0': memberNickname || memberName })}</div>
            <div className={popup['col']}>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <div className={popup['label']}>{t('block-type')}</div>
                <div className={popup['select-box']}>
                  <select value={blockType} onChange={(e) => setBlockType(e.target.value as 'block-temporary' | 'block-permanent' | 'block-ip')}>
                    {BLOCK_TYPE_OPTIONS.map((option) => (
                      <option key={option.key} value={option.key} disabled={option.disabled}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <div className={popup['label']}>{t('block-time')}</div>
                <div className={popup['select-box']}>
                  <select value={selectTime} disabled={!isBlock} onChange={(e) => setSelectTime(parseInt(e.target.value))}>
                    {LENGTH_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={popup['select-box']}>
                  <select value={formatType} disabled={!isBlock} onChange={(e) => setFormatType(e.target.value)}>
                    {FORMAT_TYPE_OPTIONS.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div className={popup['button']} onClick={() => handleBlockUserFromServer(userId, serverId, blockType === 'block-temporary' ? Date.now() + BLOCK_TIME : -1)}>
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

BlockMemberPopup.displayName = 'BlockMemberPopup';

export default BlockMemberPopup;
