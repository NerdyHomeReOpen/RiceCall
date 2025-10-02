import React, { useEffect, useState } from 'react';

// Types
import type { Announcement } from '@/types';

// CSS
import systemNoticeToaster from '@/styles/systemNoticeToaster.module.css';

// Components
import MarkdownContent from '@/components/MarkdownContent';

interface SystemNoticeToasterProps {
  announcements: Announcement[];
}

const SystemNoticeToaster: React.FC<SystemNoticeToasterProps> = React.memo(({ announcements }) => {
  // States
  const [show, setShow] = useState(false);
  const [showAnnouncementIndex, setShowAnnouncementIndex] = useState<number>(0);

  // Handlers
  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
      if (showAnnouncementIndex === 0) return;
      setShowAnnouncementIndex((prev) => prev - 1);
      setShow(true);
    }, 2000);
  };

  // Effects
  useEffect(() => {
    if (announcements.length > 0) {
      setShowAnnouncementIndex(announcements.length - 1);
      setShow(true);
    }
  }, [announcements]);

  return (
    <div className={`${systemNoticeToaster['system-notice-toaster']} ${show ? systemNoticeToaster['show'] : ''}`}>
      <MarkdownContent markdownText={announcements[showAnnouncementIndex].content} />
      <div className={systemNoticeToaster['system-notice-toaster-close']} onClick={handleClose}></div>
    </div>
  );
});

SystemNoticeToaster.displayName = 'SystemNoticeToaster';

export default SystemNoticeToaster;
