import React, { useEffect, useRef, useState } from 'react';

// Types
import type { User, Server, MemberInvitation } from '@/types';

// CSS
import styles from '@/styles/popups/friendVerification.module.css';
import popup from '@/styles/popup.module.css';

// Services
import ipcService from '@/services/ipc.service';
import getService from '@/services/get.service';

// Providers
import { useTranslation } from 'react-i18next';

// Utils
import { getFormatTimestamp, getFormatTimeDiff } from '@/utils/language';

interface MemberVerificationPopupProps {
  userId: User['userId'];
}

const MemberVerificationPopup: React.FC<MemberVerificationPopupProps> = React.memo(({ userId }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const refreshRef = useRef(false);

  // State
  const [memberInvitations, setMemberInvitations] = useState<MemberInvitation[]>([]);

  // Handlers
  const handleRejectAllFriendApplication = () => {
    if (memberInvitations.length === 0) return;
    // handleOpenAlertDialog(t('confirm-reject-all-friend-application'), () => {
    //   ipcService.socket.send('rejectFriendApplication', ...memberInvitations.map((item) => ({ senderId: item.senderId })));
    // });
  };

  const handleAcceptMemberInvitation = (serverId: Server['serverId']) => {
    ipcService.socket.send('acceptMemberInvitation', { serverId });
  };

  const handleRejectMemberInvitation = (serverId: Server['serverId']) => {
    ipcService.socket.send('rejectMemberInvitation', { serverId });
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipcService.popup.open('dialogAlert', 'dialogAlert', { message, submitTo: 'dialogAlert' });
    ipcService.popup.onSubmit('dialogAlert', callback);
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
      ipcService.socket.on('memberInvitationAdd', handleMemberInvitationAdd),
      ipcService.socket.on('memberInvitationUpdate', handleMemberInvitationUpdate),
      ipcService.socket.on('memberInvitationRemove', handleMemberInvitationRemove),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, []);

  useEffect(() => {
    if (!userId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      getService.memberInvitations({ receiverId: userId }).then((memberInvitations) => {
        if (memberInvitations) setMemberInvitations(memberInvitations);
      });
    };
    refresh();
  }, [userId]);

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
          {memberInvitations.map((mi) => {
            return (
              <div key={mi.serverId} className={styles['application']}>
                <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${mi.avatarUrl})` }} />
                <div style={{ flex: 1 }}>
                  <div className={styles['user-info-box']}>
                    <div className={styles['user-name-text']}>
                      {mi.name} ({/* TODO: displayId */})
                    </div>
                    <div className={styles['time-text']} title={getFormatTimestamp(t, mi.createdAt)}>
                      {getFormatTimeDiff(t, mi.createdAt)}
                    </div>
                  </div>
                  <div className={styles['application-content-box']}>
                    <div className={popup['col']}>
                      <div className={styles['content-text']}>{t('request-to-add-you-as-a-member')}</div>
                      <div className={styles['content-text']}>
                        {t('description')}: {mi.description}
                      </div>
                    </div>
                    <div className={popup['row']} style={{ alignSelf: 'flex-end' }}>
                      <div className={styles['action-buttons']}>
                        <div className={styles['button']} onClick={() => handleAcceptMemberInvitation(mi.serverId)}>
                          {t('accept')}
                        </div>
                        <div className={styles['button']} onClick={() => handleRejectMemberInvitation(mi.serverId)}>
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

MemberVerificationPopup.displayName = 'MemberVerificationPopup';

export default MemberVerificationPopup;
