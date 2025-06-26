import React, { useState, useEffect } from 'react';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';

// Types
import { Server, User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/Socket';

// CSS
import popup from '@/styles/popup.module.css';
import styles from '@/styles/popups/blockMember.module.css';

// Services
import ipcService from '@/services/ipc.service';

// Utils
import { getTranslatedMessage } from '@/utils/language';

interface BlockMemberPopupProps {
  userId: User['userId'];
  serverId: Server['serverId'];
  userName: User['name'];
}

const BlockMemberPopup: React.FC<BlockMemberPopupProps> = React.memo(({ userId, serverId, userName }) => {
  // Hooks
  const { t } = useTranslation();
  const socket = useSocket();

  // States
  const [blockType, setBlockType] = useState<string>('timeout');
  const [formatType, setFormatType] = useState<string>('hours');
  const [selectTime, setSelectTime] = useState<number>(1);
  const [blockTime, setBlockTime] = useState<number>(0);

  // Constants
  const BLOCK_TYPE_OPTIONS = [
    { key: 'timeout', label: t('timeout'), disabled: false },
    { key: 'block', label: t('block'), disabled: false },
    { key: 'blockIP', label: t('blockIP'), disabled: true },
  ];

  const FORMAT_TYPE_OPTIONS = [
    { key: 'seconds', label: t('seconds') },
    { key: 'minutes', label: t('minutes') },
    { key: 'hours', label: t('hours') },
    { key: 'days', label: t('days') },
    { key: 'month', label: t('month') },
    { key: 'years', label: t('years') },
  ];

  const isForeverBlock = blockType !== 'timeout';

  // Handles
  const handleBlockMember = () => {
    const memberData =
      blockType === 'timeout'
        ? {
            isBlocked: Date.now() + blockTime,
          }
        : {
            isBlocked: -1,
            permissionLevel: 1,
            nickname: null,
          };

    socket.send.editMember({
      member: memberData,
      userId,
      serverId,
    });
    socket.send.disconnectServer({ userId, serverId });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  useEffect(() => {
    switch (formatType) {
      case 'seconds':
        setBlockTime(1000 * selectTime);
        break;
      case 'minutes':
        setBlockTime(1000 * 60 * selectTime);
        break;
      case 'hours':
        setBlockTime(1000 * 60 * 60 * selectTime);
        break;
      case 'days':
        setBlockTime(1000 * 60 * 60 * 24 * selectTime);
        break;
      case 'month':
        setBlockTime(1000 * 60 * 60 * 24 * 30 * selectTime);
        break;
      case 'years':
        setBlockTime(1000 * 60 * 60 * 24 * 30 * 12 * selectTime);
        break;
      default:
        setBlockTime(1000);
    }
  }, [formatType, selectTime]);

  return (
    <div className={popup['popupContainer']}>
      {/* Body */}
      <div className={`${popup['popupBody']}`}>
        <div className={`${styles['content']}`}>
          <div className={`${popup['dialogContent']} ${styles['top']}`}>
            <div
              className={`
                  ${popup['dialogIcon']}
                  ${popup['alert']}
                `}
            />
            <div className={`${styles['content']}`}>
              <div className={`${popup['label']} ${styles['label']}`}>
                <MarkdownViewer markdownText={getTranslatedMessage(t, 'sureBlockMember', { userName: userName })} />
              </div>
              <div className={`${popup['inputGroup']} ${popup['col']}`}>
                <div className={`${popup['inputBox']} ${styles['inputBox']} ${popup['row']}`}>
                  <div className={`${popup['label']}`}>{t('封鎖類型')}</div>
                  <div className={`${popup['selectBox']}`}>
                    <select value={blockType} onChange={(e) => setBlockType(e.target.value)}>
                      {BLOCK_TYPE_OPTIONS.map((option) => (
                        <option key={option.key} value={option.key} disabled={option.disabled}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={`${popup['inputBox']} ${styles['inputBox']} ${popup['row']}`}>
                  <div className={`${popup['label']}`}>{t('封鎖時間')}</div>
                  <div className={`${popup['selectBox']}`}>
                    <select
                      value={selectTime}
                      disabled={isForeverBlock}
                      onChange={(e) => setSelectTime(parseInt(e.target.value))}
                    >
                      {Array.from({ length: 60 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={`${popup['selectBox']}`}>
                    <select
                      value={formatType}
                      disabled={isForeverBlock}
                      onChange={(e) => setFormatType(e.target.value)}
                    >
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
      </div>
      {/* Footer */}
      <div className={popup['popupFooter']}>
        <button
          className={popup['button']}
          onClick={() => {
            handleBlockMember();
            handleClose();
          }}
        >
          {t('confirm')}
        </button>
        <button type="button" className={popup['button']} onClick={() => handleClose()}>
          {t('cancel')}
        </button>
      </div>
    </div>
  );
});

BlockMemberPopup.displayName = 'BlockMemberPopup';

export default BlockMemberPopup;
