import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import { ANNOUNCEMENT_SLIDE_INTERVAL } from '@/constants';

import { useAppSelector } from '@/hooks/useStore';

import ServerList from './ServerList';

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
  const sortedAnnouncements = [...announcements].sort((a, b) => b.publishedAt - a.publishedAt);
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
      <div className="w-full max-w-[900px]">
        <div className="group/banner relative flex aspect-[3/1] overflow-hidden rounded-[5px] transition-all duration-200 ease-[ease-in-out] hover:shadow-[0_0_5px_0_#0000003f] hover:transform-[scale(1.01)]">
          <div ref={containerRef} className="flex flex-row w-full h-full overflow-x-auto scroll-smooth snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
            {sortedAnnouncements.length > 0 ? (
              sortedAnnouncements.map((ann) =>
                ann.attachmentUrl ? (
                  <div
                    key={ann.announcementId}
                    className="relative flex flex-col items-center justify-center w-full aspect-[3/1] font-[arial,sans-serif] text-[36px] font-black text-text-color-tertiary text-center bg-[#e6f1f9] bg-no-repeat bg-center bg-contain"
                    onClick={() => onAnnouncementSelect(ann)}
                  >
                    <Image src={ann.attachmentUrl} alt="announcement_attachment" width={100} height={100} loading="lazy" draggable="false" />
                  </div>
                ) : (
                  <div
                    key={ann.announcementId}
                    className="relative flex flex-col items-center justify-center w-full aspect-[3/1] font-[arial,sans-serif] text-[36px] font-black text-text-color-tertiary text-center bg-[#e6f1f9] bg-no-repeat bg-center bg-contain"
                    onClick={() => onAnnouncementSelect(ann)}
                  >
                    <Image loading="lazy" src="/ricecall_logo.svg" alt="ricecall logo" height={80} width={-1} />
                    <span>{ann.title}</span>
                  </div>
                ),
              )
            ) : (
              <div className="relative flex flex-col items-center justify-center w-full aspect-[3/1] font-[arial,sans-serif] text-[36px] font-black text-text-color-tertiary text-center bg-[#e6f1f9] bg-no-repeat bg-center bg-contain">
                <Image loading="lazy" src="/ricecall_logo.svg" alt="ricecall logo" height={80} width={-1} />
              </div>
            )}
          </div>
          {sortedAnnouncements.length > 0 && (
            <>
              <div className="absolute bottom-[5px] left-1/2 flex gap-[8px] px-[10px] py-[5px] rounded-[10px] transform-[translate(-50%)] transition-all duration-200 ease-[ease-in-out]">
                {sortedAnnouncements.map((_, index) => (
                  <nav
                    key={index}
                    className={`flex items-center justify-center h-[8px] aspect-square text-white border-none rounded-[4px] transition-all duration-200 ease-[ease-in-out] ${index === selectedAnnIndex ? 'w-[16px] bg-white shadow-[0_0_5px_0_#0000003f]' : 'w-[8px] bg-[#0006] hover:bg-[#000000b3]'}`}
                    onClick={() => setSelectedAnnIndex(index)}
                  />
                ))}
              </div>
              <nav
                className="absolute top-1/2 z-10 flex items-center justify-center w-[30px] h-[30px] p-[10px] text-[10px] text-white cursor-pointer bg-[#0006] border-none rounded-[10px] transition-all duration-200 ease-[ease-in-out] hover:bg-[#000000b3] group-hover/banner:transform-[translateX(0)] left-[10px] transform-[translateX(-100px)]"
                onClick={handlePrevAnnBtnClick}
              >
                {'◀'}
              </nav>
              <nav
                className="absolute top-1/2 z-10 flex items-center justify-center w-[30px] h-[30px] p-[10px] text-[10px] text-white cursor-pointer bg-[#0006] border-none rounded-[10px] transition-all duration-200 ease-[ease-in-out] hover:bg-[#000000b3] group-hover/banner:transform-[translateX(0)] right-[10px] transform-[translateX(100px)]"
                onClick={handleNextAnnBtnClick}
              >
                {'▶'}
              </nav>
            </>
          )}
        </div>
      </div>
      <div className="w-full max-w-[900px]">
        <ServerList title={t('recommend-server')} servers={filteredRecommendServers} />
      </div>
      <div className="w-full max-w-[900px]">
        <ServerList title={t('official-server')} servers={filteredOfficialServers} />
      </div>
    </>
  );
});

HomePageContent.displayName = 'HomePageContent';

export default HomePageContent;
