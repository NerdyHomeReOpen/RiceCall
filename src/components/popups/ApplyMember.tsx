import React, { useEffect, useRef, useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';
import applyMember from '@/styles/popups/apply.module.css';

// Types
import { Server, MemberApplication, User } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';
import { useSocket } from '@/providers/Socket';

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
  const lang = useLanguage();
  const socket = useSocket();

  // Refs
  const refreshRef = useRef(false);

  // State
  const [section, setSection] = useState<number>(0);
  const [server, setServer] = useState<Server>(Default.server());
  const [memberApplication, setMemberApplication] = useState<MemberApplication>(Default.memberApplication());

  // Variables
  const {
    name: serverName,
    avatarUrl: serverAvatarUrl,
    displayId: serverDisplayId,
    applyNotice: serverApplyNotice,
  } = server;
  const { description: applicationDes } = memberApplication;

  // Handlers
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

  const handleClose = () => {
    ipcService.window.close();
  };

  // UseEffect
  useEffect(() => {
    if (!serverId || !userId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      Promise.all([
        getService.server({
          serverId: serverId,
        }),
        getService.memberApplication({
          userId: userId,
          serverId: serverId,
        }),
      ]).then(([server, memberApplication]) => {
        if (server) {
          setServer(server);
        }
        if (memberApplication) {
          setSection(1);
          setMemberApplication(memberApplication);
        }
      });
    };
    refresh();
  }, [serverId, userId]);

  return (
    <>
      {/* Member Application Form */}
      <div className={popup['popupContainer']} style={section === 0 ? {} : { display: 'none' }}>
        {/* Body */}
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
                  <div className={applyMember['mainText']}>{serverName}</div>
                  <div className={applyMember['subText']}>{`ID: ${serverDisplayId}`}</div>
                </div>
              </div>
              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div>{lang.tr.serverApplyNotice}</div>
                <div className={popup['hint']}>{serverApplyNotice || lang.tr.none}</div>
              </div>
              <div className={applyMember['split']} />
              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div>{lang.tr.serverApplyDescription}</div>
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
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={popup['popupFooter']}>
          <button
            type="submit"
            className={popup['button']}
            onClick={() => {
              handleCreatMemberApplication({ description: applicationDes }, userId, serverId);
              handleClose();
            }}
          >
            {lang.tr.submit}
          </button>
          <button type="button" className={popup['button']} onClick={() => handleClose()}>
            {lang.tr.cancel}
          </button>
        </div>
      </div>

      {/* Show Notification */}
      <div className={popup['popupContainer']} style={section === 1 ? {} : { display: 'none' }}>
        {/* Body */}
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
                  <div className={applyMember['mainText']}>{serverName}</div>
                  <div className={applyMember['subText']}>{`ID: ${serverDisplayId}`}</div>
                </div>
              </div>
              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div>{lang.tr.serverApplyNotice}</div>
                <div className={popup['hint']}>{serverApplyNotice || lang.tr.none}</div>
              </div>
              <div className={applyMember['split']} />
              <p className={popup['hint']}>{lang.tr.applySuccess}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={popup['popupFooter']}>
          <button className={popup['button']} onClick={() => setSection(0)}>
            {lang.tr.modify}
          </button>
          <button className={popup['button']} onClick={() => handleClose()}>
            {lang.tr.confirm}
          </button>
        </div>
      </div>
    </>
  );
});

ApplyMemberPopup.displayName = 'ApplyMemberPopup';

export default ApplyMemberPopup;
