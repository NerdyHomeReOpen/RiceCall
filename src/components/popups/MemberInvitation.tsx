import React, { useEffect, useRef, useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';

// Types
import type { FriendApplication, FriendGroup, User, Server, MemberInvitation } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Services
import ipcService from '@/services/ipc.service';
import getService from '@/services/get.service';

// Utils
import Default from '@/utils/default';

interface MemberInvitationPopupProps {
  userId: User['userId'];
  serverId: Server['serverId'];
}

const MemberInvitationPopup: React.FC<MemberInvitationPopupProps> = React.memo(({ userId, serverId }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const refreshRef = useRef(false);

  // States
  const [section, setSection] = useState<number>(0);
  const [server, setServer] = useState<Server>(Default.server());
  const [user, setUser] = useState<User>(Default.user());
  const [memberInvitation, setMemberInvitation] = useState<MemberInvitation>(Default.memberInvitation());

  // Variables
  const { name: serverName, avatarUrl: serverAvatarUrl, displayId: serverDisplayId, applyNotice: serverApplyNotice } = server;
  const { name: targetName, avatarUrl: targetAvatarUrl } = user;
  const { description: applicationDesc } = memberInvitation;

  // Handlers
  const handleSendMemberInvitation = (userId: User['userId'], serverId: Server['serverId'], preset: Partial<MemberInvitation>) => {
    ipcService.socket.send('sendMemberInvitation', { receiverId: userId, serverId, preset });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  // Effects
  useEffect(() => {
    if (!userId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      getService.user({ userId: userId }).then((target) => {
        if (target) setUser(target);
      });

      getService.memberInvitation({ receiverId: userId, serverId }).then((sentMemberInvitation) => {
        if (sentMemberInvitation) {
          if (sentMemberInvitation.userId === userId) {
            setSection(2);
          } else {
            setSection(1);
          }
          setMemberInvitation(sentMemberInvitation);
        }
      });
    };
    refresh();
  }, [userId]);

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={`${popup['content']} ${popup['col']}`}>
          <div className={popup['label']}>{t('sent-member-invitation-for')}</div>
          <div className={popup['row']}>
            <div className={popup['avatar-wrapper']}>
              <div className={popup['avatar-picture']} style={{ backgroundImage: `url(${targetAvatarUrl})` }} />
            </div>
            <div className={popup['info-wrapper']}>
              <div className={popup['bold-text']}>{targetName}</div>
              <div className={popup['sub-text']}>{targetName}</div>
            </div>
          </div>
          <div className={popup['split']} />
          <div className={`${popup['input-box']} ${popup['col']}`} style={section === 0 ? {} : { display: 'none' }}>
            <div className={popup['label']}>{t('friend-note')}</div>
            <textarea rows={2} value={applicationDesc} onChange={(e) => setMemberInvitation((prev) => ({ ...prev, description: e.target.value }))} />
          </div>
          <div className={popup['hint-text']} style={section === 1 ? {} : { display: 'none' }}>
            {t('friend-apply-sent')}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={popup['button']}
          style={section === 0 ? {} : { display: 'none' }}
          onClick={() => {
            handleSendMemberInvitation(userId, serverId, { description: applicationDesc });
            handleClose();
          }}
        >
          {t('send-request')}
        </div>
        <div className={popup['button']} style={section === 0 ? {} : { display: 'none' }} onClick={handleClose}>
          {t('cancel')}
        </div>
        <div className={popup['button']} style={section === 1 ? {} : { display: 'none' }} onClick={() => setSection(0)}>
          {t('modify')}
        </div>
        <div className={popup['button']} style={section === 1 ? {} : { display: 'none' }} onClick={handleClose}>
          {t('confirm')}
        </div>
        <div
          className={popup['button']}
          style={section === 2 ? {} : { display: 'none' }}
          onClick={() => {
            // handleApproveFriendApplication(targetId);
            handleClose();
          }}
        >
          {t('add')}
        </div>
        <div className={popup['button']} style={section === 2 ? {} : { display: 'none' }} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

MemberInvitationPopup.displayName = 'MemberInvitationPopup';

export default MemberInvitationPopup;
