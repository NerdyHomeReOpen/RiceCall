import React, { useEffect, useState } from 'react';

// Types
import type { Notify } from '@/types';

// CSS
import notifyToaster from '@/styles/notifyToaster.module.css';

// Components
import MarkdownContent from '@/components/MarkdownContent';

interface NotifyToasterProps {
  notifies: Notify[];
}

const NotifyToaster: React.FC<NotifyToasterProps> = React.memo(({ notifies }) => {
  // States
  const [show, setShow] = useState(false);
  const [showNotifyIndex, setShowNotifyIndex] = useState<number>(0);

  // Handlers
  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
      if (showNotifyIndex === 0) return;
      setShowNotifyIndex((prev) => prev - 1);
      setShow(true);
    }, 2000);
  };

  // Effects
  useEffect(() => {
    if (notifies.length > 0) {
      setShowNotifyIndex(notifies.length - 1);
      setShow(true);
    }
  }, [notifies]);

  return (
    <div className={`${notifyToaster['notify-toaster']} ${show ? notifyToaster['show'] : ''}`}>
      <MarkdownContent markdownText={notifies[showNotifyIndex]?.content ?? ''} selectable={false} />
      <div className={notifyToaster['notify-toaster-close']} onClick={handleClose}></div>
    </div>
  );
});

NotifyToaster.displayName = 'NotifyToaster';

export default NotifyToaster;
