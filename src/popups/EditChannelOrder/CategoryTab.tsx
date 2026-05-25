import React from 'react';

import * as Types from '@/types';

import * as Store from '@/store';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';

import ChannelTab from './ChannelTab';

import styles from './EditChannelOrder.module.css';

interface CategoryTabProps {
  channels: (Types.Channel | Types.Category)[];
  category: Types.Category;
  onSelect: (channel: Types.Channel | Types.Category) => void;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(({ channels, category, onSelect }) => {
  const dispatch = useAppDispatch();

  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `category-${category.channelId}`);

  const categoryChildren = channels?.filter((c) => c.categoryId === category.channelId);

  const handleTabClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) dispatch(Store.setSelectedItemId(null));
    else dispatch(Store.setSelectedItemId(`category-${category.channelId}`));
    onSelect(category);
  };

  return (
    <>
      <div className={`${styles['channel-item']} ${isSelected ? styles['selected'] : ''}`} onClick={handleTabClick}>
        <div className={`${styles['channel-icon']} ${styles['expanded']} ${styles[category.visibility]} ${category.isLobby ? styles['lobby'] : ''}`} />
        <div className={styles['channel-label']} style={{ display: 'inline-flex' }}>
          {category.name}
          <div className={styles['channel-index-text']}>{`(${category.order})`}</div>
        </div>
      </div>
      <div className={styles['channel-list']}>
        {categoryChildren
          .sort((a, b) => a.order - b.order)
          .filter((c) => c.type === 'channel')
          .map((c) => (
            <ChannelTab key={c.channelId} channel={c} onSelect={onSelect} />
          ))}
      </div>
    </>
  );
});

CategoryTab.displayName = 'CategoryTab';

export default CategoryTab;
