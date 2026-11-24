import React, { useMemo, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { openCreateFriendGroup, openSearchUser } from '@/services';

import { useAppSelector } from '@/hooks/useStore';

import FriendGroupTab from './FriendGroupTab';

import { getDefaultFriendGroup } from '@/utils/default';

const FriendPageSidebar: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const friends = useAppSelector((state) => state.friends.data, shallowEqual);
  const friendGroups = useAppSelector((state) => state.friendGroups.data, shallowEqual);
  const [query, setQuery] = useState<string>('');
  const [selectedTabId, setSelectedTabId] = useState<'friend' | 'recent'>('friend');
  const defaultFriendGroup = useMemo(() => getDefaultFriendGroup({ friendGroupId: 'default', name: t('my-friends'), order: -1 }), [t]);
  const strangerFriendGroup = useMemo(() => getDefaultFriendGroup({ friendGroupId: 'stranger', name: t('stranger'), order: 10000 }), [t]);
  const blacklistFriendGroup = useMemo(() => getDefaultFriendGroup({ friendGroupId: 'blacklist', name: t('blacklist'), order: 10001 }), [t]);
  const sortedFriendGroups = [defaultFriendGroup, ...friendGroups, strangerFriendGroup, blacklistFriendGroup].sort((a, b) => a.order - b.order);
  const filteredFriends = friends.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));
  const isFriendTab = selectedTabId === 'friend';
  const isRecentTab = selectedTabId === 'recent';

  const handleFriendTabClick = () => {
    setSelectedTabId('friend');
  };

  const handleRecentTabClick = () => {
    setSelectedTabId('recent');
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleCreateFriendGroupBtnClick = () => {
    openCreateFriendGroup();
  };

  const handleAddFriendBtnClick = () => {
    openSearchUser();
  };

  return (
    <>
      <div className="flex items-center justify-evenly w-full h-[36px] cursor-pointer">
        <div
          className={`flex flex-1 items-center justify-center w-[136px] h-[36px] text-center cursor-pointer bg-[url('/friend_tab_item_bg.svg')] ${isFriendTab ? 'bg-position-[0_-36px]' : 'bg-position-[0_0]'}`}
          onClick={handleFriendTabClick}
        >
          <div className={`min-w-[16px] min-h-[16px] bg-[url('/im/friend_list_page.svg')] bg-no-repeat bg-auto ${isFriendTab ? 'bg-position-[-64px_0]' : 'bg-position-[0_0]'}`} />
        </div>
        <div
          className={`flex flex-1 items-center justify-center w-[136px] h-[36px] text-center cursor-pointer bg-[url('/friend_tab_item_bg.svg')] ${isRecentTab ? 'bg-position-[0_-36px]' : 'bg-position-[0_0]'}`}
          onClick={handleRecentTabClick}
        >
          <div className={`min-w-[16px] min-h-[16px] bg-[url('/im/recently_list_page.svg')] bg-no-repeat bg-auto ${isRecentTab ? 'bg-position-[-64px_0]' : 'bg-position-[0_0]'}`} />
        </div>
      </div>
      <div className="group/search flex items-center pl-[10px] bg-background border-y border-y-border">
        <div className="min-w-[20px] min-h-[20px] bg-[url('/channel/channel_search.svg')] bg-no-repeat bg-position-[0_0] group-hover/search:not-group-has-[input~div:hover]/search:bg-position-[-20px_0]" />
        <input name="query" type="text" className="flex-1 w-[125px] p-[5px]" placeholder={t('search-friend-placeholder')} value={query} onChange={handleQueryChange} />
        <div className="min-w-[29px] min-h-[30px] cursor-pointer bg-[url('/channel/search_pre.svg')] bg-no-repeat bg-position-[0_0] hover:bg-position-[-29px_0] active:bg-position-[-58px_0]" />
        <div className="min-w-[29px] min-h-[30px] cursor-pointer bg-[url('/channel/search_next.svg')] bg-no-repeat bg-position-[0_0] hover:bg-position-[-29px_0] active:bg-position-[-58px_0]" />
      </div>
      <div className="flex flex-1 flex-col min-w-0 min-h-0 p-[10px] overflow-y-auto" style={isFriendTab ? {} : { display: 'none' }}>
        <div className="flex-1">
          {sortedFriendGroups.map((friendGroup) => (
            <FriendGroupTab key={friendGroup.friendGroupId} friendGroup={friendGroup} friends={filteredFriends} />
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col min-w-0 min-h-0 p-[10px] overflow-y-auto" style={isRecentTab ? {} : { display: 'none' }}>
        <div className="flex flex-1 flex-col" />
      </div>
      <div className="flex gap-[10px] items-center justify-center p-[6px] bg-sidebar border-t border-t-border rounded-bl-[5px]">
        <div
          className="flex items-center justify-center px-[20px] py-[4px] text-text-color-quaternary text-left cursor-pointer bg-background border border-border rounded-[5px] hover:bg-hover before:min-w-[16px] before:min-h-[16px] before:mr-[5px] before:content-[''] before:bg-no-repeat before:bg-[url('/im/add_group.svg')]"
          datatype="addGroup"
          onClick={handleCreateFriendGroupBtnClick}
        >
          {t('create-friend-group')}
        </div>
        <div
          className="flex items-center justify-center px-[20px] py-[4px] text-text-color-quaternary text-left cursor-pointer bg-background border border-border rounded-[5px] hover:bg-hover before:min-w-[16px] before:min-h-[16px] before:mr-[5px] before:content-[''] before:bg-no-repeat before:bg-[url('/im/add_friend.svg')]"
          datatype="addFriend"
          onClick={handleAddFriendBtnClick}
        >
          {t('add-friend')}
        </div>
      </div>
    </>
  );
});

FriendPageSidebar.displayName = 'FriendPageSidebar';

export default FriendPageSidebar;
