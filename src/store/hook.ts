import { useEffect, useState } from 'react';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';
import { isElectron } from '@/platform/isElectron';

export const useAppDispatch = () => useDispatch<AppDispatch>();

const _useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Universal Mock: Simulates the Electron "State Hydration Lag".
 * ONLY active in Web mode to mimic Electron's multi-process behavior.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = (selector, equalityFn) => {
  const isDesktop = isElectron();
  const [isHydrated, setIsHydrated] = useState(isDesktop);

  useEffect(() => {
    if (isDesktop) return;
    // Simulates the time it takes for an Electron window to sync data from Main process
    const timer = setTimeout(() => setIsHydrated(true), 500);
    return () => clearTimeout(timer);
  }, [isDesktop]);

  const realData = _useAppSelector(selector, equalityFn);
  
  if (isHydrated) return realData;

  // Universal Logic: Mask identifying fields while preserving structure
  const maskIdentity = (val: any): any => {
    if (val === null || val === undefined) return val;
    
    // Arrays usually start empty in a new window
    if (Array.isArray(val)) return [];

    if (typeof val === 'object') {
      const masked: any = {};
      for (const key in val) {
        const lowerKey = key.toLowerCase();
        // If the key is an ID or Name related field
        if (lowerKey.includes('id') || lowerKey === 'name' || lowerKey === 'displayid' || lowerKey === 'signature') {
          masked[key] = typeof val[key] === 'number' ? 0 : "";
        } else {
          // Keep other fields (like badges, settings, etc.) to prevent crashes
          masked[key] = val[key];
        }
      }
      return masked;
    }

    // If the selector returned a single string that looks like a UUID
    if (typeof val === 'string' && /^[0-9a-f-]{36}$/i.test(val)) {
      return "";
    }

    return val;
  };

  return maskIdentity(realData);
};
