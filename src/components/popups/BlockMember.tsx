import React, { useState, useEffect } from 'react';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';

// Types
import { Server, User } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';
import { useSocket } from '@/providers/Socket';

// CSS
import popup from '@/styles/popup.module.css';
import styles from '@/styles/popups/blockMember.module.css';

// Services
import ipcService from '@/services/ipc.service';

interface BlockMemberPopupProps {
  userId: User['userId'];
  serverId: Server['serverId'];
  userName: User['name'];
}

const BlockMemberPopup: React.FC<BlockMemberPopupProps> = React.memo(
  ({ userId, serverId, userName }) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();

    // States
    const [blockType, setBlockType] = useState<string>('timeout');
    const [formatType, setFormatType] = useState<string>('hours');
    const [selectTime, setSelectTime] = useState<number>(1);
    const [blockTime, setBlockTime] = useState<number>(0);

    // Variables
    const BLOCK_TYPE_OPTIONS = [
      // TODO: lang.tr
      { key: 'timeout', label: '暫時封鎖', disabled: false },
      { key: 'block', label: '永久封鎖', disabled: false },
      { key: 'blockIP', label: '永久封鎖IP', disabled: true },
    ];

    const FORMAT_TYPE_OPTIONS = [
      // TODO: lang.tr
      { key: 'seconds', label: '秒' },
      { key: 'minutes', label: '分鐘' },
      { key: 'hours', label: '小時' },
      { key: 'days', label: '天' },
      { key: 'month', label: '月' },
      { key: 'years', label: '年' },
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
                  <MarkdownViewer 
                    markdownText={lang.getTranslatedMessage(
                      '確定要封鎖 <span>{userName}</span> 嗎?',
                      { userName: userName }
                    )}
                  />
                </div>
                <div className={`${popup['inputGroup']} ${popup['col']}`}>
                  <div
                    className={`${popup['inputBox']} ${styles['inputBox']} ${popup['row']}`}
                  >
                    <div className={`${popup['label']}`}>
                      {'封鎖類型' /* TODO: lang.tr */}
                    </div>
                    <div className={`${popup['selectBox']}`}>
                      <select
                        value={blockType}
                        onChange={(e) => setBlockType(e.target.value)}
                      >
                        {BLOCK_TYPE_OPTIONS.map((option) => (
                          <option
                            key={option.key}
                            value={option.key}
                            disabled={option.disabled}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div
                    className={`${popup['inputBox']} ${styles['inputBox']} ${popup['row']}`}
                  >
                    <div className={`${popup['label']}`}>
                      {'封鎖時間' /* TODO: lang.tr */}
                    </div>
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
            {lang.tr.confirm}
          </button>
          <button
            type="button"
            className={popup['button']}
            onClick={() => handleClose()}
          >
            {lang.tr.cancel}
          </button>
        </div>
      </div>
    );
  },
);

BlockMemberPopup.displayName = 'BlockMemberPopup';

export default BlockMemberPopup;
