import React from 'react';
import { shallowEqual } from 'react-redux';

import type * as Types from '@/types';

import * as Store from '@/store';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';

interface ChannelTabProps {
  channel: Types.Channel;
  onSelect: (channel: Types.Channel) => void;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(({ channel, onSelect }) => {
  const dispatch = useAppDispatch();

  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `channel-${channel.channelId}`, shallowEqual);

  const handleTabClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) dispatch(Store.setSelectedItemId(null));
    else dispatch(Store.setSelectedItemId(`channel-${channel.channelId}`));
    onSelect(channel);
  };

  return (
    <div className={`relative flex gap-[2px] items-center h-[25px] py-[2px] pr-[20px] pl-[10px] mr-[5px] hover:bg-hover ${isSelected ? 'bg-selected' : ''}`} onClick={handleTabClick}>
      <div
        className={`inline-block min-w-[14px] min-h-[14px] cursor-pointer bg-[url('/channel/channelIcon.svg')] bg-no-repeat bg-auto ${channel.isLobby ? 'bg-position-[-56px_-14px]' : { public: 'bg-position-[-14px_0]', member: 'bg-position-[-14px_-14px]', private: 'bg-position-[-28px_-14px]', readonly: 'bg-position-[-42px_-14px]' }[channel.visibility]}`}
      />
      <div className="overflow-hidden text-ellipsis text-text-color-secondary whitespace-nowrap" style={{ display: 'inline-flex' }}>
        {channel.name}
        <div className="ml-[5px] text-[rgb(255_0_0)]">{`(${channel.order})`}</div>
      </div>
    </div>
  );
});

ChannelTab.displayName = 'ChannelTab';

export default ChannelTab;
