import React, { useEffect, useState } from 'react';
import { shallowEqual } from 'react-redux';

import { useAppSelector } from '@/hooks/useStore';

import MarkdownContent from '@/components/MarkdownContent';

import styles from './NotificationToaster.module.css';

const NotificationToaster: React.FC = React.memo(() => {
  const notifications = useAppSelector((state) => state.notifications.data, shallowEqual);

  const [show, setShow] = useState<boolean>(false);
  const [closedNotificationIds, setClosedNotificationIds] = useState<Set<number>>(new Set());
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState<number>(0);

  const filteredNotifications = notifications.filter((notification) => !closedNotificationIds.has(notification.notificationId));
  const currentNotification = filteredNotifications[currentNotificationIndex];
  const currentNotificationContent = currentNotification?.content ?? '';

  const handleClose = () => {
    const notificationId = currentNotification?.notificationId ?? 0;

    setClosedNotificationIds((prev) => prev.add(notificationId));
    setShow(false);

    setTimeout(() => {
      if (currentNotificationIndex === 0) return;
      setCurrentNotificationIndex((prev) => Math.max(0, prev - 1));
      setShow(true);
    }, 2000);
  };

  useEffect(() => {
    if (filteredNotifications.length === 0) return;
    setCurrentNotificationIndex(filteredNotifications.length - 1);
    setShow(true);
  }, [filteredNotifications]);

  return (
    <div className={`${styles['toaster']} ${show ? styles['show'] : ''}`}>
      <MarkdownContent markdownText={currentNotificationContent} canSelect={false} />
      <div className={styles['close-button']} onClick={handleClose} />
    </div>
  );
});

NotificationToaster.displayName = 'NotificationToaster';

export default NotificationToaster;
