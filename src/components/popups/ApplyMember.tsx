import React, { useEffect, useRef, useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';

// Types
import { Server, MemberApplication, User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Services
import ipcService from '@/services/ipc.service';

// Utils
import Default from '@/utils/default';
import getService from '@/services/get.service';

interface ApplyMemberPopupProps {
  serverId: Server['serverId'];
  userId: User['userId'];
}

const ApplyMemberPopup: React.FC<ApplyMemberPopupProps> = React.memo(({ userId, serverId }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const refreshRef = useRef(false);

  // State
  const [section, setSection] = useState<number>(0);
  const [server, setServer] = useState<Server>(Default.server());
  const [memberApplication, setMemberApplication] = useState<MemberApplication>(Default.memberApplication());

  // Variables
  const { name: serverName, avatarUrl: serverAvatarUrl, displayId: serverDisplayId, applyNotice: serverApplyNotice } = server;
  const { description: applicationDes } = memberApplication;

  // Handlers
  const handleCreatMemberApplication = (serverId: Server['serverId'], preset: Partial<MemberApplication>) => {
    ipcService.socket.send('sendMemberApplication', { serverId, preset });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  // UseEffect
  useEffect(() => {
    if (!serverId || !userId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      getService.server({ serverId: serverId }).then((server) => {
        if (server) setServer(server);
      });
      getService.memberApplication({ userId: userId, serverId: serverId }).then((memberApplication) => {
        if (memberApplication) {
          setSection(1);
          setMemberApplication(memberApplication);
        }
      });
    };
    refresh();
  }, [serverId, userId]);

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={`${popup['content']} ${popup['col']}`}>
          <div className={popup['row']}>
            <div className={popup['avatar-wrapper']}>
              <div className={popup['avatar-picture']} style={{ backgroundImage: `url(${serverAvatarUrl})` }} />
            </div>
            <div className={popup['info-wrapper']}>
              <div className={popup['bold-text']}>{serverName}</div>
              <div className={popup['sub-text']}>{`ID: ${serverDisplayId}`}</div>
            </div>
          </div>
          <div className={`${popup['input-box']} ${popup['col']}`}>
            <div className={popup['label']}>{t('member-apply-note')}</div>
            <div className={popup['hint-text']}>{serverApplyNotice || t('none')}</div>
          </div>
          <div className={popup['split']} />
          <div className={`${popup['input-box']} ${popup['col']}`} style={section === 0 ? {} : { display: 'none' }}>
            <div className={popup['label']}>{t('member-apply-description')}</div>
            <textarea
              rows={2}
              value={applicationDes}
              onChange={(e) =>
                setMemberApplication((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>
          <div className={popup['hint-text']} style={section === 1 ? {} : { display: 'none' }}>
            {t('member-apply-sent')}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={popup['button']}
          style={section === 0 ? {} : { display: 'none' }}
          onClick={() => {
            handleCreatMemberApplication(serverId, { description: applicationDes });
            handleClose();
          }}
        >
          {t('submit')}
        </div>
        <div className={popup['button']} style={section === 0 ? {} : { display: 'none' }} onClick={() => handleClose()}>
          {t('cancel')}
        </div>
        <div className={popup['button']} style={section === 1 ? {} : { display: 'none' }} onClick={() => setSection(0)}>
          {t('modify')}
        </div>
        <div className={popup['button']} style={section === 1 ? {} : { display: 'none' }} onClick={() => handleClose()}>
          {t('confirm')}
        </div>
      </div>
    </div>
  );
});

ApplyMemberPopup.displayName = 'ApplyMemberPopup';

export default ApplyMemberPopup;
