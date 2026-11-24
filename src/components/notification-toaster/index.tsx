import React, { useEffect, useState } from 'react';
import { shallowEqual } from 'react-redux';

import { useAppSelector } from '@/hooks/useStore';

import MarkdownContent from '@/components/markdown-content';

const NotificationToaster: React.FC = React.memo(() => {
  const notifications = useAppSelector((state) => state.notifications.data, shallowEqual);
  const [isVisible, setIsVisible] = useState(false);
  const [closedNotificationIds, setClosedNotificationIds] = useState<Set<number>>(new Set());
  const [showNotificationIndex, setShowNotificationIndex] = useState<number>(0);
  const filteredNotifications = notifications.filter((notification) => !closedNotificationIds.has(notification.notificationId));

  const handleCloseBtnClick = () => {
    const notificationId = filteredNotifications[showNotificationIndex]?.notificationId ?? 0;
    setClosedNotificationIds((prev) => prev.add(notificationId));
    setIsVisible(false);

    setTimeout(() => {
      if (showNotificationIndex === 0) return;
      setShowNotificationIndex((prev) => Math.max(0, prev - 1));
      setIsVisible(true);
    }, 2000);
  };

  useEffect(() => {
    if (filteredNotifications.length > 0) {
      setShowNotificationIndex(filteredNotifications.length - 1);
      setIsVisible(true);
    }
  }, [filteredNotifications]);

  return (
    <div
      className={`absolute right-0 bottom-0 z-10000 flex flex-row gap-[3px] justify-center max-w-full min-h-[25px] p-[3px] m-[10px] bg-notification-toaster-background border-[1.5px] border-notification-toaster-border rounded-[2px] transition-transform duration-1000 ease-linear ${isVisible ? 'transform-[translateY(0)]' : 'transform-[translateY(calc(100%+10px))]'}`}
    >
      <MarkdownContent markdownText={filteredNotifications[showNotificationIndex]?.content ?? ''} isSelectable={false} />
      <div
        className="w-[18px] min-w-[18px] h-[18px] min-h-[18px] cursor-pointer bg-[url('/loading_close.svg')] bg-position-[0_0] bg-cover hover:bg-position-[-18px_0] active:bg-position-[-36px_0]"
        onClick={handleCloseBtnClick}
      />
    </div>
  );
});

NotificationToaster.displayName = 'NotificationToaster';

export default NotificationToaster;
