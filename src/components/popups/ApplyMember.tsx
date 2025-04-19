import React, { useEffect, useRef, useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';
import applyMember from '@/styles/popups/apply.module.css';

// Types
import { PopupType, Server, MemberApplication, User } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';
import { useSocket } from '@/providers/Socket';

// Services
import ipcService from '@/services/ipc.service';

// Utils
import { createDefault } from '@/utils/createDefault';
import refreshService from '@/services/refresh.service';

interface ApplyMemberPopupProps {
  serverId: Server['serverId'];
  userId: User['userId'];
}

const ApplyMemberPopup: React.FC<ApplyMemberPopupProps> = React.memo(
  (initialData: ApplyMemberPopupProps) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();

    // Refs
    const refreshRef = useRef(false);

    // State
    const [section, setSection] = useState<number>(0);
    const [serverName, setServerName] = useState<Server['name']>(
      createDefault.server().name,
    );
    const [serverAvatarUrl, setServerAvatarUrl] = useState<Server['avatarUrl']>(
      createDefault.server().avatarUrl,
    );
    const [serverDisplayId, setServerDisplayId] = useState<Server['displayId']>(
      createDefault.server().displayId,
    );
    const [serverApplyNotice, setServerApplyNotice] = useState<
      Server['applyNotice']
    >(createDefault.server().applyNotice);
    const [applicationDescription, setApplicationDescription] = useState<
      MemberApplication['description']
    >(createDefault.memberApplication().description);

    // Variables
    const { userId, serverId } = initialData;

    const handleCreatMemberApplication = (
      memberApplication: Partial<MemberApplication>,
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.createMemberApplication({
        memberApplication,
        userId,
        serverId,
      });
    };

    const handleServerUpdate = (data: Server | null) => {
      if (!data) data = createDefault.server();
      setServerName(data.name);
      setServerDisplayId(data.displayId);
      setServerAvatarUrl(data.avatarUrl);
      setServerApplyNotice(data.applyNotice);
    };

    const handleMemberApplicationUpdate = (data: MemberApplication | null) => {
      if (data) setSection(1);
      if (!data) return;
      setApplicationDescription(data.description);
    };

    const handleOpenSuccessDialog = (message: string) => {
      ipcService.popup.open(PopupType.DIALOG_SUCCESS);
      ipcService.initialData.onRequest(PopupType.DIALOG_SUCCESS, {
        title: message,
        submitTo: PopupType.DIALOG_SUCCESS,
      });
      ipcService.popup.onSubmit(PopupType.DIALOG_SUCCESS, () => {
        handleClose();
      });
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    // UseEffect

    useEffect(() => {
      if (!serverId || !userId || refreshRef.current) return;
      const refresh = async () => {
        refreshRef.current = true;
        Promise.all([
          refreshService.server({
            serverId: serverId,
          }),
          refreshService.memberApplication({
            userId: userId,
            serverId: serverId,
          }),
        ]).then(([server, memberApplication]) => {
          handleServerUpdate(server);
          handleMemberApplicationUpdate(memberApplication);
        });
      };
      refresh();
    }, [serverId, userId]);

    switch (section) {
      // Member Application Form
      case 0:
        return (
          <div className={popup['popupContainer']}>
            <div className={popup['popupBody']}>
              <div className={setting['body']}>
                <div className={popup['col']}>
                  <div className={popup['row']}>
                    <div className={applyMember['avatarWrapper']}>
                      <div
                        className={applyMember['avatarPicture']}
                        style={{ backgroundImage: `url(${serverAvatarUrl})` }}
                      />
                    </div>
                    <div className={applyMember['infoWrapper']}>
                      <div className={applyMember['mainText']}>
                        {serverName}
                      </div>
                      <div className={applyMember['subText']}>
                        {`ID: ${serverDisplayId}`}
                      </div>
                    </div>
                  </div>
                  <div className={`${popup['inputBox']} ${popup['col']}`}>
                    <div className={popup['label']}>
                      {lang.tr.serverApplyNotice}
                    </div>
                    <div className={popup['hint']}>
                      {serverApplyNotice || lang.tr.none}
                    </div>
                  </div>
                  <div className={applyMember['split']} />
                  <div className={`${popup['inputBox']} ${popup['col']}`}>
                    <div className={popup['label']}>
                      {lang.tr.serverApplyDescription}
                    </div>
                    <textarea
                      rows={2}
                      onChange={(e) =>
                        setApplicationDescription(e.target.value)
                      }
                      value={applicationDescription}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={popup['popupFooter']}>
              <button
                type="submit"
                className={popup['button']}
                onClick={() => {
                  handleCreatMemberApplication(
                    { description: applicationDescription },
                    userId,
                    serverId,
                  );
                  handleOpenSuccessDialog(lang.tr.serverApply);
                }}
              >
                {lang.tr.submit}
              </button>
              <button
                type="button"
                className={popup['button']}
                onClick={() => handleClose()}
              >
                {lang.tr.cancel}
              </button>
            </div>
          </div>
        );

      // Show Notification
      case 1:
        return (
          <div className={popup['popupContainer']}>
            <div className={popup['popupBody']}>
              <div className={setting['body']}>
                <div className={popup['col']}>
                  <div className={popup['row']}>
                    <div className={applyMember['avatarWrapper']}>
                      <div
                        className={applyMember['avatarPicture']}
                        style={{ backgroundImage: `url(${serverAvatarUrl})` }}
                      />
                    </div>
                    <div className={applyMember['infoWrapper']}>
                      <div className={applyMember['mainText']}>
                        {serverName}
                      </div>
                      <div className={applyMember['subText']}>
                        {`ID: ${serverDisplayId}`}
                      </div>
                    </div>
                  </div>
                  <div className={`${popup['inputBox']} ${popup['col']}`}>
                    <div className={popup['label']}>
                      {lang.tr.serverApplyNotice}
                    </div>
                    <div className={popup['hint']}>
                      {serverApplyNotice || lang.tr.none}
                    </div>
                  </div>
                  <div className={applyMember['split']} />
                  <div className={popup['hint']}>{lang.tr.applySuccess}</div>
                </div>
              </div>
            </div>

            <div className={popup['popupFooter']}>
              <button className={popup['button']} onClick={() => setSection(0)}>
                {lang.tr.modify}
              </button>
              <button className={popup['button']} onClick={() => handleClose()}>
                {lang.tr.confirm}
              </button>
            </div>
          </div>
        );
    }
  },
);

ApplyMemberPopup.displayName = 'ApplyMemberPopup';

export default ApplyMemberPopup;
