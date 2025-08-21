import React, { useEffect, useState } from 'react';

// Types
import type { Server, MemberInvitation } from '@/types';

// CSS
import styles from '@/styles/popups/friendVerification.module.css';
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/services/ipc.service';

// Providers
import { useTranslation } from 'react-i18next';

// Utils
import { getFormatTimestamp, getFormatTimeDiff } from '@/utils/language';

interface MemberInvitationPopupProps {
  memberInvitations: MemberInvitation[];
}

const MemberInvitationPopup: React.FC<MemberInvitationPopupProps> = React.memo(({ memberInvitations: memberInvitationsData }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [memberInvitations, setMemberInvitations] = useState<MemberInvitation[]>(memberInvitationsData);

  // Handlers
  const handleAcceptMemberInvitation = (serverId: Server['serverId']) => {
    ipc.socket.send('acceptMemberInvitation', { serverId });
  };

  const handleRejectMemberInvitation = (serverId: Server['serverId']) => {
    ipc.socket.send('rejectMemberInvitation', { serverId });
  };

  const handleRejectAllFriendApplication = () => {
    if (memberInvitations.length === 0) return;
    handleOpenAlertDialog(t('confirm-reject-all-member-invitation'), () => {
      ipc.socket.send('rejectMemberInvitation', ...memberInvitations.map((item) => ({ serverId: item.serverId })));
    });
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipc.popup.open('dialogAlert', 'dialogAlert', { message, submitTo: 'dialogAlert' });
    ipc.popup.onSubmit('dialogAlert', callback);
  };

  const handleMemberInvitationAdd = (...args: { data: MemberInvitation }[]) => {
    setMemberInvitations((prev) => [...prev, ...args.map((i) => i.data)]);
  };

  const handleMemberInvitationUpdate = (...args: { serverId: string; update: Partial<MemberInvitation> }[]) => {
    const update = new Map(args.map((i) => [`${i.serverId}`, i.update] as const));
    setMemberInvitations((prev) => prev.map((mi) => (update.has(`${mi.serverId}`) ? { ...mi, ...update.get(`${mi.serverId}`) } : mi)));
  };

  const handleMemberInvitationRemove = (...args: { serverId: string }[]) => {
    const remove = new Set(args.map((i) => i.serverId));
    setMemberInvitations((prev) => prev.filter((mi) => !remove.has(mi.serverId)));
  };

  // Effects
  useEffect(() => {
    const unsubscribe = [
      ipc.socket.on('memberInvitationAdd', handleMemberInvitationAdd),
      ipc.socket.on('memberInvitationUpdate', handleMemberInvitationUpdate),
      ipc.socket.on('memberInvitationRemove', handleMemberInvitationRemove),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, []);

  return (
    <div className={popup['popup-wrapper']} tabIndex={0}>
      <div className={popup['popup-body']} style={{ flexDirection: 'column' }}>
        {/* Content Header */}
        <div className={styles['header']}>
          <div className={styles['processing-status']}>
            {t('unprocessed')}
            <span className={styles['processing-status-count']}>({memberInvitations.length})</span>
          </div>
          <div className={styles['all-cancel-text']} onClick={handleRejectAllFriendApplication}>
            {t('reject-all')}
          </div>
        </div>

        {/* Content Body */}
        <div className={styles['content']}>
          {memberInvitations.map((memberInvitation) => {
            const {
              serverId: memberInvitationServerId,
              avatarUrl: memberInvitationAvatarUrl,
              displayId: memberInvitationDisplayId,
              createdAt: memberInvitationCreatedAt,
              description: memberInvitationDescription,
            } = memberInvitation;
            return (
              <div key={memberInvitationServerId} className={styles['application']}>
                <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${memberInvitationAvatarUrl})` }} />
                <div style={{ flex: 1 }}>
                  <div className={styles['user-info-box']}>
                    <div className={styles['user-name-text']}>{memberInvitationDisplayId}</div>
                    <div className={styles['time-text']} title={getFormatTimestamp(t, memberInvitationCreatedAt)}>
                      {getFormatTimeDiff(t, memberInvitationCreatedAt)}
                    </div>
                  </div>
                  <div className={styles['application-content-box']}>
                    <div className={popup['col']}>
                      <div className={styles['content-text']}>{t('invite-you-to-be-member')}</div>
                      <div className={styles['content-text']}>
                        {t('note')}: {memberInvitationDescription}
                      </div>
                    </div>
                    <div className={popup['row']} style={{ alignSelf: 'flex-end' }}>
                      <div className={styles['action-buttons']}>
                        <div className={styles['button']} onClick={() => handleAcceptMemberInvitation(memberInvitationServerId)}>
                          {t('accept')}
                        </div>
                        <div className={styles['button']} onClick={() => handleRejectMemberInvitation(memberInvitationServerId)}>
                          {t('reject')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

MemberInvitationPopup.displayName = 'MemberInvitationPopup';

export default MemberInvitationPopup;
