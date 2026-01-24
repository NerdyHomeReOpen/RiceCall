import React, { useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import chatHistory from '@/styles/chatHistory.module.css';
import friendList from '@/styles/friend.module.css';

// Types
import type { FriendApplication, FriendGroup, User } from '@/types';

interface ChatHistoryPopupProps {
  userId: User['userId'];
  targetId: User['userId'];
  target: User;
  friendGroups: FriendGroup[];
  friendApplication: FriendApplication | null;
  totalPages?: number;
}

const ChatHistoryPopup: React.FC<ChatHistoryPopupProps> = React.memo(({ totalPages = 5 }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const goFirst = () => setCurrentPage(1);
  const goPrev = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const goNext = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  const goLast = () => setCurrentPage(totalPages);
  const goPage = (page: number) => setCurrentPage(page);

  const messages = [
    { id: 1, name: '使用者名稱', time: '00:00', message_text: '訊息內容' },
    { id: 2, name: '使用者名稱', time: '00:01', message_text: '訊息內容' },
    { id: 3, name: '使用者名稱', time: '00:02', message_text: '訊息內容' },
    { id: 4, name: '使用者名稱', time: '00:03', message_text: '訊息內容' },
    { id: 5, name: '使用者名稱', time: '00:04', message_text: '訊息內容' },
    { id: 6, name: '使用者名稱', time: '00:05', message_text: '訊息內容' },
    { id: 7, name: '使用者名稱', time: '00:06', message_text: '訊息內容' },
    { id: 8, name: '使用者名稱', time: '00:07', message_text: '訊息內容' },
  ];

  const [selectedMsg, setSelectedMsg] = useState<number | null>(null);

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={`${chatHistory['content']} ${popup['content']} ${popup['col']}`}>
          {/* header 區 */}
          <div className={`${chatHistory['header-box']} ${popup['row']}`}>
            <div className={chatHistory['select-wrapper']}>
              <div className={popup['select-box']} style={{ maxWidth: '100px' }}>
                <select className={popup['select']}>
                  <option value="當前聯繫人">當前聯繫人</option>
                  <option value="語音群訊息">語音群訊息</option>
                </select>
              </div>

              <div className={popup['select-box']} style={{ maxWidth: '100px' }}>
                <select className={popup['select']}>
                  <option value="最近一週">最近一週</option>
                  <option value="最近一個月">最近一個月</option>
                  <option value="最近三個月">最近三個月</option>
                </select>
              </div>
            </div>

            <div className={chatHistory['search-wrapper']}>
              <span className={chatHistory['search-title']}>關鍵字</span>
              <div className={`${chatHistory['search-input-box']} ${popup['input-box']} ${popup['col']}`}>
                <input type="text" />
                <div className={chatHistory['search-icon']} />
              </div>
            </div>
          </div>

          {/* body 區 */}
          <div className={chatHistory['body-box']}>
            {/* 左側好友群組 */}
            <div className={`${chatHistory['body-left']} ${friendList['friend-group-list']}`}>
              <div className={chatHistory['friend-group-box']}>
                <div className={`${friendList['friend-group-tab']}`}>
                  <div className={`${friendList['toggle-icon']} ${friendList['expanded']}`} />
                  <div>黑名單</div>
                  <div>(0)</div>
                </div>

                {/* friend list */}
                <div className={chatHistory['friend-group-list']}>
                  <div className={chatHistory['friend-info-box']}>
                    <div className={chatHistory['avatar-box']}>
                      <div className={chatHistory['avatar-border']} />
                      <div className={chatHistory['avatar']} />
                    </div>
                    <div className={chatHistory['name']}>123</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 右側訊息區 */}
            <div className={chatHistory['body-right']}>
              {/* header */}
              <div className={chatHistory['main']}>
                <div className={chatHistory['main-title']}>與 %d 的聊天訊息紀錄</div>
                <div className={chatHistory['main-delete-button-box']}>
                  <div className={chatHistory['delete-button-icon']} />
                  <div className={chatHistory['delete-button-text']}>刪除紀錄</div>
                </div>
              </div>

              {/* 日期 */}
              <div className={chatHistory['body-right-bottom']}>
                <div className={chatHistory['message-date']}>日期：2025/11/20</div>
                {/* 訊息內容 */}
                <div className={chatHistory['body-right-message-box']}>
                  {messages.map((msg) => (
                    <div key={msg.id} className={`${chatHistory['message-item']} ${selectedMsg === msg.id ? chatHistory['selected'] : ''}`} onClick={() => setSelectedMsg(msg.id)}>
                      <div className={chatHistory['message-row-top']}>
                        <span className={chatHistory['username']}>{msg.name}</span>
                        <span className={chatHistory['send-time']}>{msg.time}</span>
                      </div>
                      <div className={chatHistory['message-text']}>{msg.message_text}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 分頁 */}
              <div className={chatHistory['pagination-wrapper']}>
                <span className={chatHistory['page-index']}>
                  {currentPage}/{totalPages}
                </span>
                <div className={chatHistory['spacer']} />

                <button className={`${chatHistory['page-btn']} ${chatHistory['first']}`} onClick={goFirst} disabled={currentPage === 1} />
                <button className={`${chatHistory['page-btn']} ${chatHistory['prev']}`} onClick={goPrev} disabled={currentPage === 1} />

                {[...Array(totalPages)].map((_, idx) => {
                  const page = idx + 1;
                  return (
                    <label key={page} className={`${chatHistory['radio-wrapper']} ${currentPage === page ? chatHistory['selected'] : ''}`}>
                      <input type="radio" name="page" checked={currentPage === page} onChange={() => goPage(page)} />
                      {page}
                    </label>
                  );
                })}

                <button className={`${chatHistory['page-btn']} ${chatHistory['next']}`} onClick={goNext} disabled={currentPage === totalPages} />
                <button className={`${chatHistory['page-btn']} ${chatHistory['last']}`} onClick={goLast} disabled={currentPage === totalPages} />
                <div className={chatHistory['spacer']} />
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
