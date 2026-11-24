import React from 'react';

import { leaveServer } from '@/services';

interface TabType {
  id: 'home' | 'friends' | 'server';
  label: string;
}

interface MainTabItemProps {
  tab: TabType;
  currentServerId: string | null;
  isSelected: boolean;
  onTabSelect: (tabId: 'home' | 'friends' | 'server') => void;
}

const MainTabItem = React.memo(({ tab, currentServerId, isSelected, onTabSelect }: MainTabItemProps) => {
  const handleTabClick = () => {
    onTabSelect(tab.id);
  };

  const handleCloseButtonClick = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    if (!currentServerId) return;
    leaveServer(currentServerId);
  };

  if (tab.id === 'server' && !currentServerId) return null;

  return (
    <div
      key={`tabs-${tab.id}`}
      data-tab-id={tab.id}
      className={`relative flex items-center justify-center w-max max-w-[200px] h-[30px] px-[13px] overflow-hidden text-[1.06rem] whitespace-nowrap [-webkit-app-region:no-drag] cursor-pointer before:absolute before:top-0 before:left-0 before:z-2 before:min-w-[10px] before:min-h-[31px] before:content-[''] before:bg-[url('/tab_item_mainframe.svg')] before:bg-no-repeat after:absolute after:top-0 after:right-0 after:z-2 after:min-w-[10px] after:min-h-[31px] after:content-[''] after:bg-[url('/tab_item_mainframe.svg')] after:bg-no-repeat ${isSelected ? 'before:bg-position-[0_-32px] after:bg-position-[-11px_-32px]' : 'before:bg-position-[0_0] after:bg-position-[0_0]'}`}
      onClick={handleTabClick}
    >
      <div className={`z-1 w-full mx-[20px] truncate text-center ${isSelected ? 'text-main-color' : 'text-secondary-color'}`}>{tab.label}</div>
      <div className={`absolute bottom-0 left-[10px] w-[calc(100%-20px)] h-[30px] overflow-hidden ${isSelected ? 'bg-background' : ''}`} />
      {tab.id === 'server' && (
        <svg
          className={`relative z-2 flex items-center justify-center min-w-[12px] min-h-[12px] cursor-pointer bg-[rgb(55_144_206)] rounded-[50%] shadow-[0_0_2px_rgb(255_255_255/35%)] ${isSelected ? 'text-main-color' : ''}`}
          onClick={handleCloseButtonClick}
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="12" fill="var(--main-color, rgb(55 144 206))" />
          <path d="M17 7L7 17M7 7l10 10" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
});

MainTabItem.displayName = 'MainTabItem';

export default MainTabItem;
