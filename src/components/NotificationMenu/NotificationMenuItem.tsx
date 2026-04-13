import React from 'react';
import Image from 'next/image';

import type * as Types from '@/types';

import styles from './NotificationMenu.module.css';

interface NotificationMenuItemProps {
  item: Types.NotificationMenuItem;
  onClose: () => void;
}

const NotificationMenuItem: React.FC<NotificationMenuItemProps> = React.memo(({ item, onClose }) => {
  const handleClick = () => {
    if (item.disabled) return;
    item.onClick?.();
    onClose();
  };

  return (
    <>
      <div className={`${styles['notification-menu-option']} ${item.className && styles[item.className]} ${item.disabled ? 'disabled' : ''}`} data-type={item.icon || ''} onClick={handleClick}>
        {item.showContentLength ? `${item.label} (${item.contents ? item.contents.length : 0})` : item.label}
      </div>
      {item.showContent && item.contents && (
        <div className={styles['notification-menu-contents']}>
          {item.contents
            .slice(0, 3)
            .map((content, index) => (item.contentType === 'image' ? <Image key={index} src={content} alt={content} width={32} height={32} loading="lazy" draggable="false" /> : content))}
          {item.contents.length > 3 && <span>...({item.contents.length - 3})</span>}
        </div>
      )}
    </>
  );
});

NotificationMenuItem.displayName = 'NotificationMenuItem';

export default NotificationMenuItem;
