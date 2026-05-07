import React from 'react';

import { leaveServer } from '@/services';

import styles from './Header.module.css';

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
    <div key={`tabs-${tab.id}`} data-tab-id={tab.id} className={`${styles['main-tab']} ${isSelected ? styles['selected'] : ''}`} onClick={handleTabClick}>
      <div className={styles['main-tab-label']}>{tab.label}</div>
      <div className={styles['main-tab-background']} />
      {tab.id === 'server' && (
        <svg className={styles['main-tab-close-button']} onClick={handleCloseButtonClick} xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="12" fill="var(--main-color, rgb(55 144 206))" />
          <path d="M17 7L7 17M7 7l10 10" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
});

MainTabItem.displayName = 'MainTabItem';

export default MainTabItem;
