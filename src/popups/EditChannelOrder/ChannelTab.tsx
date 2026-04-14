import React, { useState } from 'react';
import { shallowEqual } from 'react-redux';

import type * as Types from '@/types';

import * as Store from '@/store';

import { useAppDispatch, useAppSelector } from '@/hooks/Store';

import styles from './EditChannelOrder.module.css';

interface ChannelTabProps {
  channel: Types.Channel;
  onSelect: (channel: Types.Channel) => void;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(({ channel, onSelect }) => {
  const dispatch = useAppDispatch();

  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `channel-${channel.channelId}`, shallowEqual);

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleTabClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) dispatch(Store.setSelectedItemId(null));
    else dispatch(Store.setSelectedItemId(`channel-${channel.channelId}`));
    onSelect(channel);
  };

  const handleTabExpandedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`${styles['channel-tab']} ${isSelected ? styles['selected'] : ''}`} onClick={handleTabClick}>
      <div
        className={`${styles['channel-tab-icon']} ${isExpanded ? styles['expanded'] : ''} ${styles[channel.visibility]} ${channel.isLobby ? styles['lobby'] : ''}`}
        onClick={handleTabExpandedClick}
      />
      <div className={styles['channel-tab-label']} style={{ display: 'inline-flex' }}>
        {channel.name}
        <div className={styles['channel-tab-index-text']}>{`(${channel.order})`}</div>
      </div>
    </div>
  );
});

ChannelTab.displayName = 'ChannelTab';

export default ChannelTab;
