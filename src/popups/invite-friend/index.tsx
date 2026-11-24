import React, { useMemo, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

import type * as Types from '@/types';
import { RelationStatus } from '@/types';

import * as ipc from '@/main/ipc';

import { openAlertDialog } from '@/services';

import { INVITATION_BASE_URL, DEFAULT_USER_AVATAR_URL } from '@/constants';

import { useAppSelector } from '@/hooks/useStore';

import { getDefaultFriendGroup } from '@/utils/default';

type InviteFriendPopupProps = Types.PopupProps<'inviteFriend'>;

const InviteFriendPopup: React.FC<InviteFriendPopupProps> = React.memo(({ id, server }) => {
  const { t } = useTranslation();

  const friends = useAppSelector((state) => state.friends.data, shallowEqual);
  const friendGroups = useAppSelector((state) => state.friendGroups.data, shallowEqual);

  const [query, setQuery] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const defaultFriendGroup = useMemo(() => getDefaultFriendGroup({ name: t('my-friends'), order: 0 }), [t]);

  const selectedUserIdSet = new Set(selectedUserIds);
  const sortedFriends = friends.filter((f) => !f.isBlocked && f.relationStatus === RelationStatus.Friend && f.name.includes(query)).sort((a, b) => a.name.localeCompare(b.name));
  const sortedFriendGroups = [defaultFriendGroup, ...friendGroups].sort((a, b) => a.order - b.order);
  const isAllSelected = sortedFriends.every((f) => selectedUserIdSet.has(f.targetId));

  const handleSelect = (userId: Types.User['userId']) => {
    if (selectedUserIdSet.has(userId)) setSelectedUserIds((prev) => prev.filter((selectedUserId) => selectedUserId !== userId));
    else setSelectedUserIds((prev) => [...prev, userId]);
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedUserIds(sortedFriends.map((f) => f.targetId));
    else setSelectedUserIds([]);
  };

  const handleInviteFriendBtnClick = () => {
    if (selectedUserIds.length === 0) return;
    openAlertDialog(t('invite-friend-to-server-confirm', { 0: selectedUserIds.length, 1: server.name }), () => {
      const invitationLink = `${INVITATION_BASE_URL}?serverDisplayId=${server.specialId || server.displayId}`;
      const formatedMessage = `<a href='${invitationLink}' type='invitation' customLink='true' >${invitationLink}</a>`;
      for (const userId of selectedUserIds) {
        ipc.socket.send('directMessage', { targetId: userId, preset: { type: 'dm', content: formatedMessage } });
      }
      ipc.popup.close(id);
    });
  };

  return (
    <div className="popup-wrapper">
      <div className="flex flex-1 items-center justify-center w-full max-h-[45px] border-b border-b-border">
        <div className="min-w-[80%]">
          <div className="group flex items-center pl-[10px] mr-[10px] border border-border rounded-[5px]">
            <div className="min-w-[20px] min-h-[20px] bg-[url('/channel/channel_search.svg')] bg-no-repeat bg-position-[0_0] group-hover:bg-position-[-20px_0]" />
            <input name="query" type="text" className="flex-1 w-[125px] p-[5px]" placeholder={t('search-friend-placeholder')} value={query} onChange={handleQueryChange} />
          </div>
        </div>
        <div className={`button ${selectedUserIds.length === 0 ? 'disabled' : ''}`} onClick={handleInviteFriendBtnClick}>
          {t('invite')}
        </div>
      </div>
      <div className="popup-body">
        <div className="flex flex-1 flex-col min-w-0 min-h-0 p-[10px]">
          <div className="row">
            <div className="flex items-center p-[5px] text-[14px]">
              <input type="checkbox" checked={isAllSelected} onChange={handleSelectAllChange} />
              {t('select-all')} {t('invite-total-for', { 0: selectedUserIds.length })}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sortedFriendGroups.map((friendGroup) => (
              <FriendGroupTab key={friendGroup.friendGroupId} friendGroup={friendGroup} friends={sortedFriends} selectedUserIdSet={selectedUserIdSet} onSelect={handleSelect} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

InviteFriendPopup.displayName = 'InviteFriendPopup';

export default InviteFriendPopup;

interface FriendGroupTabProps {
  friends: Types.Friend[];
  friendGroup: Types.FriendGroup;
  selectedUserIdSet: Set<Types.User['userId']>;
  onSelect: (id: Types.User['userId']) => void;
}

const FriendGroupTab: React.FC<FriendGroupTabProps> = React.memo(({ friends, friendGroup, selectedUserIdSet, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const friendGroupFriends = useMemo(() => {
    if (friendGroup.friendGroupId) return friends.filter((f) => f.friendGroupId === friendGroup.friendGroupId);
    else return friends.filter((f) => !f.friendGroupId);
  }, [friendGroup.friendGroupId, friends]);
  const isAllSelected = useMemo(() => friendGroupFriends.every((f) => selectedUserIdSet.has(f.targetId)), [friendGroupFriends, selectedUserIdSet]);

  const handleSelectAllChange = () => {
    if (isAllSelected) friendGroupFriends.map((f) => f.targetId).forEach((userId) => (selectedUserIdSet.has(userId) ? onSelect(userId) : null));
    else friendGroupFriends.map((f) => f.targetId).forEach((userId) => (selectedUserIdSet.has(userId) ? null : onSelect(userId)));
  };

  const handleTabClick = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleSelect = (userId: Types.User['userId']) => {
    onSelect(userId);
  };

  return (
    <>
      <div className="flex gap-[2px] items-center h-[25px] p-[5px]">
        <input type="checkbox" checked={isAllSelected} onChange={handleSelectAllChange} />
        <div className="flex flex-row gap-[5px] items-center" onClick={handleTabClick}>
          <div className={`inline-block min-w-[14px] min-h-[14px] bg-[url('/channel/channelIcon.svg')] bg-no-repeat bg-auto ${isExpanded ? 'bg-position-[-14px_0]' : 'bg-position-[0_0]'}`} />
          <div>{friendGroup.name}</div>
          <div>{`(${friendGroupFriends.length})`}</div>
        </div>
      </div>
      <div style={isExpanded ? {} : { display: 'none' }}>
        {friendGroupFriends.map((friend) => (
          <FriendTab key={friend.targetId} friend={friend} selectedUserIdSet={selectedUserIdSet} onSelect={handleSelect} />
        ))}
      </div>
    </>
  );
});

FriendGroupTab.displayName = 'FriendGroupTab';

interface FriendTabProps {
  friend: Types.Friend;
  selectedUserIdSet: Set<Types.User['userId']>;
  onSelect: (id: Types.User['userId']) => void;
}

const FriendTab: React.FC<FriendTabProps> = React.memo(({ friend, selectedUserIdSet, onSelect }) => {
  const isSelected = selectedUserIdSet.has(friend.targetId);
  const hasVip = friend.vip > 0;
  const hasNote = !!friend.note;

  const handleTabClick = () => {
    onSelect(friend.targetId);
  };

  return (
    <div className={`relative flex gap-[5px] items-center justify-start p-[5px] pl-[20px] ${isSelected ? 'bg-selected' : 'hover:bg-hover'}`} onClick={handleTabClick}>
      <input type="checkbox" checked={isSelected} readOnly />
      <div className="relative w-[25px] h-[25px]">
        <Image src={friend.avatarUrl || DEFAULT_USER_AVATAR_URL} alt="friend_avatar" width={25} height={25} loading="lazy" draggable="false" />
      </div>
      <div className="flex flex-row items-center">
        {hasVip && <div className={`vip-icon vip-${friend.vip}`} />}
        <div className="overflow-hidden text-ellipsis font-bold whitespace-nowrap">
          {friend.note || friend.name} {hasNote ? `(${friend.name})` : ''}
        </div>
      </div>
    </div>
  );
});

FriendTab.displayName = 'FriendTab';
