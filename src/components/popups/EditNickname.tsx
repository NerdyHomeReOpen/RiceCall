import React, { useEffect, useRef, useState } from 'react';

// Types
import { Member, User, Server } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';

// Services
import getService from '@/services/get.service';
import ipcService from '@/services/ipc.service';

// Utils
import Default from '@/utils/default';

interface EditNicknamePopupProps {
  userId: User['userId'];
  serverId: Server['serverId'];
}

const EditNicknamePopup: React.FC<EditNicknamePopupProps> = React.memo(({ userId, serverId }) => {
  // Hooks
  const socket = useSocket();
  const { t } = useTranslation();

  // Refs
  const refreshRef = useRef(false);

  // States
  const [member, setMember] = useState<Member>(Default.member());
  const [user, setUser] = useState<User>(Default.user());

  // Variables
  const { nickname: memberNickname } = member;
  const { name: userName } = user;

  // Handlers
  const handleEditMember = (member: Partial<Member>, userId: User['userId'], serverId: Server['serverId']) => {
    if (!socket) return;
    socket.send.editMember({ member, userId, serverId });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  // Effects
  useEffect(() => {
    if (!userId || !serverId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      Promise.all([
        getService.user({
          userId: userId,
        }),
        getService.member({
          userId: userId,
          serverId: serverId,
        }),
      ]).then(([user, member]) => {
        if (user) {
          setUser(user);
        }
        if (member) {
          setMember(member);
        }
      });
    };
    refresh();
  }, [userId, serverId]);

  return (
    <form className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={popup['dialog-content']}>
          <div className={popup['input-group']}>
            <div className={popup['input-box']}>
              <div className={popup['label']} style={{ minWidth: '2rem' }}>
                {t('nickname')}:
              </div>
              <div className={popup['label']}>{userName}</div>
            </div>
            <div className={`${popup['input-box']} ${popup['col']}`}>
              <div className={popup['label']}>{t('please-enter-the-member-nickname')}</div>
              <input
                name="nickname"
                type="text"
                value={memberNickname || ''}
                maxLength={32}
                onChange={(e) => setMember((prev) => ({ ...prev, nickname: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={popup['button']}
          onClick={() => {
            handleEditMember({ nickname: memberNickname }, userId, serverId);
            handleClose();
          }}
        >
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={() => handleClose()}>
          {t('cancel')}
        </div>
        <div
          className={popup['button']}
          onClick={() => handleEditMember({ nickname: memberNickname }, userId, serverId)}
        >
          {t('set')}
        </div>
      </div>
    </form>
  );
});

EditNicknamePopup.displayName = 'EditNicknamePopup';

export default EditNicknamePopup;
