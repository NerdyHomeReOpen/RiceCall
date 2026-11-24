import React from 'react';
import Image from 'next/image';

import type * as Types from '@/types';

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
      <div
        className={`relative flex flex-col gap-[6px] items-start justify-start w-full px-[30px] py-[6px] text-text-color rounded-[3px] before:absolute before:left-[6px] before:self-center before:min-w-[16px] before:min-h-[16px] before:mr-[5px] before:content-[''] before:bg-no-repeat before:bg-center before:bg-auto data-[type=notification]:before:bg-[url('/icon_notice_friend.svg')] ${item.className === 'readonly' ? '' : 'hover:cursor-pointer hover:bg-hover'} ${item.disabled ? 'disabled' : ''}`}
        data-type={item.icon || ''}
        onClick={handleClick}
      >
        {item.showContentLength ? `${item.label} (${item.contents ? item.contents.length : 0})` : item.label}
      </div>
      {item.showContent && item.contents && (
        <div className="flex flex-row gap-[5px] items-center justify-start w-full px-[30px] py-[3px]">
          {item.contents
            .slice(0, 3)
            .map((content, index) => (item.contentType === 'image' ? <Image key={index} src={content} alt="notification_image" width={32} height={32} loading="lazy" draggable="false" /> : content))}
          {item.contents.length > 3 && <span className="my-[5px]">...({item.contents.length - 3})</span>}
        </div>
      )}
    </>
  );
});

NotificationMenuItem.displayName = 'NotificationMenuItem';

export default NotificationMenuItem;
