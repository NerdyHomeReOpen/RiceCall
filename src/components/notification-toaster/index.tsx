import React, { useEffect, useState } from 'react';
import { shallowEqual } from 'react-redux';

import { useAppSelector } from '@/hooks/useStore';

import MarkdownContent from '@/components/markdown-content';

import styles from './notification-toaster.module.css';

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
    <div className={`${styles['toaster']} ${isVisible ? styles['show'] : ''}`}>
      <MarkdownContent markdownText={filteredNotifications[showNotificationIndex]?.content ?? ''} selectable={false} />
      <div className={styles['close-button']} onClick={handleCloseBtnClick} />
    </div>
  );
});

NotificationToaster.displayName = 'NotificationToaster';

export default NotificationToaster;
