import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import type * as Types from '@/types';

import Logger from '@/utils/logger';

import { buildPopup } from '@/popups/PopupRegistry';

import { eventEmitter } from '@/main/event';

import PopupHeader from '@/components/popup-header';
import MaximizedPopup from '@/components/maximized-popup';

interface PopupProviderProps {
  children: ReactNode;
}

const PopupProvider = ({ children }: PopupProviderProps) => {
  const [popups, setPopups] = useState<Types.Popup[]>([]);
  const [minimizedIds, setMinimizedIds] = useState<Set<string>>(new Set());

  const holdingPopupIdRef = useRef<string | null>(null);
  const topZIndexRef = useRef(201);
  const popupsRef = useRef<Types.Popup[]>([]);

  const minimizedPopups = popups.filter((p) => minimizedIds.has(p.id));

  const close = useCallback((id: string) => {
    setMinimizedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const minimize = useCallback((id: string) => {
    setMinimizedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const restore = useCallback((id: string) => {
    setMinimizedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const open = useCallback(
    async (type: Types.PopupType, id: string, initialData: unknown = {}, force = true) => {
      new Logger('POPUP').info(`Opening ${type} (${id})...`);

      if (force) {
        close(id);
      } else {
        if (popupsRef.current.findIndex((p) => p.id === id) !== -1) {
          restore(id);

          const popupEl = document.querySelector(`[data-popup-id="${id}"]`) as HTMLElement;
          if (!popupEl) return;

          topZIndexRef.current++;
          popupEl.style.zIndex = `${topZIndexRef.current}`;

          return;
        }
      }

      // initialData was loaded for this popup type by main/popup before it was emitted.
      const popup = buildPopup(id, { type, data: initialData } as Types.PopupData);

      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const popupWidth = popup.size.width;
      const popupHeight = popup.size.height;

      const centerX = Math.max(0, (screenWidth - popupWidth) / 2);
      const centerY = Math.max(0, (screenHeight - popupHeight) / 2);

      setPopups((prev) => [...prev, { ...popup, position: { top: centerY, left: centerX } }]);
    },
    [close, restore],
  );

  useEffect(() => {
    eventEmitter.on('open-popup', open);
    return () => {
      eventEmitter.off('open-popup', open);
    };
  }, [open]);

  useEffect(() => {
    eventEmitter.on('close-popup', close);
    return () => {
      eventEmitter.off('close-popup', close);
    };
  }, [close]);

  useEffect(() => {
    eventEmitter.on('minimize-popup', minimize);
    return () => {
      eventEmitter.off('minimize-popup', minimize);
    };
  }, [minimize]);

  useEffect(() => {
    eventEmitter.on('restore-popup', restore);
    return () => {
      eventEmitter.off('restore-popup', restore);
    };
  }, [restore]);

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let popupStartX = 0;
    let popupStartY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement;

      const popupEl = el.closest('[data-popup-id]') as HTMLElement | null;
      if (!popupEl) return;

      topZIndexRef.current++;
      popupEl.style.zIndex = `${topZIndexRef.current}`;

      if (!el.closest('[data-draggable]')) return;

      const id = popupEl.getAttribute('data-popup-id');
      if (!id) return;

      holdingPopupIdRef.current = id;

      startX = e.clientX;
      startY = e.clientY;
      popupStartX = popupEl.offsetLeft;
      popupStartY = popupEl.offsetTop;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const id = holdingPopupIdRef.current;
      if (!id) return;

      const popupEl = document.querySelector(`[data-popup-id="${id}"]`) as HTMLElement;
      if (!popupEl) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newLeft = popupStartX + dx;
      let newTop = popupStartY + dy;

      const popupWidth = popupEl.offsetWidth;
      const popupHeight = popupEl.offsetHeight;

      newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - popupWidth));
      newTop = Math.max(0, Math.min(newTop, window.innerHeight - popupHeight));

      popupEl.style.left = `${newLeft}px`;
      popupEl.style.top = `${newTop}px`;
    };

    const handleMouseUp = () => {
      holdingPopupIdRef.current = null;
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    popupsRef.current = popups;
  }, [popups]);

  return (
    <>
      {popups.map((popup) => (
        <div
          key={popup.id}
          data-popup-id={popup.id}
          style={{
            display: minimizedIds.has(popup.id) ? 'none' : 'flex',
            flexDirection: 'column',
            position: 'absolute',
            top: popup.position.top,
            left: popup.position.left,
            zIndex: topZIndexRef.current,
            boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.5)',
            height: popup.size.height,
            width: popup.size.width,
            overflow: 'hidden',
          }}
        >
          {!popup.hideHeader && (
            <PopupHeader
              title={popup.title}
              buttons={popup.buttons}
              popupType={popup.type}
              isFullscreen={false}
              onMinimize={() => minimize(popup.id)}
              onMaximize={() => restore(popup.id)}
              onRestore={() => restore(popup.id)}
              onClose={() => close(popup.id)}
            />
          )}
          {popup.node()}
        </div>
      ))}
      {minimizedPopups.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 12,
            left: 12,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          {minimizedPopups.map((popup) => (
            <MaximizedPopup key={popup.id} id={popup.id} title={popup.title} buttons={popup.buttons} onRestore={() => restore(popup.id)} />
          ))}
        </div>
      )}
      {children}
    </>
  );
};

PopupProvider.displayName = 'PopupProvider';

export default PopupProvider;
