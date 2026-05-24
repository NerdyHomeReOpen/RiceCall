import React from 'react';
import { shallowEqual } from 'react-redux';

import type * as Types from '@/types';

import * as Store from '@/store';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';

import styles from './EditChannelOrder.module.css';

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
    <div className={`${styles['channel-item']} ${isSelected ? styles['selected'] : ''}`} onClick={handleTabClick}>
      <div className={`${styles['channel-icon']} ${styles['expanded']} ${styles[channel.visibility]} ${channel.isLobby ? styles['lobby'] : ''}`} />
      <div className={styles['channel-label']} style={{ display: 'inline-flex' }}>
        {channel.name}
        <div className={styles['channel-index-text']}>{`(${channel.order})`}</div>
      </div>
    </div>
  );
});

ChannelTab.displayName = 'ChannelTab';

export default ChannelTab;
