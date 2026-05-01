import dynamic from 'next/dynamic';
import Image from 'next/image';
import React, { useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import * as Actions from '@/action';

import { useAppSelector } from '@/hooks/Store';

import HomePageHeader from './HomePageHeader';
import HomePageContent from './HomePageContent';
import HomePagePersonalExclusive from './HomePagePersonalExclusive';
import HomePageNotAvailable from './HomePageNotAvailable';
import MarkdownContent from '@/components/MarkdownContent';

import { getFormatDate } from '@/utils/language';

import styles from './Home.module.css';

interface HomePageProps {
  display: boolean;
}

const HomePageComponent: React.FC<HomePageProps> = React.memo(({ display }) => {
  const { t } = useTranslation();

  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      currentServerId: state.user.data.currentServerId,
    }),
    shallowEqual,
  );

  const [section, setSection] = useState<'home' | 'personal-exclusive'>('home');
  const [selectedAnn, setSelectedAnn] = useState<Types.Announcement | null>(null);

  const isHomeSection = section === 'home';
  const isPersonalExclusiveSection = section === 'personal-exclusive';

  const handleCreateServerClick = () => {
    Actions.openCreateServer(user.userId);
  };

  const handlePersonalExclusiveSectionBtnClick = () => {
    setSection('personal-exclusive');
  };

  const handleHomeSectionBtnClick = () => {
    setSection('home');
  };

  const handleBackBtnClick = () => {
    setSection('home');
  };

  const handleAnnouncementSelect = (announcement: Types.Announcement) => {
    setSelectedAnn(announcement);
  };

  return (
    <main className={styles['home-page']} style={display ? {} : { display: 'none' }}>
      <div className={styles['announcement-detail-wrapper']} style={selectedAnn ? {} : { display: 'none' }} onClick={() => setSelectedAnn(null)}>
        {selectedAnn && (
          <div className={styles['announcement-detail-container']} onClick={(e) => e.stopPropagation()}>
            <div className={styles['announcement-detail-header']}>
              <div className={styles['announcement-type']} data-category={selectedAnn.category}>
                {t(`${selectedAnn.category}`)}
              </div>
              <div className={styles['announcement-detail-title']}>{selectedAnn.title}</div>
              <div className={styles['announcement-datail-date']}>{getFormatDate(selectedAnn.timestamp)}</div>
            </div>
            {selectedAnn.attachmentUrl && (
              <div className={styles['banner']}>
                <Image src={selectedAnn.attachmentUrl} alt="announcement" width={-1} height={-1} loading="lazy" draggable="false" />
              </div>
            )}
            <div className={styles['announcement-detail-content']}>
              <MarkdownContent markdownText={selectedAnn.content} />
            </div>
          </div>
        )}
      </div>
      <header className={styles['home-page-header']}>
        <HomePageHeader
          isHomeSection={isHomeSection}
          isPersonalExclusiveSection={isPersonalExclusiveSection}
          onHomeSectionBtnClick={handleHomeSectionBtnClick}
          onCreateServerBtnClick={handleCreateServerClick}
          onPersonalExclusiveSectionBtnClick={handlePersonalExclusiveSectionBtnClick}
          onBackBtnClick={handleBackBtnClick}
        />
      </header>
      <main className={styles['home-page-body']}>
        <main className={styles['home-page-content']} style={isHomeSection ? {} : { display: 'none' }}>
          <HomePageContent onAnnouncementSelect={handleAnnouncementSelect} />
        </main>
        <main className={styles['home-page-content']} style={isPersonalExclusiveSection ? {} : { display: 'none' }}>
          <HomePagePersonalExclusive />
        </main>
        <main className={styles['home-page-content']} style={!isHomeSection && !isPersonalExclusiveSection ? {} : { display: 'none' }}>
          <HomePageNotAvailable />
        </main>
      </main>
    </main>
  );
});

HomePageComponent.displayName = 'HomePageComponent';

const HomePage = dynamic(() => Promise.resolve(HomePageComponent), { ssr: false });

export default HomePage;
