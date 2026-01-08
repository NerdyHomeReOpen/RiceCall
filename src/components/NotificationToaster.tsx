import React, { useEffect, useMemo, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useAppSelector } from '@/store/hook';

import MarkdownContent from '@/components/MarkdownContent';

import styles from '@/styles/notificationToaster.module.css';

const NotificationToaster: React.FC = React.memo(() => {
  // Selectors
  const notifications = useAppSelector((state) => state.notifications.data, shallowEqual);

  // States
  const [show, setShow] = useState(false);
  const [closedNotificationIds, setClosedNotificationIds] = useState<Set<number>>(new Set());
  const [showNotificationIndex, setShowNotificationIndex] = useState<number>(0);

  // Variables
  const filteredNotifications = useMemo(() => notifications.filter((notification) => !closedNotificationIds.has(notification.notificationId)), [notifications, closedNotificationIds]);

  // Handlers
  const handleCloseBtnClick = () => {
    const notificationId = filteredNotifications[showNotificationIndex]?.notificationId ?? 0;
    setClosedNotificationIds((prev) => prev.add(notificationId));
    setShow(false);
    setTimeout(() => {
      if (showNotificationIndex === 0) return;
      setShowNotificationIndex((prev) => Math.max(0, prev - 1));
      setShow(true);
    }, 2000);
  };

  // Effects
  useEffect(() => {
    if (filteredNotifications.length > 0) {
      setShowNotificationIndex(filteredNotifications.length - 1);
      setShow(true);
    }
  }, [filteredNotifications]);

  return (
    <div className={`${styles['notification-toaster']} ${show ? styles['show'] : ''}`}>
      <MarkdownContent markdownText={filteredNotifications[showNotificationIndex]?.content ?? ''} selectable={false} />
      <div className={styles['notification-toaster-close']} onClick={handleCloseBtnClick} />
    </div>
  );
});

NotificationToaster.displayName = 'NotificationToaster';

export default NotificationToaster;
