import React, { useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';

// Types
import type { Server, MemberApplication } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Services
import ipc from '@/services/ipc.service';

// Utils
import Default from '@/utils/default';

interface ApplyMemberPopupProps {
  server: Server;
  memberApplication: MemberApplication | null;
}

const ApplyMemberPopup: React.FC<ApplyMemberPopupProps> = React.memo(({ server, memberApplication: memberApplicationData }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [section, setSection] = useState<number>(memberApplicationData ? 1 : 0);
  const [memberApplication, setMemberApplication] = useState<MemberApplication>(memberApplicationData || Default.memberApplication());

  // Variables
  const { serverId, name: serverName, avatarUrl: serverAvatarUrl, displayId: serverDisplayId, applyNotice: serverApplyNotice } = server;
  const { description: applicationDes } = memberApplication;

  // Handlers
  const handleSendMemberApplication = (serverId: Server['serverId'], preset: Partial<MemberApplication>) => {
    ipc.socket.send('sendMemberApplication', { serverId, preset });
  };

  const handleClose = () => {
    ipc.window.close();
  };

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
            <div className={popup['label']}>{t('apply-member-note')}</div>
            <div className={popup['hint-text']}>{serverApplyNotice || t('none')}</div>
          </div>
          <div className={popup['split']} />
          <div className={`${popup['input-box']} ${popup['col']}`} style={section === 0 ? {} : { display: 'none' }}>
            <div className={popup['label']}>{t('note')}</div>
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
            {t('member-application-sent')}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={popup['button']}
          style={section === 0 ? {} : { display: 'none' }}
          onClick={() => {
            handleSendMemberApplication(serverId, { description: applicationDes });
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
          {t('confirm')}
        </div>
      </div>
    </div>
  );
});

ApplyMemberPopup.displayName = 'ApplyMemberPopup';

export default ApplyMemberPopup;
