import React from 'react';

import styles from '@/styles/chatHistory.module.css';
import popupStyles from '@/styles/popup.module.css';
import friendStyles from '@/styles/friend.module.css';

const ChatHistoryPopup: React.FC = React.memo(() => {
  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={`${styles['content']} ${popupStyles['content']} ${popupStyles['col']}`}>
          <div className={`${styles['header-box']} ${popupStyles['row']}`}>
            <div className={styles['select-wrapper']}>
              <div className={popupStyles['select-box']} style={{ maxWidth: '100px', minWidth: '0' }}>
                <select className={popupStyles['select']}>
                  <option value="當前聯繫人">當前聯繫人</option>
                  <option value="語音群訊息">語音群訊息</option>
                </select>
              </div>
              <div className={popupStyles['select-box']} style={{ maxWidth: '100px', minWidth: '0' }}>
                <select className={popupStyles['select']}>
                  <option value="最近一週">最近一週</option>
                  <option value="最近一個月">最近一個月</option>
                  <option value="最近三個月">最近三個月</option>
                </select>
              </div>
            </div>
            <div className={styles['search-wrapper']}>
              <span className={styles['search-title']}>關鍵字</span>
              <div className={`${styles['search-input-box']} ${popupStyles['input-box']} ${popupStyles['col']}`}>
                <input type="text" />
                <div className={styles['search-icon']} />
              </div>
            </div>
          </div>
          <div className={styles['body-box']}>
            <div className={`${styles['body-left']} ${friendStyles['friend-group-list']}`}>
              <div className={styles['friend-group-box']}>
                <div className={`${friendStyles['friend-group-tab']}`}>
                  <div className={`${friendStyles['toggle-icon']} ${friendStyles['expanded']}`} />
                  <div>黑名單</div>
                  <div>(0)</div>
                </div>
                <div className={styles['friend-group-list']}>
                  <div className={styles['friend-info-box']}>
                    <div className={styles['avatar-box']}>
                      <div className={styles['avatar-border']} />
                      <div className={styles['avatar']} />
                    </div>
                    <div className={styles['name']}>123</div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles['body-right']}>
              <div className={styles['body-right-top']}>
                <div className={styles['body-right-top-title']}>與 %d 的聊天訊息紀錄</div>
                <div className={styles['body-right-top-delete-button-box']}>
                  <div className={styles['delete-button-icon']} />
                  <div className={styles['delete-button-text']}>刪除紀錄</div>
                </div>
              </div>
              <div className={styles['body-right-botton']}>
                <div className={styles['message-date']} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ChatHistoryPopup.displayName = 'ChatHistoryPopup';

export default ChatHistoryPopup;
