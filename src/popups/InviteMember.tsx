import React, { useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';

// Types
import type { Server, MemberInvitation, Member } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Services
import ipcService from '@/services/ipc.service';

interface InviteMemberPopupProps {
  serverId: Server['serverId'];
  target: Member;
  memberInvitation: MemberInvitation | null;
}

const InviteMemberPopup: React.FC<InviteMemberPopupProps> = React.memo(({ serverId, target, memberInvitation }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [section, setSection] = useState<number>(memberInvitation ? 1 : 0); // 0: send, 1: sent, 2: edit
  const [invitationDesc, setInvitationDesc] = useState<string>(memberInvitation?.description || '');

  // Destructuring
  const { userId: targetId, name: targetName, avatarUrl: targetAvatarUrl, displayId: targetDisplayId, contribution: targetContribution } = target;

  // Handlers
  const handleSendMemberInvitation = (receiverId: Member['userId'], serverId: Server['serverId'], preset: Partial<MemberInvitation>) => {
    ipcService.socket.send('sendMemberInvitation', { receiverId, serverId, preset });
  };

  const handleEditMemberInvitation = (receiverId: Member['userId'], serverId: Server['serverId'], update: Partial<MemberInvitation>) => {
    ipcService.socket.send('editMemberInvitation', { receiverId, serverId, update });
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
              <div className={popup['link-text']}>
                {targetName} ({targetDisplayId})
              </div>
              <div className={popup['sub-text']}>
                {t('contribution')}: {targetContribution}
              </div>
            </div>
          </div>
          <div className={popup['split']} />
          <div className={`${popup['input-box']} ${popup['col']}`} style={section === 0 ? {} : { display: 'none' }}>
            <div className={popup['label']}>{t('note')}</div>
            <textarea rows={2} value={invitationDesc} onChange={(e) => setInvitationDesc(e.target.value)} />
          </div>
          <div className={popup['hint-text']} style={section === 1 ? {} : { display: 'none' }}>
            {t('member-invitation-sent')}
          </div>
          <div className={`${popup['input-box']} ${popup['col']}`} style={section === 2 ? {} : { display: 'none' }}>
            <div className={popup['label']}>{t('note')}</div>
            <textarea rows={2} value={invitationDesc} onChange={(e) => setInvitationDesc(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']} style={section === 0 ? {} : { display: 'none' }}>
        <div
          className={popup['button']}
          onClick={() => {
            handleSendMemberInvitation(targetId, serverId, { description: invitationDesc });
            handleClose();
          }}
        >
          {t('submit')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
      <div className={popup['popup-footer']} style={section === 1 ? {} : { display: 'none' }}>
        <div className={popup['button']} onClick={() => setSection(2)}>
          {t('modify')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
      <div className={popup['popup-footer']} style={section === 2 ? {} : { display: 'none' }}>
        <div
          className={popup['button']}
          onClick={() => {
            handleEditMemberInvitation(targetId, serverId, { description: invitationDesc });
            handleClose();
          }}
        >
          {t('submit')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

InviteMemberPopup.displayName = 'InviteMemberPopup';

export default InviteMemberPopup;
