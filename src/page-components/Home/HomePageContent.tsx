import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import { ANNOUNCEMENT_SLIDE_INTERVAL } from '@/constants';

import { useAppSelector } from '@/hooks/useStore';

import ServerList from './ServerList';

import styles from './Home.module.css';

interface HomePageContentProps {
  onAnnouncementSelect: (announcement: Types.Announcement) => void;
}

const HomePageContent: React.FC<HomePageContentProps> = React.memo(({ onAnnouncementSelect }) => {
  const { t } = useTranslation();

  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const announcements = useAppSelector((state) => state.announcements.data, shallowEqual);
  const recommendServers = useAppSelector((state) => state.recommendServers.data, shallowEqual);

  const [selectedAnnIndex, setSelectedAnnIndex] = useState<number>(0);

  const sortedAnnouncements = [...announcements].sort((a, b) => b.timestamp - a.timestamp);
  const filteredRecommendServers = recommendServers.filter((server) => !server.tags.includes('official'));
  const filteredOfficialServers = recommendServers.filter((server) => server.tags.includes('official'));

  const handleNextAnnBtnClick = () => {
    setSelectedAnnIndex((prev) => (prev + 1) % sortedAnnouncements.length);
  };

  const handlePrevAnnBtnClick = () => {
    setSelectedAnnIndex((prev) => (prev === 0 ? sortedAnnouncements.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const number = selectedAnnIndex % sortedAnnouncements.length;
    const width = containerRef.current.clientWidth;
    containerRef.current.scrollTo({
      left: width * number,
      behavior: 'smooth',
    });
  }, [selectedAnnIndex, sortedAnnouncements]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setSelectedAnnIndex((prev) => (prev + 1) % sortedAnnouncements.length), ANNOUNCEMENT_SLIDE_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [sortedAnnouncements]);

  return (
    <>
      <div className={styles['banner-wrapper']}>
        <div className={styles['banner-container']}>
          <div ref={containerRef} className={styles['banner-list']}>
            {sortedAnnouncements.length > 0 ? (
              sortedAnnouncements.map((ann) =>
                ann.attachmentUrl ? (
                  <div key={ann.announcementId} className={styles['banner']} onClick={() => onAnnouncementSelect(ann)}>
                    <Image src={ann.attachmentUrl} alt="announcement_attachment" width={100} height={100} loading="lazy" draggable="false" />
                  </div>
                ) : (
                  <div key={ann.announcementId} className={styles['banner']} onClick={() => onAnnouncementSelect(ann)}>
                    <Image loading="lazy" src="/ricecall_logo.svg" alt="ricecall logo" height={80} width={-1} />
                    <span>{ann.title}</span>
                  </div>
                ),
              )
            ) : (
              <div className={styles['banner']}>
                <Image loading="lazy" src="/ricecall_logo.svg" alt="ricecall logo" height={80} width={-1} />
              </div>
            )}
          </div>
          {sortedAnnouncements.length > 0 && (
            <>
              <div className={styles['number-list']}>
                {sortedAnnouncements.map((_, index) => (
                  <nav key={index} className={`${index === selectedAnnIndex ? styles['active'] : ''}`} onClick={() => setSelectedAnnIndex(index)} />
                ))}
              </div>
              <nav className={`${styles['nav']} ${styles['prev-button']}`} onClick={handlePrevAnnBtnClick}>
                {'◀'}
              </nav>
              <nav className={`${styles['nav']} ${styles['next-button']}`} onClick={handleNextAnnBtnClick}>
                {'▶'}
              </nav>
            </>
          )}
        </div>
      </div>
      <div className={styles['wrapper']}>
        <ServerList title={t('recommend-server')} servers={filteredRecommendServers} />
      </div>
      <div className={styles['wrapper']}>
        <ServerList title={t('official-server')} servers={filteredOfficialServers} />
      </div>
    </>
  );
});

HomePageContent.displayName = 'HomePageContent';

export default HomePageContent;
