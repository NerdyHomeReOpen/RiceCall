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

type ChatHistoryPopupProps = Types.PopupProps<'chatHistory'>;
type HistorySource = 'direct' | 'channel';

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

const RANGES = [
  { days: 7, labelKey: 'chat-history-last-week' },
  { days: 30, labelKey: 'chat-history-last-month' },
  { days: 90, labelKey: 'chat-history-last-three-months' },
];

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
    const filter = { page, sinceMs: Date.now() - rangeDays * DAY_MILLISECONDS, keyword };

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
          <div className="flex gap-[5px] place-items-center w-full h-[50px] p-[10px] bg-[#f7f7f7] border-b border-[#d6d6d6] row">
            <div className="flex flex-row gap-[1rem]">
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
            <div className="flex flex-row place-items-center">
              <span className="flex items-center w-[80px] h-[25px]">{t('chat-history-keyword')}</span>
              <div className="group flex items-center bg-background border border-border shadow-box-shadow input-box col">
                <input
                  type="text"
                  className="[background-color:unset]! [border:unset]! [box-shadow:unset]!"
                  value={keywordInput}
                  onChange={handleKeywordInputChange}
                  onKeyDown={handleKeywordKeyDown}
                />
                <div
                  className="w-[16px] h-[16px] mr-[0.5rem] cursor-pointer bg-[url('/icon_search.png')] bg-no-repeat bg-position-[0_0] bg-auto group-hover:bg-position-[-16px_0] group-hover:active:bg-position-[-33px_0]"
                  onClick={handleSearch}
                />
              </div>
            </div>
          </div>
          <div className="flex w-full h-[calc(100vh-80px)] bg-[#fcfcfc]">
            <div className="flex-[unset] w-[250px] h-full min-h-[467.34px] overflow-auto border-r border-[#d6d6d6]">
              <div className="flex flex-col">
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
            <div className="flex flex-col w-full h-full">
              <div className="flex items-center justify-between w-full h-[33px] bg-[#fafcff] border-b border-[#d6d6d6]">
                <div className="ml-[0.8rem]">{title}</div>
                {/* Deleting a shared conversation for one side is not designed yet. */}
                <div className="flex items-center justify-between w-[80px] h-[22px] p-[2px] mr-[0.5rem] cursor-not-allowed opacity-50 border border-[#b1b1b1] hover:bg-[#eee]" title={t('soon')}>
                  <div className="w-[16px] h-[16px] bg-[url('/Delete_ico.png')] bg-auto" />
                  <div>{t('chat-history-delete')}</div>
                </div>
              </div>
              <div className="flex flex-1 flex-col items-center pt-[0.7rem] overflow-y-auto">
                {messageDays.length === 0 && <div className="p-[1rem] text-[#888]">{t('chat-history-empty')}</div>}
                {messageDays.map((day) => (
                  <React.Fragment key={day.date}>
                    <div className="flex items-end w-[95%] h-[40px] pb-[0.5rem] font-bold text-[rgb(0_106_209)] bg-[linear-gradient(#fff_0%,#f4f7fc_100%)] border-b border-[#b6cedc]">
                      {t('chat-history-date', { 0: day.date })}
                    </div>
                    <div className="flex flex-col gap-[0.5rem] items-center w-full py-[10px] px-0">
                      {day.messages.map((message) => (
                        <HistoryMessageItem key={message.messageId} message={message} isSelected={selectedMessageId === message.messageId} onSelect={setSelectedMessageId} />
                      ))}
                    </div>
                  </React.Fragment>
                ))}
              </div>
              <div className="flex shrink-0 gap-[5px] items-center h-[40px] py-[5px] px-[10px] bg-[rgb(244_247_252)] border-t border-[#d6d6d6]">
                <span className="text-center">
                  {page}/{totalPages}
                </span>
                <div className="flex-1" />
                <button
                  className={`w-[11px] h-[11px] p-0 m-[0.5rem] cursor-pointer [background-color:unset] bg-[url('/btn_turn_page.png')] bg-no-repeat bg-auto border-none ${page === 1 ? 'bg-position-[-44px_0]' : 'bg-position-[0_0]'}`}
                  onClick={() => changePage(1)}
                  disabled={page === 1}
                />
                <button
                  className={`w-[11px] h-[11px] p-0 m-[0.5rem] cursor-pointer [background-color:unset] bg-[url('/btn_turn_page.png')] bg-no-repeat bg-auto border-none ${page === 1 ? 'bg-position-[-55px_0]' : 'bg-position-[-11px_0]'}`}
                  onClick={() => changePage(page - 1)}
                  disabled={page === 1}
                />
                {pageLinks.map((pageLink) => (
                  <label
                    key={pageLink}
                    className={`flex items-center justify-center w-[3.5rem] h-[1.9rem] mx-[0.2rem] text-center cursor-pointer [&_input[type='radio']]:hidden ${page === pageLink ? 'bg-[#006ad1]' : 'hover:bg-[#c2c2c2]'}`}
                  >
                    <input type="radio" name="page" checked={page === pageLink} onChange={() => changePage(pageLink)} />
                    {pageLink}
                  </label>
                ))}
                <button
                  className={`w-[11px] h-[11px] p-0 m-[0.5rem] cursor-pointer [background-color:unset] bg-[url('/btn_turn_page.png')] bg-no-repeat bg-auto border-none ${page === totalPages ? 'bg-position-[-66px_0]' : 'bg-position-[-22px_0]'}`}
                  onClick={() => changePage(page + 1)}
                  disabled={page === totalPages}
                />
                <button
                  className={`w-[11px] h-[11px] p-0 m-[0.5rem] cursor-pointer [background-color:unset] bg-[url('/btn_turn_page.png')] bg-no-repeat bg-auto border-none ${page === totalPages ? 'bg-position-[-77px_0]' : 'bg-position-[-33px_0]'}`}
                  onClick={() => changePage(totalPages)}
                  disabled={page === totalPages}
                />
                <div className="flex-1" />
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
    <div className="flex flex-col">
      <div className="flex gap-[2px] items-center h-[25px] p-[5px] cursor-pointer rounded-[3px]" onClick={handleTabClick}>
        <div>{friendGroup.name}</div>
        <div>{`(${groupContacts.length})`}</div>
      </div>
      {isExpanded &&
        groupContacts.map((friend) => (
          <div
            key={friend.targetId}
            className={`relative flex gap-[5px] items-center justify-start py-[5px] pr-[10px] pl-[50px] rounded-[3px] hover:bg-hover ${selectedUserId === friend.targetId ? 'bg-selected' : ''}`}
            onClick={() => onSelect(friend.targetId)}
          >
            <div className="flex">
              <div className="absolute z-1 w-[30px] h-[30px] bg-[url('/win_border.png')] bg-no-repeat bg-center bg-cover" />
              <Image
                className="relative min-w-[30px] min-h-[30px] object-cover bg-[url('/im/SecretaryLogo.png')] bg-no-repeat bg-center bg-cover"
                src={friend.avatarUrl || DEFAULT_USER_AVATAR_URL}
                alt={friend.name}
                width={30}
                height={30}
                loading="lazy"
                draggable="false"
              />
            </div>
            <div className="overflow-hidden text-ellipsis whitespace-nowrap">{friend.note || friend.name}</div>
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
    <div
      className={`flex flex-1 flex-col w-[95%] h-auto py-[6px] px-[10px] rounded-[4px] transition-[background] duration-150 ease-[ease] hover:bg-[#eaf3ff] ${isSelected ? 'bg-[#eaf3ff]' : ''}`}
      onClick={() => onSelect(message.messageId)}
    >
      <div className="justify-between text-[14px] text-[#555]">
        <span className="mr-[0.5rem] cursor-text select-text">{message.sender.nickname || message.sender.name}</span>
        <span className="text-[13px] cursor-text select-text">{getFormatDate(message.createdAt, 't')}</span>
      </div>
      <div className="mt-[10px] text-[13px] text-[#006ad1] cursor-text select-text">
        <MarkdownContent markdownText={content} />
      </div>
    </div>
  );
});

HistoryMessageItem.displayName = 'HistoryMessageItem';
