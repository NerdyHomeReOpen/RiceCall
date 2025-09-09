import React, { useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';

// Types
import type { Server, MemberApplication } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Services
import ipc from '@/services/ipc.service';

interface ApplyMemberPopupProps {
  server: Server;
  memberApplication: MemberApplication | null;
}

const ApplyMemberPopup: React.FC<ApplyMemberPopupProps> = React.memo(({ server, memberApplication }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [section, setSection] = useState<number>(memberApplication ? 1 : 0); // 0: send, 1: sent, 2: edit
  const [applicationDesc, setApplicationDesc] = useState<MemberApplication['description']>(memberApplication?.description || '');

  // Variables
  const { serverId, name: serverName, avatarUrl: serverAvatarUrl, displayId: serverDisplayId, applyNotice: serverApplyNotice } = server;

  // Handlers
  const handleSendMemberApplication = (serverId: Server['serverId'], preset: Partial<MemberApplication>) => {
    ipc.socket.send('sendMemberApplication', { serverId, preset });
  };

  const handleEditMemberApplication = (serverId: Server['serverId'], update: Partial<MemberApplication>) => {
    ipc.socket.send('editMemberApplication', { serverId, update });
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
              <div className={popup['link-text']}>{serverName}</div>
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
            <textarea rows={2} defaultValue={applicationDesc} onChange={(e) => setApplicationDesc(e.target.value)} />
          </div>
          <div className={popup['hint-text']} style={section === 1 ? {} : { display: 'none' }}>
            {t('member-application-sent')}
          </div>
          <div className={`${popup['input-box']} ${popup['col']}`} style={section === 2 ? {} : { display: 'none' }}>
            <div className={popup['label']}>{t('note')}</div>
            <textarea rows={2} defaultValue={applicationDesc} onChange={(e) => setApplicationDesc(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']} style={section === 0 ? {} : { display: 'none' }}>
        <div
          className={popup['button']}
          onClick={() => {
            handleSendMemberApplication(serverId, { description: applicationDesc });
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
          {t('confirm')}
        </div>
      </div>
      <div className={popup['popup-footer']} style={section === 2 ? {} : { display: 'none' }}>
        <div
          className={popup['button']}
          onClick={() => {
            handleEditMemberApplication(serverId, { description: applicationDesc });
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

ApplyMemberPopup.displayName = 'ApplyMemberPopup';

export default ApplyMemberPopup;
