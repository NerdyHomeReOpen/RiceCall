/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';

// CSS
import Popup from '@/styles/common/popup.module.css';
import applyMember from '@/styles/popups/serverApplication.module.css';

// Types
import { popupType, type Server, type ServerApplication } from '@/types';

// Providers
import { useLanguage } from '@/providers/LanguageProvider';
import { useSocket } from '@/providers/SocketProvider';

// Services
import { ipcService } from '@/services/ipc.service';

interface ServerApplicationModalProps {
  server: Server | null;
}

const ServerApplicationModal: React.FC<ServerApplicationModalProps> =
  React.memo((initialData: ServerApplicationModalProps) => {
    // Language
    const lang = useLanguage();

    // Socket
    const socket = useSocket();

    // Variables
    const serverName = initialData.server?.name || '';
    const serverDisplayId = initialData.server?.displayId || '';
    const serverAvatar = initialData.server?.avatar || null;

    // State
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isApplying, setIsApplying] = useState(false);

    // Section Control
    const [section, setSection] = useState<number>(0);

    const handleCreatMemberApplication = (application: ServerApplication) => {};

    const handleOpenSuccessDialog = () => {
      ipcService.popup.open(popupType.DIALOG_SUCCESS);
      ipcService.initialData.onRequest(popupType.DIALOG_SUCCESS, {
        title: lang.tr.serverApply,
        submitTo: popupType.DIALOG_SUCCESS,
      });
      ipcService.popup.onSubmit(popupType.DIALOG_SUCCESS, () => {
        setSection(1);
      });
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    switch (section) {
      // Member Application Form
      case 0:
        return (
          <div className={Popup['popupContainer']}>
            <div className={`${Popup['popupBody']}`}>
              <div className={applyMember['body']}>
                <div className={applyMember['headerBox']}>
                  <div className={applyMember['avatarWrapper']}>
                    <div
                      className={applyMember['avatarPicture']}
                      style={
                        serverAvatar
                          ? { backgroundImage: `url(${serverAvatar})` }
                          : {}
                      }
                    />
                  </div>
                  <div className={applyMember['serverInfoWrapper']}>
                    <div className={applyMember['serverName']}>
                      {serverName}
                    </div>
                    <div className={applyMember['serverId']}>
                      {`ID: ${serverDisplayId}`}
                    </div>
                  </div>
                </div>
                <div className={Popup['label']}>
                  {lang.tr.serverApplyNotice}
                </div>
                <div className={applyMember['noteText']}>
                  {'{server.settings.applicationNote}'}
                </div>
                <div className={applyMember['split']} />
                <div className={applyMember['contentBox']}>
                  <div className={Popup['label']}>
                    {lang.tr.serverApplyDescription}
                  </div>
                  <div className={Popup['inputBox']}>
                    <textarea
                      rows={2}
                      onChange={(e) => setDescription(e.target.value)}
                      value={description}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className={Popup['popupFooter']}>
              <button
                type="submit"
                className={`${Popup['button']} ${
                  !description.trim() ? Popup['disabled'] : ''
                }`}
                disabled={!description.trim()}
                onClick={() => {
                  // handleCreatMemberApplication({
                  //   serverId: server?.id,
                  //   description,
                  // });
                  handleOpenSuccessDialog();
                }}
              >
                {lang.tr.submit}
              </button>
              <button
                type="button"
                className={Popup['button']}
                onClick={() => {
                  handleClose();
                }}
              >
                {lang.tr.cancel}
              </button>
            </div>
          </div>
        );

      // Show Notification
      case 1:
        return (
          <div className={Popup['popupContainer']}>
            <div className={Popup['popupBody']}>
              <div className={applyMember['body']}>
                <div className={applyMember['headerBox']}>
                  <div className={applyMember['avatarWrapper']}>
                    <div className={applyMember['avatarPicture']} />
                  </div>
                  <div className={applyMember['serverInfoWrapper']}>
                    <div className={applyMember['serverName']}>
                      {serverName}
                    </div>
                    <div className={applyMember['serverId']}>
                      {`ID: ${serverDisplayId}`}
                    </div>
                  </div>
                </div>
                <div className={Popup['label']}>{'申請須知'}</div>
                <div className={applyMember['noteText']}>
                  {'{server.settings.applicationNote}'}
                </div>
                <div className={applyMember['split']} />
                <div className={applyMember['contentBox']}>
                  <div className={applyMember['notificationText']}>
                    {'申請已送出，請等待管理員審核'}
                  </div>
                </div>
              </div>
            </div>
            <div className={Popup['popupFooter']}>
              <button
                className={Popup['button']}
                onClick={() => {
                  setSection(0);
                }}
              >
                {'修改'}
              </button>
              <button
                className={Popup['button']}
                onClick={() => {
                  handleClose();
                }}
              >
                {'確認'}
              </button>
            </div>
          </div>
        );
    }
  });

ServerApplicationModal.displayName = 'ServerApplicationModal';

export default ServerApplicationModal;
