import React, { useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import chatHistory from '@/styles/chatHistory.module.css';
import friednList from "@/styles/friend.module.css";

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
  const goPrev = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goNext = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
  const goLast = () => setCurrentPage(totalPages);
  const goPage = (page: number) => setCurrentPage(page);

  return (
    <div className={popup['popup-wrapper']}>
      <div className={popup['popup-body']}>
        <div className={`${chatHistory['content']} ${popup['content']} ${popup['col']}`}>
          <div className={`${chatHistory['header-box']} ${popup['row']}`}>
            <div className={chatHistory['select-wrapper']}>
              <div className={popup['select-box']} style={{ maxWidth: '100px', minWidth: '0' }}>
                <select className={popup['select']}>
                  <option value="當前聯繫人">當前聯繫人 </option>
                  <option value="語音群訊息">語音群訊息 </option>
                </select>
              </div>
              <div className={popup['select-box']} style={{ maxWidth: '100px', minWidth: '0' }}>
                <select className={popup['select']}>
                  <option value="最近一週">最近一週 </option>
                  <option value="最近一個月">最近一個月 </option>
                  <option value="最近三個月">最近三個月 </option>
                </select>
              </div>
            </div>
            <div className={chatHistory['search-wrapper']}>
              <span className={chatHistory['search-title']}>關鍵字</span>
              <div className={`${chatHistory['search-input-box']} ${popup['input-box']} ${popup['col']}`}>
                <input type="text" />
                <div className={chatHistory['search-icon']}></div>
              </div>
            </div>
          </div>

          <div className={chatHistory['body-box']}>
            <div className={`${chatHistory['body-left']} ${friednList['friend-group-list']}`}>
              <div className={chatHistory['friend-group-box']}>
                <div className={`${friednList['friend-group-tab']}`}>
                  <div className={`${friednList['toggle-icon']} ${friednList['expanded']}`}></div>
                  <div>我的好友</div>
                  <div>(0)</div>
                </div>
                {/* friend list */}
                <div className={chatHistory['friend-group-list']}>
                  <div className={chatHistory['friend-info-box']}>
                    <div className={chatHistory['avatar-box']}>
                      <div className={chatHistory['avatar-border']}></div>
                      <div className={chatHistory['avatar']}></div>
                    </div>
                    <div className={chatHistory['name']}>123</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={chatHistory['body-right']}>
              <div className={chatHistory['main']}>
                <div className={chatHistory['main-title']}>與 %d 的聊天訊息紀錄</div>
                <div className={chatHistory['main-delete-button-box']}>
                  <div className={chatHistory['delete-button-icon']}></div>
                  <div className={chatHistory['delete-button-text']}>刪除紀錄</div>
                </div>
              </div>

              <div className={chatHistory['body-right-bottom']}>
                <div className={chatHistory['message-date']}>日期：%d/%d/%d</div>
                <div className={chatHistory['message-item']}>
                  <div className={chatHistory['user-name']}>123</div>
                  <div className={chatHistory['send-time']}>23:42</div>
                  <div className={chatHistory['message-text']}>123</div>
                </div>
                <div className={chatHistory['message-item']}>
                  <div className={chatHistory['user-name']}>123</div>
                  <div className={chatHistory['send-time']}>23:42</div>
                  <div className={chatHistory['message-text']}>123</div>
                </div>
                <div className={chatHistory['message-item']}>
                  <div className={chatHistory['user-name']}>123</div>
                  <div className={chatHistory['send-time']}>23:42</div>
                  <div className={chatHistory['message-text']}>123</div>
                </div>
                <div className={chatHistory['message-item']}>
                  <div className={chatHistory['user-name']}>123</div>
                  <div className={chatHistory['send-time']}>23:42</div>
                  <div className={chatHistory['message-text']}>123</div>
                </div>
                <div className={chatHistory['message-item']}>
                  <div className={chatHistory['user-name']}>123</div>
                  <div className={chatHistory['send-time']}>23:42</div>
                  <div className={chatHistory['message-text']}>123</div>
                </div>
                <div className={chatHistory['message-item']}>
                  <div className={chatHistory['user-name']}>123</div>
                  <div className={chatHistory['send-time']}>23:42</div>
                  <div className={chatHistory['message-text']}>123</div>
                </div>
                <div className={chatHistory['message-item']}>
                  <div className={chatHistory['user-name']}>123</div>
                  <div className={chatHistory['send-time']}>23:42</div>
                  <div className={chatHistory['message-text']}>123</div>
                </div>
                <div className={chatHistory['message-item']}>
                  <div className={chatHistory['user-name']}>123</div>
                  <div className={chatHistory['send-time']}>23:42</div>
                  <div className={chatHistory['message-text']}>123</div>
                </div>
                <div className={chatHistory['message-item']}>
                  <div className={chatHistory['user-name']}>123</div>
                  <div className={chatHistory['send-time']}>23:42</div>
                  <div className={chatHistory['message-text']}>123</div>
                </div>
                <div className={chatHistory['message-item']}>
                  <div className={chatHistory['user-name']}>123</div>
                  <div className={chatHistory['send-time']}>23:42</div>
                  <div className={chatHistory['message-text']}>123</div>
                </div>
                <div className={chatHistory['message-item']}>
                  <div className={chatHistory['user-name']}>123</div>
                  <div className={chatHistory['send-time']}>23:42</div>
                  <div className={chatHistory['message-text']}>123</div>
                </div>
              </div>

              {/* 分頁 */}
              <div className={chatHistory['pagination-wrapper']}>
                <span className={chatHistory['page-index']}>{currentPage}/{totalPages}</span>
                <div className={chatHistory['spacer']} />

                <button
                  className={`${chatHistory['page-btn']} ${chatHistory['first']}`}
                  onClick={goFirst}
                  disabled={currentPage === 1}
                />
                <button
                  className={`${chatHistory['page-btn']} ${chatHistory['prev']}`}
                  onClick={goPrev}
                  disabled={currentPage === 1}
                />

                {[...Array(totalPages)].map((_, idx) => {
                  const page = idx + 1;
                  return (
                    <label
                      key={page}
                      className={`${chatHistory['radio-wrapper']} ${currentPage === page ? chatHistory['selected'] : ''}`}
                    >
                      <input
                        type="radio"
                        name="page"
                        checked={currentPage === page}
                        onChange={() => goPage(page)}
                      />
                      {page}
                    </label>
                  );
                })}

                <button
                  className={`${chatHistory['page-btn']} ${chatHistory['next']}`}
                  onClick={goNext}
                  disabled={currentPage === totalPages}
                />
                <button
                  className={`${chatHistory['page-btn']} ${chatHistory['last']}`}
                  onClick={goLast}
                  disabled={currentPage === totalPages}
                />
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
