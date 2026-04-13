import React, { useState } from 'react';
import { shallowEqual } from 'react-redux';

import type * as Types from '@/types';

import { useAppDispatch, useAppSelector } from '@/hooks/Store';

import { setSelectedItemId } from '@/store/slices/UI';

import ChannelTab from './ChannelTab';

import styles from './EditChannelOrder.module.css';

interface CategoryTabProps {
  channels: (Types.Channel | Types.Category)[];
  category: Types.Category;
  onSelect: (channel: Types.Channel | Types.Category) => void;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(({ channels, category, onSelect }) => {
  const dispatch = useAppDispatch();

  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `category-${category.channelId}`, shallowEqual);

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const categoryChildren = channels?.filter((c) => c.categoryId === category.channelId);

  const handleTabClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) dispatch(setSelectedItemId(null));
    else dispatch(setSelectedItemId(`category-${category.channelId}`));
    onSelect(category);
  };

  const handleTabExpandedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div key={category.channelId}>
      <div className={`${styles['channel-tab']} ${isSelected ? styles['selected'] : ''}`} onClick={handleTabClick}>
        <div
          className={`${styles['channel-tab-icon']} ${isExpanded ? styles['expanded'] : ''} ${styles[category.visibility]} ${category.isLobby ? styles['lobby'] : ''}`}
          onClick={handleTabExpandedClick}
        />
        <div className={styles['channel-tab-label']} style={{ display: 'inline-flex' }}>
          {category.name}
          <div className={styles['channel-tab-index-text']}>{`(${category.order})`}</div>
        </div>
      </div>
      <div className={styles['channel-list']} style={isExpanded ? {} : { display: 'none' }}>
        {categoryChildren
          .sort((a, b) => a.order - b.order)
          .filter((c) => c.type === 'channel')
          .map((c) => (
            <ChannelTab key={c.channelId} channel={c} onSelect={onSelect} />
          ))}
      </div>
    </div>
  );
});

CategoryTab.displayName = 'CategoryTab';

export default CategoryTab;
