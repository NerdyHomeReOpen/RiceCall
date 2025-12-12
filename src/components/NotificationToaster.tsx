import React, { useEffect, useMemo, useState } from 'react';

// Types
import type { Notification } from '@/types';

// CSS
import styles from '@/styles/notificationToaster.module.css';

// Components
import MarkdownContent from '@/components/MarkdownContent';

interface NotificationToasterProps {
  notifications: Notification[];
}

const NotificationToaster: React.FC<NotificationToasterProps> = React.memo(({ notifications }) => {
  // States
  const [show, setShow] = useState(false);
  const [closedNotificationIds, setClosedNotificationIds] = useState<Set<Notification['notificationId']>>(new Set());
  const [showNotificationIndex, setShowNotificationIndex] = useState<number>(0);

  // Variables
  const filteredNotifications = useMemo(() => notifications.filter((notification) => !closedNotificationIds.has(notification.notificationId)), [notifications, closedNotificationIds]);

  // Handlers
  const handleClose = (notificationId: Notification['notificationId']) => {
    setClosedNotificationIds((prev) => prev.add(notificationId));
    setShow(false);
    setTimeout(() => {
      if (showNotificationIndex === 0) return;
      setShowNotificationIndex((prev) => prev - 1);
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
      <div className={styles['notification-toaster-close']} onClick={() => handleClose(filteredNotifications[showNotificationIndex]?.notificationId ?? 0)}></div>
    </div>
  );
});

NotificationToaster.displayName = 'NotificationToaster';

export default NotificationToaster;
