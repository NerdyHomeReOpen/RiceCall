import React, { useEffect, useMemo, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

import type * as Types from '@/types';
import { RelationStatus } from '@/types';

import { fetchChannelMessages, fetchDirectMessages, fetchUser } from '@/services';

import { ALLOWED_MESSAGE_KEYS, DEFAULT_USER_AVATAR_URL } from '@/constants';

import { useAppSelector } from '@/hooks/useStore';

import MarkdownContent from '@/components/markdown-content';

import { getDefaultFriendGroup } from '@/utils/default';
import { getFormatDate } from '@/utils/language';

import styles from './chat-history.module.css';

type ChatHistoryPopupProps = Types.PopupProps<'chatHistory'>;

type HistorySource = 'direct' | 'channel';

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const RANGES = [
  { days: 7, labelKey: 'chat-history-last-week' },
  { days: 30, labelKey: 'chat-history-last-month' },
  { days: 90, labelKey: 'chat-history-last-three-months' },
];
// How many page numbers the pagination shows around the current page.
const PAGE_LINK_COUNT = 5;

const ChatHistoryPopup: React.FC<ChatHistoryPopupProps> = React.memo(({ targetId: initialTargetId }) => {
  const { t } = useTranslation();

  const user = useAppSelector((state) => ({ currentServerId: state.user.data.currentServerId, currentChannelId: state.user.data.currentChannelId }), shallowEqual);
  const currentChannelName = useAppSelector((state) => state.currentChannel.data.name);
  const friends = useAppSelector((state) => state.friends.data, shallowEqual);
  const friendGroups = useAppSelector((state) => state.friendGroups.data, shallowEqual);

  const [source, setSource] = useState<HistorySource>('direct');
  const [targetId, setTargetId] = useState<string | null>(initialTargetId ?? null);
  const [targetName, setTargetName] = useState<string>('');
  const [rangeDays, setRangeDays] = useState<number>(RANGES[0].days);
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [history, setHistory] = useState<Types.HistoryPage | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);

  const defaultFriendGroup = useMemo(() => getDefaultFriendGroup({ name: t('my-friends'), order: 0 }), [t]);
  const blacklistGroup = useMemo(() => getDefaultFriendGroup({ friendGroupId: 'blacklist', name: t('blacklist'), order: Number.MAX_SAFE_INTEGER }), [t]);

  const contacts = friends.filter((f) => f.relationStatus === RelationStatus.Friend || f.isBlocked);
  const sortedFriendGroups = [defaultFriendGroup, ...friendGroups].sort((a, b) => a.order - b.order);
  const targetFriend = friends.find((f) => f.targetId === targetId) ?? null;
  const totalPages = history ? Math.max(1, Math.ceil(history.total / history.pageSize)) : 1;
  const firstPageLink = Math.max(1, Math.min(page - Math.floor(PAGE_LINK_COUNT / 2), totalPages - PAGE_LINK_COUNT + 1));
  const pageLinks = Array.from({ length: Math.min(PAGE_LINK_COUNT, totalPages) }, (_, index) => firstPageLink + index);
  const title = source === 'direct' ? (targetId ? t('chat-history-with', { 0: targetFriend?.note || targetFriend?.name || targetName }) : '') : t('chat-history-channel', { 0: currentChannelName });

  // Messages arrive oldest first within a page; a date heading starts each day.
  const messageDays = useMemo(() => {
    const days: { date: string; messages: Types.HistoryMessage[] }[] = [];
    for (const message of history?.messages ?? []) {
      const date = getFormatDate(message.createdAt, 'd');
      if (days.at(-1)?.date === date) days.at(-1)?.messages.push(message);
      else days.push({ date, messages: [message] });
    }
    return days;
  }, [history]);

  const changePage = (nextPage: number) => {
    setPage(Math.min(totalPages, Math.max(1, nextPage)));
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSource(e.target.value as HistorySource);
    setPage(1);
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRangeDays(Number(e.target.value));
    setPage(1);
  };

  const handleKeywordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeywordInput(e.target.value);
  };

  const handleSearch = () => {
    setKeyword(keywordInput.trim());
    setPage(1);
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleContactSelect = (userId: string) => {
    setSource('direct');
    setTargetId(userId);
    setPage(1);
  };

  useEffect(() => {
    if (!targetId || friends.some((f) => f.targetId === targetId)) return;
    // A conversation with someone who is not a friend still needs their name for the title.
    let isCancelled = false;
    fetchUser({ userId: targetId })
      .then((target) => {
        if (!isCancelled) setTargetName(target?.name ?? '');
      })
      .catch(() => {});
    return () => {
      isCancelled = true;
    };
  }, [targetId, friends]);

  useEffect(() => {
    const filter = { page, since: Date.now() - rangeDays * DAY_MILLISECONDS, keyword };
    const request =
      source === 'direct'
        ? targetId
          ? fetchDirectMessages({ targetId, ...filter })
          : null
        : user.currentServerId && user.currentChannelId
          ? fetchChannelMessages({ serverId: user.currentServerId, channelId: user.currentChannelId, ...filter })
          : null;
    if (!request) {
      setHistory(null);
      return;
    }
    let isCancelled = false;
    request
      .then((result) => {
        if (!isCancelled) setHistory(result);
      })
      .catch(() => {
        if (!isCancelled) setHistory(null);
      });
    return () => {
      isCancelled = true;
    };
  }, [source, targetId, user.currentServerId, user.currentChannelId, rangeDays, keyword, page]);

  return (
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="popup-content col">
          <div className={`${styles['header-box']} row`}>
            <div className={styles['select-wrapper']}>
              <div className="select-box" style={{ maxWidth: '100px', minWidth: '0' }}>
                <select className="select" value={source} onChange={handleSourceChange}>
                  <option value="direct">{t('chat-history-current-contact')}</option>
                  <option value="channel">{t('chat-history-server-messages')}</option>
                </select>
              </div>
              <div className="select-box" style={{ maxWidth: '100px', minWidth: '0' }}>
                <select className="select" value={rangeDays} onChange={handleRangeChange}>
                  {RANGES.map((range) => (
                    <option key={range.days} value={range.days}>
                      {t(range.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles['search-wrapper']}>
              <span className={styles['search-title']}>{t('chat-history-keyword')}</span>
              <div className={`${styles['search-input-box']} input-box col`}>
                <input type="text" value={keywordInput} onChange={handleKeywordInputChange} onKeyDown={handleKeywordKeyDown} />
                <div className={styles['search-icon']} onClick={handleSearch} />
              </div>
            </div>
          </div>
          <div className={styles['body-box']}>
            <div className={styles['body-left']}>
              <div className={styles['friend-group-box']}>
                {[...sortedFriendGroups, blacklistGroup].map((friendGroup) => (
                  <ContactGroup
                    key={friendGroup.friendGroupId}
                    friendGroup={friendGroup}
                    contacts={contacts}
                    isBlacklist={friendGroup === blacklistGroup}
                    selectedUserId={source === 'direct' ? targetId : null}
                    onSelect={handleContactSelect}
                  />
                ))}
              </div>
            </div>
            <div className={styles['body-right']}>
              <div className={styles['main']}>
                <div className={styles['main-title']}>{title}</div>
                {/* Deleting a shared conversation for one side is not designed yet. */}
                <div className={`${styles['delete-button-container']} ${styles['disabled']}`} title={t('soon')}>
                  <div className={styles['delete-icon']} />
                  <div className={styles['delete-button-text']}>{t('chat-history-delete')}</div>
                </div>
              </div>
              <div className={styles['body-right-bottom']}>
                {messageDays.length === 0 && <div className={styles['empty']}>{t('chat-history-empty')}</div>}
                {messageDays.map((day) => (
                  <React.Fragment key={day.date}>
                    <div className={styles['message-date']}>{t('chat-history-date', { 0: day.date })}</div>
                    <div className={styles['message-section']}>
                      {day.messages.map((message) => (
                        <HistoryMessageItem key={message.messageId} message={message} isSelected={selectedMessageId === message.messageId} onSelect={setSelectedMessageId} />
                      ))}
                    </div>
                  </React.Fragment>
                ))}
              </div>
              <div className={styles['pagination-wrapper']}>
                <span className={styles['page-index']}>
                  {page}/{totalPages}
                </span>
                <div className={styles['spacer']} />
                <button className={`${styles['page-button']} ${styles['first']} ${page === 1 ? styles['disabled'] : ''}`} onClick={() => changePage(1)} disabled={page === 1} />
                <button className={`${styles['page-button']} ${styles['prev']} ${page === 1 ? styles['disabled'] : ''}`} onClick={() => changePage(page - 1)} disabled={page === 1} />
                {pageLinks.map((pageLink) => (
                  <label key={pageLink} className={`${styles['radio-wrapper']} ${page === pageLink ? styles['selected'] : ''}`}>
                    <input type="radio" name="page" checked={page === pageLink} onChange={() => changePage(pageLink)} />
                    {pageLink}
                  </label>
                ))}
                <button className={`${styles['page-button']} ${styles['next']} ${page === totalPages ? styles['disabled'] : ''}`} onClick={() => changePage(page + 1)} disabled={page === totalPages} />
                <button
                  className={`${styles['page-button']} ${styles['last']} ${page === totalPages ? styles['disabled'] : ''}`}
                  onClick={() => changePage(totalPages)}
                  disabled={page === totalPages}
                />
                <div className={styles['spacer']} />
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

interface ContactGroupProps {
  friendGroup: Types.FriendGroup;
  contacts: Types.Friend[];
  isBlacklist: boolean;
  selectedUserId: string | null;
  onSelect: (userId: string) => void;
}

const ContactGroup: React.FC<ContactGroupProps> = React.memo(({ friendGroup, contacts, isBlacklist, selectedUserId, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Blocked friends are listed only under the blacklist.
  const groupContacts = useMemo(() => {
    if (isBlacklist) return contacts.filter((f) => f.isBlocked);
    const unblocked = contacts.filter((f) => !f.isBlocked);
    if (friendGroup.friendGroupId) return unblocked.filter((f) => f.friendGroupId === friendGroup.friendGroupId);
    return unblocked.filter((f) => !f.friendGroupId);
  }, [contacts, friendGroup.friendGroupId, isBlacklist]);

  const handleTabClick = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className={styles['friend-group-list']}>
      <div className={styles['friend-group']} onClick={handleTabClick}>
        <div>{friendGroup.name}</div>
        <div>{`(${groupContacts.length})`}</div>
      </div>
      {isExpanded &&
        groupContacts.map((friend) => (
          <div key={friend.targetId} className={`${styles['friend-info-box']} ${selectedUserId === friend.targetId ? styles['selected'] : ''}`} onClick={() => onSelect(friend.targetId)}>
            <div className={styles['avatar-box']}>
              <div className={styles['avatar-border']} />
              <Image className={styles['avatar']} src={friend.avatarUrl || DEFAULT_USER_AVATAR_URL} alt={friend.name} width={30} height={30} loading="lazy" draggable="false" />
            </div>
            <div className={styles['name']}>{friend.note || friend.name}</div>
          </div>
        ))}
    </div>
  );
});

ContactGroup.displayName = 'ContactGroup';

interface HistoryMessageItemProps {
  message: Types.HistoryMessage;
  isSelected: boolean;
  onSelect: (messageId: number) => void;
}

const HistoryMessageItem: React.FC<HistoryMessageItemProps> = React.memo(({ message, isSelected, onSelect }) => {
  const { t } = useTranslation();

  // System messages store translation keys among their words, as the chat views show them.
  const content = message.content
    .split(' ')
    .map((word) => (ALLOWED_MESSAGE_KEYS.includes(word) ? t(word) : word))
    .join(' ');

  return (
    <div className={`${styles['message-item']} ${isSelected ? styles['selected'] : ''}`} onClick={() => onSelect(message.messageId)}>
      <div className={styles['message-row-top']}>
        <span className={styles['username']}>{message.sender.nickname || message.sender.name}</span>
        <span className={styles['send-time']}>{getFormatDate(message.createdAt, 't')}</span>
      </div>
      <div className={styles['message-text']}>
        <MarkdownContent markdownText={content} />
      </div>
    </div>
  );
});

HistoryMessageItem.displayName = 'HistoryMessageItem';
