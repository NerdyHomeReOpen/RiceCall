import React, { useState, useMemo } from 'react';

// Types
import type { Member, Server, User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipcService from '@/services/ipc.service';

interface BlockMemberPopupProps {
  userId: User['userId'];
  serverId: Server['serverId'];
  userName: User['name'];
}

const BlockMemberPopup: React.FC<BlockMemberPopupProps> = React.memo(({ userId, serverId, userName }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [blockType, setBlockType] = useState<string>('timeout');
  const [formatType, setFormatType] = useState<string>('hours');
  const [selectTime, setSelectTime] = useState<number>(1);

  // Memos
  const BLOCK_TYPE_OPTIONS = useMemo(
    () => [
      { key: 'timeout', label: t('timeout'), disabled: false },
      { key: 'block-forever', label: t('block-forever'), disabled: false },
      { key: 'blockIP', label: t('block-ip'), disabled: true },
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
  const isForeverBlock = blockType !== 'timeout';

  // Handlers
  const handleBlockMember = (userId: User['userId'], serverId: Server['serverId'], update: Partial<Member>) => {
    ipcService.socket.send('editMember', { userId, serverId, update });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={`${popup['dialog-icon']} ${popup['alert']}`} />
          <div>
            <div className={popup['label']}>{t('confirm-block-user', { '0': userName })}</div>
            <div className={popup['col']}>
              <div className={`${popup['input-box']} ${popup['row']}`}>
                <div className={popup['label']}>{t('block-type')}</div>
                <div className={popup['select-box']}>
                  <select value={blockType} onChange={(e) => setBlockType(e.target.value)}>
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
                  <select value={selectTime} disabled={isForeverBlock} onChange={(e) => setSelectTime(parseInt(e.target.value))}>
                    {LENGTH_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={popup['select-box']}>
                  <select value={formatType} disabled={isForeverBlock} onChange={(e) => setFormatType(e.target.value)}>
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
      ;{/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={popup['button']}
          onClick={() => {
            handleBlockMember(userId, serverId, blockType === 'timeout' ? { isBlocked: Date.now() + BLOCK_TIME } : { isBlocked: -1, permissionLevel: 1, nickname: null });
            handleClose();
          }}
        >
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
