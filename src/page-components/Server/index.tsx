import dynamic from 'next/dynamic';
import React, { useEffect, useRef } from 'react';

import ServerPageSidebar from './ServerPageSidebar';
import ServerPageContent from './ServerPageContent';

import styles from './Server.module.css';

interface ServerPageProps {
  display: boolean;
}

const ServerPageComponent: React.FC<ServerPageProps> = React.memo(({ display }) => {
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
    <main className={styles['server-page']} style={display ? {} : { display: 'none' }}>
      <main className={styles['server-page-body']}>
        <aside ref={sidebarRef} className={styles['server-page-sidebar']}>
          <ServerPageSidebar />
        </aside>
        <div className="resize-handle" onPointerDown={handleSidebarHandleDown} onPointerMove={handleSidebarHandleMove} />
        <main className={styles['server-page-content']}>
          <ServerPageContent />
        </main>
      </main>
    </main>
  );
});

ServerPageComponent.displayName = 'ServerPageComponent';

const ServerPage = dynamic(() => Promise.resolve(ServerPageComponent), { ssr: false });

export default ServerPage;
