import dynamic from 'next/dynamic';
import React, { useEffect, useRef } from 'react';

import FriendPageHeader from './FriendPageHeader';
import FriendPageSidebar from './FriendPageSidebar';
import FriendPageContent from './FriendPageContent';

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
    <main className="flex flex-col w-full min-w-0 h-full min-h-0" style={display ? {} : { display: 'none' }}>
      <header className="flex gap-[5px] items-center h-[50px] px-[10px] py-[4px]">
        <FriendPageHeader />
      </header>
      <main className="flex flex-1 min-h-0">
        <aside ref={sidebarRef} className="flex flex-col w-[280px] min-w-[280px] min-h-0 bg-sidebar">
          <FriendPageSidebar />
        </aside>
        <div className="resize-handle" onPointerDown={handleSidebarHandleDown} onPointerMove={handleSidebarHandleMove} />
        <main className="flex flex-1 flex-col min-w-[500px] min-h-0 bg-sidebar border-t border-t-border">
          <FriendPageContent />
        </main>
      </main>
    </main>
  );
});

FriendPageComponent.displayName = 'FriendPageComponent';

const FriendPage = dynamic(() => Promise.resolve(FriendPageComponent), { ssr: false });

export default FriendPage;
