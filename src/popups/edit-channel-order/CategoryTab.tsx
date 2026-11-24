import React from 'react';
import { shallowEqual } from 'react-redux';

import type * as Types from '@/types';

import * as Store from '@/store';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';

import ChannelTab from './ChannelTab';

interface CategoryTabProps {
  channels: (Types.Channel | Types.Category)[];
  category: Types.Category;
  onSelect: (channel: Types.Channel | Types.Category) => void;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(({ channels, category, onSelect }) => {
  const dispatch = useAppDispatch();

  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `category-${category.channelId}`, shallowEqual);

  const categoryChildren = channels?.filter((c) => c.categoryId === category.channelId);

  const handleTabClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) dispatch(Store.setSelectedItemId(null));
    else dispatch(Store.setSelectedItemId(`category-${category.channelId}`));
    onSelect(category);
  };

  return (
    <>
      <div className={`relative flex gap-[2px] items-center h-[25px] py-[2px] pr-[20px] pl-[10px] mr-[5px] hover:bg-hover ${isSelected ? 'bg-selected' : ''}`} onClick={handleTabClick}>
        <div
          className={`inline-block min-w-[14px] min-h-[14px] cursor-pointer bg-[url('/channel/channelIcon.svg')] bg-no-repeat bg-auto ${category.isLobby ? 'bg-position-[-56px_-14px]' : { public: 'bg-position-[-14px_0]', member: 'bg-position-[-14px_-14px]', private: 'bg-position-[-28px_-14px]', readonly: 'bg-position-[-42px_-14px]' }[category.visibility]}`}
        />
        <div className="overflow-hidden text-ellipsis text-text-color-secondary whitespace-nowrap" style={{ display: 'inline-flex' }}>
          {category.name}
          <div className="ml-[5px] text-[rgb(255_0_0)]">{`(${category.order})`}</div>
        </div>
      </div>
      <div className="flex flex-col *:pl-[25px]">
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
