/* eslint-disable @typescript-eslint/no-explicit-any */

import type * as Types from '@/types';
import type { PopupId, PopupOpenOptions } from './types';

export type InAppPopupInstance = {
  id: PopupId;
  type: Types.PopupType;
  initialData: any;
  options?: PopupOpenOptions;
  title?: string;
  minimized?: boolean;
  createdAt: number;
};

type Listener = (instances: InAppPopupInstance[]) => void;

// Web-only singleton store (module scope)
let instances: InAppPopupInstance[] = [];
const listeners = new Set<Listener>();

function emit() {
  const snapshot = instances;
  try {
    if (typeof window !== 'undefined' && localStorage.getItem('ricecall:debug:popup') === '1') {
      console.log('[InAppPopupHost.emit]', snapshot.map((p) => ({ id: p.id, type: p.type })));
    }
  } catch {
    // ignore
  }
  for (const l of listeners) l(snapshot);
}

export function subscribeInAppPopups(listener: Listener): () => void {
  listeners.add(listener);
  // fire once
  listener(instances);
  return () => listeners.delete(listener);
}

export function openInAppPopup(type: Types.PopupType, id: PopupId, initialData: unknown, options?: PopupOpenOptions) {
  // Replace existing same-id popup (same as Electron behavior where id is stable)
  const prev = instances.find((p) => p.id === id);
  instances = [
    ...instances.filter((p) => p.id !== id),
    {
      id,
      type,
      initialData: initialData ?? null,
      options,
      title: options?.title ?? prev?.title,
      minimized: prev?.minimized ?? false,
      createdAt: prev?.createdAt ?? Date.now(),
    },
  ];
  try {
    if (typeof window !== 'undefined' && localStorage.getItem('ricecall:debug:popup') === '1') {
      console.log('[InAppPopupHost.open]', { type, id });
    }
  } catch {
    // ignore
  }
  emit();
}

export function minimizeInAppPopup(id: PopupId) {
  const idx = instances.findIndex((p) => p.id === id);
  if (idx < 0) return;
  if (instances[idx].minimized) return;
  const next = [...instances];
  next[idx] = { ...next[idx], minimized: true };
  instances = next;
  emit();
}

export function restoreInAppPopup(id: PopupId) {
  const idx = instances.findIndex((p) => p.id === id);
  if (idx < 0) return;
  const item = { ...instances[idx], minimized: false };
  // Restore and bring to front
  instances = [...instances.filter((p) => p.id !== id), item];
  emit();
}

export function setInAppPopupTitle(id: PopupId, title: string) {
  const idx = instances.findIndex((p) => p.id === id);
  if (idx < 0) return;
  const nextTitle = title?.trim?.() ? title.trim() : title;
  if (instances[idx].title === nextTitle) return;
  const next = [...instances];
  next[idx] = { ...next[idx], title: nextTitle };
  instances = next;
  emit();
}

export function closeInAppPopup(id: PopupId) {
  const next = instances.filter((p) => p.id !== id);
  if (next.length === instances.length) return;
  instances = next;
  emit();
}

export function focusInAppPopup(id: PopupId) {
  const idx = instances.findIndex((p) => p.id === id);
  if (idx < 0) return;
  const item = instances[idx];
  // Move to end of array to increase z-index
  instances = [...instances.filter((p) => p.id !== id), item];
  emit();
}

export function closeAllInAppPopups() {
  if (instances.length === 0) return;
  instances = [];
  emit();
}
