import React, { useEffect, useRef } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';
import friendVerification from '@/styles/popups/friendVerification.module.css';

// Services
import ipcService from '@/services/ipc.service';

// Providers
import { useLanguage } from '@/providers/Language';

interface FriendVerificationPopupProps {
  submitTo: string;
}

const FriendVerificationPopup: React.FC<FriendVerificationPopupProps> =
  React.memo(({ submitTo }) => {
    // Hooks
    const lang = useLanguage();

    // Refs
    const containerRef = useRef<HTMLFormElement>(null);

    // Handlers
    const handleSubmit = () => {
      ipcService.popup.submit(submitTo);
      handleClose();
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    // Effects
    useEffect(() => {
      containerRef.current?.focus();
    }, []);

    return (
      <form
        className={popup['popupContainer']}
        tabIndex={0}
        ref={containerRef}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
        }}
      >
        <div className={popup['popupBody']}>
          <div className={`${setting['body']} ${friendVerification['body']}`}>
            <div className={friendVerification['contentHeader']}>
              <div className={friendVerification['ProcessingStatus']}>
                未處理
                <span className={friendVerification['ProcessingStatusCount']}>
                  (1)
                </span>
              </div>
              <div className={friendVerification['allCancel']}>
                全部拒絕/忽略
              </div>
            </div>
            <div className={friendVerification['contentBody']}>
              <div className={friendVerification['userInfoBox']}>
                <div className={friendVerification['avatarBox']}></div>
                <div className={friendVerification['userApplyContentBox']}>
                  <div className={friendVerification['userInfo']}>
                    <div className={friendVerification['userName']}>
                      userName
                    </div>
                    <div className={friendVerification['time']}>1秒前</div>
                  </div>
                  <div className={friendVerification['userApplyContent']}>
                    <div className={friendVerification['userApplyContentText']}>
                      <div
                        className={friendVerification['userApplyContentText']}
                      >
                        請求加您為好友
                      </div>
                      <div
                        className={friendVerification['userApplyContentText']}
                      >
                        附言：
                      </div>
                    </div>
                    <div
                      className={
                        friendVerification['userApplyContentButtonBox']
                      }
                    >
                      <div
                        className={
                          friendVerification['userApplyContentActionButtons']
                        }
                      >
                        <button
                          className={
                            friendVerification['userApplyContentButton']
                          }
                        >
                          接受
                        </button>
                        <button
                          className={
                            friendVerification['userApplyContentButton']
                          }
                        >
                          拒絕
                        </button>
                      </div>
                      <div
                        className={friendVerification['directMessageButton']}
                      >
                        <div
                          className={
                            friendVerification['directMessageButtonIcon']
                          }
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    );
  });

FriendVerificationPopup.displayName = 'FriendVerificationPopup';

export default FriendVerificationPopup;
