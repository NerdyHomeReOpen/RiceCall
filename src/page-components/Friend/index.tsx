import dynamic from 'next/dynamic';
import React, { useEffect, useRef } from 'react';

import FriendPageHeader from './FriendPageHeader';
import FriendPageSidebar from './FriendPageSidebar';
import FriendPageContent from './FriendPageContent';

import styles from './Friend.module.css';

interface FriendPageProps {
  display: boolean;
}

const FriendPageComponent: React.FC<FriendPageProps> = React.memo(({ display }) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizingSidebarRef = useRef<boolean>(false);

  const handleSidebarHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isResizingSidebarRef.current = true;
  };

  const handleSidebarHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingSidebarRef.current || !sidebarRef.current) return;
    sidebarRef.current.style.width = `${e.clientX}px`;
  };

  useEffect(() => {
    const onPointerup = () => {
      isResizingSidebarRef.current = false;
    };
    document.addEventListener('pointerup', onPointerup);
    return () => document.removeEventListener('pointerup', onPointerup);
  }, []);

  return (
    <main className={styles['friend-page']} style={display ? {} : { display: 'none' }}>
      <header className={styles['header']}>
        <FriendPageHeader />
      </header>
      <main className={styles['body']}>
        <aside ref={sidebarRef} className={styles['sidebar']}>
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
