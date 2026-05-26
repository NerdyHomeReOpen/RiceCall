import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import { ANNOUNCEMENT_SLIDE_INTERVAL } from '@/constants';

import { useAppSelector } from '@/hooks/useStore';

import ServerList from './ServerList';

import styles from './Home.module.css';

interface HomePageContentProps {
  onAnnouncementSelect: (announcement: Types.Announcement) => void;
}

const HomePageContent: React.FC<HomePageContentProps> = React.memo(({ onAnnouncementSelect }) => {
  const { t } = useTranslation();

  const bannerContainerRef = useRef<HTMLDivElement>(null);
  const annSlideIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const announcements = useAppSelector((state) => state.announcements.data, shallowEqual);
  const recommendServers = useAppSelector((state) => state.recommendServers.data, shallowEqual);

  const [selectedAnnIndex, setSelectedAnnIndex] = useState<number>(0);

  const sortedAnns = [...announcements].sort((a, b) => b.timestamp - a.timestamp);
  const filteredRecommendServers = recommendServers.filter((server) => !server.tags.includes('official'));
  const filteredOfficialServers = recommendServers.filter((server) => server.tags.includes('official'));

  const handleNextAnnBtnClick = () => {
    setSelectedAnnIndex((prev) => (prev + 1) % sortedAnns.length);
  };

  const handlePrevAnnBtnClick = () => {
    setSelectedAnnIndex((prev) => (prev === 0 ? sortedAnns.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (!bannerContainerRef.current) return;

    const number = selectedAnnIndex % sortedAnns.length;
    const width = bannerContainerRef.current.clientWidth;

    bannerContainerRef.current.scrollTo({
      left: width * number,
      behavior: 'smooth',
    });
  }, [selectedAnnIndex, sortedAnns]);

  useEffect(() => {
    if (annSlideIntervalRef.current) {
      clearInterval(annSlideIntervalRef.current);
    }

    annSlideIntervalRef.current = setInterval(() => {
      setSelectedAnnIndex((prev) => (prev + 1) % sortedAnns.length);
    }, ANNOUNCEMENT_SLIDE_INTERVAL);

    return () => {
      if (annSlideIntervalRef.current) {
        clearInterval(annSlideIntervalRef.current);
      }

      annSlideIntervalRef.current = null;
    };
  }, [sortedAnns]);

  return (
    <>
      <div className={styles['banner-wrapper']}>
        <div className={styles['banner-container']}>
          <div ref={bannerContainerRef} className={styles['banner-list']}>
            {sortedAnns.length > 0 ? (
              sortedAnns.map((ann) =>
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
          {sortedAnns.length > 0 && (
            <>
              <div className={styles['number-list']}>
                {sortedAnns.map((_, index) => (
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
