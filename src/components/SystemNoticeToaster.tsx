import React, { useEffect, useState } from 'react';

// Types
import type { Announcement } from '@/types';

// CSS
import systemNoticeToaster from '@/styles/systemNoticeToaster.module.css';

// Components
import MarkdownContent from '@/components/MarkdownContent';

interface SystemNoticeToasterProps {
  announcement?: Announcement;
}

const SystemNoticeToaster: React.FC<SystemNoticeToasterProps> = React.memo(({ announcement }) => {
  // States
  const [show, setShow] = useState(false);

  // Effects
  useEffect(() => {
    setShow(!!announcement);
  }, [announcement]);

  if (!announcement) return null;
  return (
    <div className={`${systemNoticeToaster['system-notice-toaster']} ${show ? systemNoticeToaster['show'] : ''}`}>
      <MarkdownContent markdownText={announcement.content} />
      <div className={systemNoticeToaster['system-notice-toaster-close']} onClick={() => setShow(false)}></div>
    </div>
  );
});

SystemNoticeToaster.displayName = 'SystemNoticeToaster';

export default SystemNoticeToaster;
