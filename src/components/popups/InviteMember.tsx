import React, { useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';

// Types
import type { User, Server, MemberInvitation } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Services
import ipcService from '@/services/ipc.service';

// Utils
import Default from '@/utils/default';

interface InviteMemberPopupProps {
  serverId: Server['serverId'];
  target: User;
  memberInvitation: MemberInvitation | null;
}

const InviteMemberPopup: React.FC<InviteMemberPopupProps> = React.memo(({ serverId, target, memberInvitation: memberInvitationData }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [memberInvitation, setMemberInvitation] = useState<MemberInvitation>(memberInvitationData || Default.memberInvitation());
  const [section, setSection] = useState<number>(memberInvitationData ? 1 : 0);

  // Destructuring
  const { userId: targetId, name: targetName, avatarUrl: targetAvatarUrl, displayId: targetDisplayId } = target;
  const { description: applicationDesc } = memberInvitation;

  // Handlers
  const handleSendMemberInvitation = (receiverId: User['userId'], serverId: Server['serverId'], preset: Partial<MemberInvitation>) => {
    ipcService.socket.send('sendMemberInvitation', { receiverId, serverId, preset });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={`${popup['content']} ${popup['col']}`}>
          <div className={popup['label']}>{t('invite-member-label')}</div>
          <div className={popup['row']}>
            <div className={popup['avatar-wrapper']}>
              <div className={popup['avatar-picture']} style={{ backgroundImage: `url(${targetAvatarUrl})` }} />
            </div>
            <div className={popup['info-wrapper']}>
              <div className={popup['bold-text']}>{targetName}</div>
              <div className={popup['sub-text']}>{targetDisplayId}</div>
            </div>
          </div>
          <div className={popup['split']} />
          <div className={`${popup['input-box']} ${popup['col']}`} style={section === 0 ? {} : { display: 'none' }}>
            <div className={popup['label']}>{t('note')}</div>
            <textarea rows={2} value={applicationDesc} onChange={(e) => setMemberInvitation((prev) => ({ ...prev, description: e.target.value }))} />
          </div>
          <div className={popup['hint-text']} style={section === 1 ? {} : { display: 'none' }}>
            {t('member-invitation-sent')}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={popup['button']}
          style={section === 0 ? {} : { display: 'none' }}
          onClick={() => {
            handleSendMemberInvitation(targetId, serverId, { description: applicationDesc });
            handleClose();
          }}
        >
          {t('submit')}
        </div>
        <div className={popup['button']} style={section === 0 ? {} : { display: 'none' }} onClick={handleClose}>
          {t('cancel')}
        </div>
        <div className={popup['button']} style={section === 1 ? {} : { display: 'none' }} onClick={() => setSection(0)}>
          {t('modify')}
        </div>
        <div className={popup['button']} style={section === 1 ? {} : { display: 'none' }} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

InviteMemberPopup.displayName = 'InviteMemberPopup';

export default InviteMemberPopup;
