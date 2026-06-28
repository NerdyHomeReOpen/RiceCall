import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { shallowEqual } from 'react-redux';

import { useAppSelector } from '@/hooks/useStore';

import MarkdownContent from '@/components/MarkdownContent';

import styles from './NotificationToaster.module.css';

const NotificationToaster: React.FC = React.memo(() => {
  const notifications = useAppSelector((state) => state.notifications.data, shallowEqual);

  const [closedIds, setClosedIds] = useState<Set<number>>(new Set());
  const [isDisplayed, setIsDisplayed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredNotifications = useMemo(() => notifications.filter((n) => !closedIds.has(n.notificationId)), [notifications, closedIds]);

  const currentNotification = filteredNotifications[currentIndex] ?? null;

  useEffect(() => {
    if (filteredNotifications.length === 0) {
      setIsDisplayed(false);
      return;
    }

    setCurrentIndex(filteredNotifications.length - 1);
    setIsDisplayed(true);
  }, [filteredNotifications]);

  const handleClose = useCallback(() => {
    if (!currentNotification) return;

    setClosedIds((prev) => new Set(prev).add(currentNotification.notificationId));
    setIsDisplayed(false);
  }, [currentNotification]);

  return (
    <div className={`${styles['toaster']} ${isDisplayed ? styles['displayed'] : ''}`}>
      <MarkdownContent markdownText={currentNotification?.content ?? ''} canSelect={false} />
      <div className={styles['close-button']} onClick={handleClose} />
    </div>
  );
});

NotificationToaster.displayName = 'NotificationToaster';

export default NotificationToaster;
