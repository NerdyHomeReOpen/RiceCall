import { useEffect, useState, useContext } from 'react';
import { TypedUseSelectorHook, useDispatch, useSelector as _useAppSelector } from 'react-redux';
import { RootState, AppDispatch, rootReducer } from '@/store';
import { isElectron } from '@/platform/isElectron';
import { PopupHydrationContext } from '@/platform/popup/InAppPopupContainer';

export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * 1:1 Simulation of Electron's "Multi-process Isolation" lag.
 * 
 * Logic:
 * 1. Uses PopupHydrationContext to identify if a component is rendered within a Web Popup virtual layer.
 * 2. Only components inside a popup experience the initial hydration lag (moving from InitialState to RealData).
 * 3. Main interface components (like Friend.tsx) are outside the context and get data immediately to avoid crashes.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = (selector, equalityFn) => {
  const isDesktop = isElectron();
  
  // Check if we are within a popup's isolated hydration scope
  const isInPopup = useContext(PopupHydrationContext);
  
  // If in Web Popup environment, start with unhydrated state to simulate fresh process startup
  const [isLocalHydrated, setIsLocalHydrated] = useState(!isInPopup || isDesktop);

  useEffect(() => {
    if (!isInPopup || isDesktop) return;
    
    // Simulate the async data synchronization lag (even with 0ms, it triggers the render cycle)
    const timer = setTimeout(() => setIsLocalHydrated(true), 0);
    return () => clearTimeout(timer);
  }, [isInPopup, isDesktop]);

  const realData = _useAppSelector(selector, equalityFn);

  // 1:1 Mirror of Electron startup flaw: return initialState for the first render cycle in popups
  if (!isLocalHydrated) {
    const initialState = rootReducer(undefined, { type: '@@INIT' });
    return selector(initialState);
  }

  return realData;
};