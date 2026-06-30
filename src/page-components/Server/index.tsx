import dynamic from 'next/dynamic';
import React, { useEffect, useRef } from 'react';

import ServerPageSidebar from './ServerPageSidebar';
import ServerPageContent from './ServerPageContent';

import styles from './Server.module.css';

interface ServerPageProps {
  isActive: boolean;
}

const ServerPageComponent: React.FC<ServerPageProps> = React.memo(({ isActive }) => {
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
    <main className={styles['page']} style={isActive ? {} : { display: 'none' }}>
      <main className={styles['body']}>
        <aside ref={sidebarEl} className={styles['sidebar']}>
          <ServerPageSidebar />
        </aside>
        <div className="resize-handle" onPointerDown={handleSidebarHandleDown} onPointerMove={handleSidebarHandleMove} />
        <main className={styles['content']}>
          <ServerPageContent />
        </main>
      </main>
    </main>
  );
});

ServerPageComponent.displayName = 'ServerPageComponent';

const ServerPage = dynamic(() => Promise.resolve(ServerPageComponent), { ssr: false });

export default ServerPage;
