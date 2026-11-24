import dynamic from 'next/dynamic';
import Image from 'next/image';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import { openCreateServer } from '@/services';

import HomePageHeader from './HomePageHeader';
import HomePageContent from './HomePageContent';
import HomePagePersonalExclusive from './HomePagePersonalExclusive';
import HomePageNotAvailable from './HomePageNotAvailable';

import MarkdownContent from '@/components/markdown-content';

import { getFormatDate } from '@/utils/language';

interface HomePageProps {
  display: boolean;
}

const HomePageComponent: React.FC<HomePageProps> = React.memo(({ display }) => {
  const { t } = useTranslation();
  const [section, setSection] = useState<'home' | 'personal-exclusive'>('home');
  const [selectedAnn, setSelectedAnn] = useState<Types.Announcement | null>(null);
  const isHomeSection = section === 'home';
  const isPersonalExclusiveSection = section === 'personal-exclusive';

  const handleCreateServerClick = () => {
    openCreateServer();
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
    <main className="flex flex-col w-full min-w-0 h-full min-h-0" style={display ? {} : { display: 'none' }}>
      <div
        className={`animate-visibility absolute top-0 left-0 z-10000 flex items-center justify-center w-full h-full bg-[#00000080]`}
        style={selectedAnn ? {} : { display: 'none' }}
        onClick={() => setSelectedAnn(null)}
      >
        {selectedAnn && (
          <div
            className={`animate-fade-in flex flex-col w-[60%] h-[80%] px-[10px] overflow-y-auto bg-background border border-border rounded-[5px] shadow-[0_1px_1px_#00000080]`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-100 flex flex-row gap-[10px] items-center justify-start py-[10px] text-[1.2rem] font-bold bg-background border-b border-b-border">
              <div
                className="w-fit min-w-[50px] px-[10px] py-[5px] text-text-color-quaternary text-center bg-hover border-2 border-border rounded-[5px] data-[category=general]:text-[#005cbf] data-[category=general]:bg-[#e7f3ff] data-[category=general]:border-[#005cbf] data-[category=update]:text-[#c85a17] data-[category=update]:bg-[#fff0e6] data-[category=update]:border-[#c85a17] data-[category=system]:text-[#e72525] data-[category=system]:bg-[#fae6e6] data-[category=system]:border-[#e72525] data-[category=event]:text-[#1e7e34] data-[category=event]:bg-[#e6ffed] data-[category=event]:border-[#1e7e34]"
                data-category={selectedAnn.category}
              >
                {t(`${selectedAnn.category}`)}
              </div>
              <div className="flex-5 items-start text-[1.2rem]">{selectedAnn.title}</div>
              <div className="flex-1 text-[0.9rem] text-[#999] text-right">{getFormatDate(selectedAnn.publishedAt)}</div>
            </div>
            {selectedAnn.attachmentUrl && (
              <div className="relative flex flex-col items-center justify-center w-full aspect-[3/1] font-[arial,sans-serif] text-[36px] font-black text-text-color-tertiary text-center bg-[#e6f1f9] bg-no-repeat bg-center bg-contain">
                <Image src={selectedAnn.attachmentUrl} alt="announcement" width={-1} height={-1} loading="lazy" draggable="false" />
              </div>
            )}
            <div className="flex-1 p-[10px]">
              <MarkdownContent markdownText={selectedAnn.content} />
            </div>
          </div>
        )}
      </div>
      <header className="flex items-center justify-between px-[8px] py-[4px] bg-background border-b border-b-border">
        <HomePageHeader
          isHomeSection={isHomeSection}
          isPersonalExclusiveSection={isPersonalExclusiveSection}
          onHomeSectionBtnClick={handleHomeSectionBtnClick}
          onCreateServerBtnClick={handleCreateServerClick}
          onPersonalExclusiveSectionBtnClick={handlePersonalExclusiveSectionBtnClick}
          onBackBtnClick={handleBackBtnClick}
        />
      </header>
      <main className="flex flex-1 min-h-0">
        <main
          className="relative flex flex-col gap-[10px] items-center justify-start w-full h-full max-h-full p-[25px] overflow-y-scroll bg-background-secondary"
          style={isHomeSection ? {} : { display: 'none' }}
        >
          <HomePageContent onAnnouncementSelect={handleAnnouncementSelect} />
        </main>
        <main
          className="relative flex flex-col gap-[10px] items-center justify-start w-full h-full max-h-full p-[25px] overflow-y-scroll bg-background-secondary"
          style={isPersonalExclusiveSection ? {} : { display: 'none' }}
        >
          <HomePagePersonalExclusive />
        </main>
        <main
          className="relative flex flex-col gap-[10px] items-center justify-start w-full h-full max-h-full p-[25px] overflow-y-scroll bg-background-secondary"
          style={!isHomeSection && !isPersonalExclusiveSection ? {} : { display: 'none' }}
        >
          <HomePageNotAvailable />
        </main>
      </main>
    </main>
  );
});

HomePageComponent.displayName = 'HomePageComponent';

const HomePage = dynamic(() => Promise.resolve(HomePageComponent), { ssr: false });

export default HomePage;
