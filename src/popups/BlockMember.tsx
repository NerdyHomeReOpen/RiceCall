import React, { useState } from 'react';

// Types
import type { Member, Server, User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/ipc';

interface BlockMemberPopupProps {
  serverId: Server['serverId'];
  member: Member;
}

const BlockMemberPopup: React.FC<BlockMemberPopupProps> = React.memo(({ serverId, member }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [blockType, setBlockType] = useState<'block-permanent' | 'block-ip'>('block-permanent');

  // Variables
  const { userId, name: memberName, nickname: memberNickname } = member;
  const blockTypeOptions = [
    { key: 'block-permanent', label: t('block-permanent'), disabled: false },
    { key: 'block-ip', label: t('block-ip'), disabled: true },
  ];

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
                  <select value={blockType} onChange={(e) => setBlockType(e.target.value as 'block-permanent' | 'block-ip')}>
                    {blockTypeOptions.map((option) => (
                      <option key={option.key} value={option.key} disabled={option.disabled}>
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
        <div className={popup['button']} onClick={() => handleBlockUserFromServer(userId, serverId, -1)}>
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
