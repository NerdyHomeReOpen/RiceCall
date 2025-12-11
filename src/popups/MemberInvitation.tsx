import React, { useEffect, useState } from 'react';

// Types
import type { Server, MemberInvitation } from '@/types';

// CSS
import styles from '@/styles/verification.module.css';
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/ipc';

// Providers
import { useTranslation } from 'react-i18next';

// Utils
import { handleOpenAlertDialog } from '@/utils/popup';
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

  const handleRejectAllMemberInvitation = () => {
    if (memberInvitations.length === 0) return;
    handleOpenAlertDialog(t('confirm-reject-all-member-invitation'), () => {
      ipc.socket.send('rejectMemberInvitation', ...memberInvitations.map((item) => ({ serverId: item.serverId })));
    });
  };

  // Effects
  useEffect(() => {
    const unsub = ipc.socket.on('memberInvitationAdd', (...args: { data: MemberInvitation }[]) => {
      const add = new Set(args.map((i) => `${i.data.serverId}`));
      setMemberInvitations((prev) => prev.filter((mi) => !add.has(`${mi.serverId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('memberInvitationUpdate', (...args: { serverId: string; update: Partial<MemberInvitation> }[]) => {
      const update = new Map(args.map((i) => [`${i.serverId}`, i.update] as const));
      setMemberInvitations((prev) => prev.map((mi) => (update.has(`${mi.serverId}`) ? { ...mi, ...update.get(`${mi.serverId}`) } : mi)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('memberInvitationRemove', (...args: { serverId: string }[]) => {
      const remove = new Set(args.map((i) => i.serverId));
      setMemberInvitations((prev) => prev.filter((mi) => !remove.has(mi.serverId)));
    });
    return () => unsub();
  }, []);

  return (
    <div className={popup['popup-wrapper']} tabIndex={0}>
      <div className={popup['popup-body']} style={{ flexDirection: 'column' }}>
        <div className={styles['header']}>
          <div className={styles['processing-status']}>
            {t('unprocessed')}
            <span className={styles['processing-status-count']}>({memberInvitations.length})</span>
          </div>
          <div className={styles['all-cancel-text']} onClick={handleRejectAllMemberInvitation}>
            {t('reject-all')}
          </div>
        </div>
        <div className={styles['content']}>
          {memberInvitations.map((memberInvitation) => (
            <div key={memberInvitation.serverId} className={styles['application']}>
              <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${memberInvitation.avatarUrl})` }} />
              <div style={{ flex: 1 }}>
                <div className={styles['user-info-box']}>
                  <div className={styles['user-name-text']}>{memberInvitation.name}</div>
                  <div className={styles['time-text']} title={getFormatTimestamp(t, memberInvitation.createdAt)}>
                    {getFormatTimeDiff(t, memberInvitation.createdAt)}
                  </div>
                </div>
                <div className={styles['application-content-box']}>
                  <div className={popup['col']}>
                    <div className={styles['content-text']}>{t('invite-you-to-be-member')}</div>
                    <div className={styles['content-text']}>
                      {t('note')}: {memberInvitation.description}
                    </div>
                  </div>
                  <div className={popup['row']} style={{ alignSelf: 'flex-end' }}>
                    <div className={styles['action-buttons']}>
                      <div className={styles['button']} onClick={() => handleAcceptMemberInvitation(memberInvitation.serverId)}>
                        {t('accept')}
                      </div>
                      <div className={styles['button']} onClick={() => handleRejectMemberInvitation(memberInvitation.serverId)}>
                        {t('reject')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

MemberInvitationPopup.displayName = 'MemberInvitationPopup';

export default MemberInvitationPopup;
