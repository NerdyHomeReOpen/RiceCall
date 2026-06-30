import dynamic from 'next/dynamic';
import React, { useEffect, useRef } from 'react';

import FriendPageHeader from './FriendPageHeader';
import FriendPageSidebar from './FriendPageSidebar';
import FriendPageContent from './FriendPageContent';

import styles from './Friend.module.css';

interface FriendPageProps {
  isActive: boolean;
}

const FriendPageComponent: React.FC<FriendPageProps> = React.memo(({ isActive }) => {
  const sidebarEl = useRef<HTMLDivElement>(null);
  const isSidebarResizing = useRef<boolean>(false);

  const handleSidebarHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isSidebarResizing.current = true;
  };

  const handleSidebarHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSidebarResizing.current || !sidebarEl.current) return;
    sidebarEl.current.style.width = `${e.clientX}px`;
  };

  useEffect(() => {
    const handlePointerUp = () => {
      isSidebarResizing.current = false;
    };

    document.addEventListener('pointerup', handlePointerUp);
    return () => document.removeEventListener('pointerup', handlePointerUp);
  }, []);

  return (
    <main className={styles['friend-page']} style={isActive ? {} : { display: 'none' }}>
      <header className={styles['header']}>
        <FriendPageHeader />
      </header>
      <main className={styles['body']}>
        <aside ref={sidebarEl} className={styles['sidebar']}>
          <FriendPageSidebar />
        </aside>
        <div className="resize-handle" onPointerDown={handleSidebarHandleDown} onPointerMove={handleSidebarHandleMove} />
        <main className={styles['content']}>
          <FriendPageContent />
        </main>
      </main>
    </main>
  );
});

FriendPageComponent.displayName = 'FriendPageComponent';

const FriendPage = dynamic(() => Promise.resolve(FriendPageComponent), { ssr: false });

export default FriendPage;
