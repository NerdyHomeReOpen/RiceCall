import React, { useState } from 'react';

import styles from './ChatHistory.module.css';

const ChatHistoryPopup: React.FC = React.memo(() => {
  const totalPages = 10;

  const [currentPage, setCurrentPage] = useState(1);

  const goFirst = () => setCurrentPage(1);
  const goPrev = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goNext = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
  const goLast = () => setCurrentPage(totalPages);
  const goPage = (page: number) => setCurrentPage(page);

  const messages = [
    { id: 1, name: "使用者名稱", time: "00:00", message_text: "訊息內容" },
    { id: 2, name: "使用者名稱", time: "00:01", message_text: "訊息內容" },
    { id: 3, name: "使用者名稱", time: "00:02", message_text: "訊息內容" },
    { id: 4, name: "使用者名稱", time: "00:03", message_text: "訊息內容" },
    { id: 5, name: "使用者名稱", time: "00:04", message_text: "訊息內容" },
    { id: 6, name: "使用者名稱", time: "00:05", message_text: "訊息內容" },
    { id: 7, name: "使用者名稱", time: "00:06", message_text: "訊息內容" },
    { id: 8, name: "使用者名稱", time: "00:07", message_text: "訊息內容" },
  ];

  const [selectedMsg, setSelectedMsg] = useState<number | null>(null);

  return (
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="popup-content col">
          <div className={`${styles['header-box']} row`}>
            <div className={styles['select-wrapper']}>
              <div className="select-box" style={{ maxWidth: '100px', minWidth: '0' }}>
                <select className="select">
                  <option value="當前聯繫人">當前聯繫人</option>
                  <option value="語音群訊息">語音群訊息</option>
                </select>
              </div>
              <div className="select-box" style={{ maxWidth: '100px', minWidth: '0' }}>
                <select className="select">
                  <option value="最近一週">最近一週</option>
                  <option value="最近一個月">最近一個月</option>
                  <option value="最近三個月">最近三個月</option>
                </select>
              </div>
            </div>
            <div className={styles['search-wrapper']}>
              <span className={styles['search-title']}>關鍵字</span>
              <div className={`${styles['search-input-box']} input-box col`}>
                <input type="text" />
                <div className={styles['search-icon']} />
              </div>
            </div>
          </div>
          <div className={styles['body-box']}>
            <div className={styles['body-left']}>
              <div className={styles['friend-group-box']}>
                <div className={styles['friend-group-tab']}>
                  <div className={`${styles['friend-group-tab-toggle-icon']} ${styles['expanded']}`} />
                  <div>黑名單</div>
                  <div>(0)</div>
                </div>
              </div>
              <div className={styles['body-right']}>
                <div className={styles['main']}>
                  <div className={styles['main-title']}>與 %d 的聊天訊息紀錄</div>
                  <div className={styles['main-delete-button-box']}>
                    <div className={styles['delete-button-icon']} />
                    <div className={styles['delete-button-text']}>刪除紀錄</div>
                  </div>
                </div>
                <div className={styles['body-right-bottom']}>
                  <div className={styles['message-date']}>日期：2025/11/20</div>
                  <div className={styles['body-right-message-box']}>
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`${styles['message-item']} ${selectedMsg === msg.id ? styles['selected'] : ''}`}
                        onClick={() => setSelectedMsg(msg.id)}
                      >
                        <div className={styles['message-row-top']}>
                          <span className={styles['username']}>{msg.name}</span>
                          <span className={styles['send-time']}>{msg.time}</span>
                        </div>
                        <div className={styles['message-text']}>
                          {msg.message_text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles['pagination-wrapper']}>
                  <span className={styles['page-index']}>{currentPage}/{totalPages}</span>
                  <div className={styles['spacer']} />
                  <button
                    className={`${styles['page-btn']} ${styles['first']}`}
                    onClick={goFirst}
                    disabled={currentPage === 1}
                  />
                  <button
                    className={`${styles['page-btn']} ${styles['prev']}`}
                    onClick={goPrev}
                    disabled={currentPage === 1}
                  />
                  {[...Array(totalPages)].map((_, idx) => {
                    const page = idx + 1;
                    return (
                      <label
                        key={page}
                        className={`${styles['radio-wrapper']} ${currentPage === page ? styles['selected'] : ''}`}
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
                    className={`${styles['page-btn']} ${styles['next']}`}
                    onClick={goNext}
                    disabled={currentPage === totalPages}
                  />
                  <button
                    className={`${styles['page-btn']} ${styles['last']}`}
                    onClick={goLast}
                    disabled={currentPage === totalPages}
                  />
                  <div className={styles['spacer']} />
                </div>
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
