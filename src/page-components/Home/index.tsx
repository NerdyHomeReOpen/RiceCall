import dynamic from 'next/dynamic';
import Image from 'next/image';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import { openCreateServer } from '@/services';

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

  const [selectedSection, setSelectedSection] = useState<'home' | 'personal-exclusive'>('home');
  const [selectedAnn, setSelectedAnn] = useState<Types.Announcement | null>(null);

  const homeSectionIsSelected = selectedSection === 'home';
  const personalExclusiveSectionIsSelected = selectedSection === 'personal-exclusive';

  const handleCreateServerClick = () => {
    openCreateServer();
  };

  const handlePersonalExclusiveSectionBtnClick = () => {
    setSelectedSection('personal-exclusive');
  };

  const handleHomeSectionBtnClick = () => {
    setSelectedSection('home');
  };

  const handleBackBtnClick = () => {
    setSelectedSection('home');
  };

  const handleAnnouncementSelect = (announcement: Types.Announcement) => {
    setSelectedAnn(announcement);
  };

  return (
    <main className={styles['page']} style={display ? {} : { display: 'none' }}>
      <div className={styles['announcement-detail-wrapper']} style={selectedAnn ? {} : { display: 'none' }} onClick={() => setSelectedAnn(null)}>
        {selectedAnn && (
          <div className={styles['announcement-detail-container']} onClick={(e) => e.stopPropagation()}>
            <div className={styles['announcement-detail-header']}>
              <div className={styles['announcement-type']} data-category={selectedAnn.category}>
                {t(`${selectedAnn.category}`)}
              </div>
              <div className={styles['announcement-detail-title']}>{selectedAnn.title}</div>
              <div className={styles['announcement-detail-date']}>{getFormatDate(selectedAnn.timestamp)}</div>
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
      <header className={styles['header']}>
        <HomePageHeader
          homeSectionIsSelected={homeSectionIsSelected}
          personalExclusiveSectionIsSelected={personalExclusiveSectionIsSelected}
          onHomeSectionBtnClick={handleHomeSectionBtnClick}
          onCreateServerBtnClick={handleCreateServerClick}
          onPersonalExclusiveSectionBtnClick={handlePersonalExclusiveSectionBtnClick}
          onBackBtnClick={handleBackBtnClick}
        />
      </header>
      <main className={styles['body']}>
        <main className={styles['content']} style={homeSectionIsSelected ? {} : { display: 'none' }}>
          <HomePageContent onAnnouncementSelect={handleAnnouncementSelect} />
        </main>
        <main className={styles['content']} style={personalExclusiveSectionIsSelected ? {} : { display: 'none' }}>
          <HomePagePersonalExclusive />
        </main>
        <main className={styles['content']} style={!homeSectionIsSelected && !personalExclusiveSectionIsSelected ? {} : { display: 'none' }}>
          <HomePageNotAvailable />
        </main>
      </main>
    </main>
  );
});

HomePageComponent.displayName = 'HomePageComponent';

const HomePage = dynamic(() => Promise.resolve(HomePageComponent), { ssr: false });

export default HomePage;
