/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import styles from '@/styles/notification.module.css';

const NotificationPageComponent: React.FC = React.memo(() => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [id, setId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('RiceCall');
  const [initialData, setInitialData] = useState<any | null>(null);

  const close = () => {
    ipc.window.close();
  };

  // Effects
  useEffect(() => {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id') as string;
      setId(id || null);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    setInitialData(ipc.notification.get(id));
  }, [id]);

  return (
    <div className={`${styles['wrapper']}`}>
      <div className={styles['header']}>
        <div className={styles['title-wrapper']}>
          <div className={styles['icon']} />
          <div className={styles['title']}>{title}</div>
        </div>
        <div className={styles['close-button']} onClick={close} />
      </div>
      <div className={styles['content']}>Hello World</div>
    </div>
  );
});

NotificationPageComponent.displayName = 'NotificationPageComponent';

const NotificationPage = dynamic(() => Promise.resolve(NotificationPageComponent), { ssr: false });

export default NotificationPage;
