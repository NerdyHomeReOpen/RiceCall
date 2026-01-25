/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';
import { POPUP_SIZES, POPUP_HEADERS, POPUP_TITLE_KEYS, type PopupHeaderButton } from '@/popup.config';

import ipc from '@/ipc';

import { closeInAppPopup, restoreInAppPopup, subscribeInAppPopups, type InAppPopupInstance } from './inAppPopupHost';
import { hydratePopupData, webPopupLoaders } from './webPopupLoader';
import { renderPopup } from './popupComponents.generated';

type Pos = { x: number; y: number };

// Get popup title considering initialData for dynamic titles.
function getPopupTitle(type: Types.PopupType, initialData: any, t: (key: string) => string): string {
  // Some popups have dynamic titles based on data.
  if (type === 'directMessage' && initialData?.target?.name) {
    return initialData.target.name;
  }
  if (type === 'channelSetting' && initialData?.channel?.name) {
    return initialData.channel.name;
  }
  if (type === 'serverSetting' && initialData?.server?.name) {
    return initialData.server.name;
  }
  return t(POPUP_TITLE_KEYS[type] ?? type);
}

function isInteractiveElement(el: HTMLElement) {
  const tag = el.tagName;
  if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'OPTION') return true;
  const role = el.getAttribute('role');
  if (role === 'button' || role === 'link' || role === 'textbox' || role === 'menuitem' || role === 'tab') return true;
  if ((el as any).isContentEditable) return true;
  return false;
}

function getWebkitAppRegion(el: HTMLElement) {
  try {
    const style = window.getComputedStyle(el) as any;
    const region = (style.webkitAppRegion ?? style['-webkit-app-region'] ?? '') as string;
    if (region === 'drag' || region === 'no-drag') return region as 'drag' | 'no-drag';
    return null;
  } catch {
    return null;
  }
}

function shouldStartDrag(target: HTMLElement) {
  // Electron rule-of-thumb:
  // - Find an ancestor with `-webkit-app-region: drag`
  // - But if any element between target..dragAncestor has `no-drag`, don't drag
  // We emulate this using computed styles (works even with CSS modules/class-name hashing).
  let dragAncestor: HTMLElement | null = null;
  for (let el: HTMLElement | null = target; el && el !== document.documentElement; el = el.parentElement) {
    if (!dragAncestor) {
      const r = getWebkitAppRegion(el);
      if (r === 'drag') dragAncestor = el;
    }
    // Hard stop: interactive element should not start a drag.
    if (isInteractiveElement(el)) return false;
  }

  if (!dragAncestor) return false;

  for (let el: HTMLElement | null = target; el && el !== document.documentElement; el = el.parentElement) {
    const r = getWebkitAppRegion(el);
    if (r === 'no-drag') return false;
    if (el === dragAncestor) break;
  }

  return true;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Check if a popup has been hydrated (has all required data).
 * Returns true if popup can be rendered, false if still waiting for hydration.
 */
function isPopupHydrated(type: Types.PopupType, data: any): boolean {
  if (!data || typeof data !== 'object') return false;

  // If there's a loader for this type, check if hydration is complete.
  // A simple heuristic: if loader exists, check that we have more than just IDs.
  const loader = webPopupLoaders[type];
  if (!loader) return true; // No loader = no hydration needed

  // Type-specific checks for required fields
  switch (type) {
    case 'userInfo':
    case 'userSetting':
      return !!data.target && Array.isArray(data.targetServers);
    case 'directMessage':
    case 'chatHistory':
      return !!data.user && !!data.target;
    case 'systemSetting':
      return !!data.user && !!data.systemSettings;
    case 'serverSetting':
      return !!data.user && !!data.server && Array.isArray(data.serverMembers);
    case 'channelSetting':
      return !!data.user && !!data.server && !!data.channel;
    case 'channelEvent':
      return !!data.user && !!data.server && Array.isArray(data.channels);
    case 'createServer':
      return !!data.user && Array.isArray(data.servers);
    case 'applyFriend':
      return !!data.target && Array.isArray(data.friendGroups);
    case 'editFriendNote':
      return !!data.friend && Array.isArray(data.friendGroups);
    case 'friendVerification':
      return Array.isArray(data.friendApplications);
    case 'memberInvitation':
      return Array.isArray(data.memberInvitations);
    case 'editChannelOrder':
      return Array.isArray(data.serverChannels);
    case 'serverBroadcast':
      return !!data.user && !!data.server;
    default:
      // For other types, assume hydrated if we have any data object
      return true;
  }
}

function renderPopupNode(p: InAppPopupInstance) {
  const id = p.id;
  const d: any = p.initialData;

  // Wait for hydration if needed
  if (!isPopupHydrated(p.type, d)) {
    return null;
  }

  // Use the centralized popup renderer from popupComponents.generated.tsx
  return renderPopup(p.type, id, d);
}

export function InAppPopupHost() {
  const { t } = useTranslation();
  const [popups, setPopups] = useState<InAppPopupInstance[]>([]);
  const [debugEnabled, setDebugEnabled] = useState(false);

  // Hold hydrated data separately to avoid a setState loop (popups -> hydrate -> setPopups -> ...).
  const [hydratedData, setHydratedData] = useState<Record<string, any>>({});

  // Stable per-popup positions
  const positionsRef = useRef<Record<string, Pos>>({});
  const [tick, setTick] = useState(0);

  useEffect(() => subscribeInAppPopups(setPopups), []);

  useEffect(() => {
    try {
      setDebugEnabled(localStorage.getItem('ricecall:debug:popup') === '1');
    } catch {
      setDebugEnabled(false);
    }
  }, []);

  // Hydrate all popups that need data using the unified webPopupLoader
  useEffect(() => {
    let cancelled = false;

    // Find popups that have a loader and haven't been hydrated yet
    const needsHydration = popups.filter((p) => {
      const hasLoader = !!webPopupLoaders[p.type];
      const alreadyHydrated = hydratedData[p.id] !== undefined;
      return hasLoader && !alreadyHydrated;
    });

    if (needsHydration.length === 0) return;

    const tasks = needsHydration.map(async (p) => {
      const hydrated = await hydratePopupData(p.type, p.initialData as Record<string, unknown>);
      return { id: p.id, hydrated };
    });

    (async () => {
      const results = await Promise.all(tasks);
      if (cancelled) return;
      setHydratedData((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const r of results) {
          if (next[r.id] !== r.hydrated) {
            next[r.id] = r.hydrated;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [popups, hydratedData]);

  const zOrder = useMemo(() => popups.map((p) => p.id), [popups]);

  const minimized = useMemo(() => popups.filter((p) => p.minimized), [popups]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {debugEnabled ? (
        <div
          style={{
            position: 'fixed',
            right: 8,
            bottom: 8,
            padding: '6px 10px',
            borderRadius: 999,
            background: 'rgba(0,0,0,0.55)',
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 12,
            pointerEvents: 'none',
          }}
        >
          popups: {popups.length}
        </div>
      ) : null}

      {popups.length === 0
        ? null
        : popups.map((p, idx) => {
          const key = p.id;
          const pos = positionsRef.current[key] ?? {
            x: 120 + idx * 24,
            y: 80 + idx * 24,
          };
          positionsRef.current[key] = pos;

          const z = zOrder.indexOf(p.id) + 1;
          const effectiveData = hydratedData[p.id] ?? p.initialData;
          const popupTitle = getPopupTitle(p.type, effectiveData, t);

          return (
            <DraggableWindow
              key={key}
              id={p.id}
              type={p.type}
              title={popupTitle}
              zIndex={z}
              initialPos={pos}
              onPosChange={(next) => {
                positionsRef.current[key] = next;
                setTick((x) => x + 1);
              }}
              hidden={!!p.minimized}
            >
              <PopupErrorBoundary popupId={p.id} onClose={() => closeInAppPopup(p.id)}>
                {/* Allow popup components to call `ipc.window.close()` in web by providing a current-popup id hint. */}
                <CurrentPopupIdScope popupId={p.id}>
                {renderPopupNode({ ...p, initialData: effectiveData })}
                </CurrentPopupIdScope>
              </PopupErrorBoundary>
            </DraggableWindow>
          );
        })}

      {minimized.length === 0 ? null : (
        <div
          style={{
            position: 'fixed',
            left: 12,
            bottom: 12,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            pointerEvents: 'auto',
            zIndex: 10000,
          }}
        >
          {minimized.map((p) => {
            const effectiveData = hydratedData[p.id] ?? p.initialData;
            const title = getPopupTitle(p.type, effectiveData, t);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => restoreInAppPopup(p.id)}
                style={{
                  height: 28,
                  maxWidth: 260,
                  padding: '0 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(0,0,0,0.55)',
                  color: 'rgba(255,255,255,0.92)',
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={title}
              >
                {title}
              </button>
            );
          })}
        </div>
      )}

      {/* keep eslint/ts from complaining about unused */}
      <span style={{ display: 'none' }}>{tick}</span>
    </div>
  );

}

function CurrentPopupIdScope(props: { popupId: string; children: React.ReactNode }) {
  useEffect(() => {
    // Use a stack model to support nested popups (e.g., imageCropper opened from userInfo).
    const stack: string[] = (globalThis as any).__ricecallCurrentPopupIdStack ?? [];
    stack.push(props.popupId);
    (globalThis as any).__ricecallCurrentPopupIdStack = stack;
    (globalThis as any).__ricecallCurrentPopupId = props.popupId;
    return () => {
      // Pop from stack, restore previous.
      const idx = stack.lastIndexOf(props.popupId);
      if (idx >= 0) stack.splice(idx, 1);
      if (stack.length > 0) {
        (globalThis as any).__ricecallCurrentPopupId = stack[stack.length - 1];
      } else {
        delete (globalThis as any).__ricecallCurrentPopupId;
      }
    };
  }, [props.popupId]);
  return <>{props.children}</>;
}

class PopupErrorBoundary extends React.Component<
  {
    popupId: string;
    onClose: () => void;
    children: React.ReactNode;
  },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(`[PopupErrorBoundary] popupId=${this.props.popupId}`, error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ padding: 12, fontFamily: 'system-ui, sans-serif', color: 'white' }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Popup crashed</div>
        <div style={{ opacity: 0.8, fontSize: 12, whiteSpace: 'pre-wrap' }}>{String(this.state.error?.message || this.state.error)}</div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
          <button
            type="button"
            onClick={this.props.onClose}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }
}

function DraggableWindow(props: {
  id: string;
  type: Types.PopupType;
  title: string;
  zIndex: number;
  initialPos: Pos;
  onPosChange: (p: Pos) => void;
  hidden?: boolean;
  children: React.ReactNode;
}) {
  const { zIndex, initialPos, onPosChange, children } = props;
  const headerConfig = POPUP_HEADERS[props.type] ?? { buttons: ['close'], hideHeader: false };

  const [pos, setPos] = useState<Pos>(initialPos);
  const [isDragging, setIsDragging] = useState(false);
  const draggingRef = useRef<null | { startX: number; startY: number; baseX: number; baseY: number }>(null);

  useEffect(() => {
    setPos(initialPos);
  }, [initialPos]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const { startX, startY, baseX, baseY } = draggingRef.current;
      const next = {
        x: clamp(baseX + (e.clientX - startX), 0, window.innerWidth - 120),
        y: clamp(baseY + (e.clientY - startY), 0, window.innerHeight - 40),
      };
      setPos(next);
      onPosChange(next);
    };
    const onUp = () => {
      draggingRef.current = null;
      setIsDragging(false);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [onPosChange]);

  const handleMinimize = () => {
    ipc.window.minimize();
  };

  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        display: props.hidden ? 'none' : 'flex',
        flexDirection: 'column',
        // Match Electron sizes per popup type, while still respecting viewport.
        width: POPUP_SIZES[props.type]?.width ?? 600,
        height: POPUP_SIZES[props.type]?.height ?? 520,
        maxWidth: 'calc(100vw - 24px)',
        maxHeight: 'calc(100vh - 24px)',
        borderRadius: 10,
        overflow: 'hidden',
        background: 'transparent',
        boxShadow: '0 18px 50px rgba(0,0,0,0.35)',
        pointerEvents: 'auto',
        zIndex,
        // Match Electron: cursor changes when actually dragging (mouse down), not on hover.
        cursor: isDragging ? 'move' : 'default',
      }}
      onPointerDown={(e) => {
        // Match Electron's drag-region behavior based on computed `-webkit-app-region`.
        const target = e.target as HTMLElement | null;
        if (!target) return;
        if (!shouldStartDrag(target)) return;

        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        draggingRef.current = { startX: e.clientX, startY: e.clientY, baseX: pos.x, baseY: pos.y };
        setIsDragging(true);
      }}
    >
      {/* Title bar (like Electron popup header) */}
      {!headerConfig.hideHeader && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 30,
            padding: '0 8px',
            background: 'var(--main-color, #1e90ff)',
            color: 'var(--secondary-color, #fff)',
            cursor: isDragging ? 'move' : 'default',
            WebkitAppRegion: 'drag',
            userSelect: 'none',
          } as React.CSSProperties}
        >
          <span style={{ fontSize: 13, fontWeight: 500 }}>{props.title}</span>
          <div style={{ display: 'flex', gap: 4, WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            {headerConfig.buttons.includes('minimize') && (
              <button
                onClick={handleMinimize}
                style={{
                  width: 20,
                  height: 20,
                  border: 'none',
                  background: 'url(/Button_Minsize.webp) no-repeat 0 0',
                  backgroundSize: 'cover',
                  cursor: 'pointer',
                }}
                title="Minimize"
              />
            )}
            {headerConfig.buttons.includes('close') && (
              <button
                onClick={handleClose}
                style={{
                  width: 20,
                  height: 20,
                  border: 'none',
                  background: 'url(/Button_Close.webp) no-repeat 0 0',
                  backgroundSize: 'cover',
                  cursor: 'pointer',
                }}
                title="Close"
              />
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}