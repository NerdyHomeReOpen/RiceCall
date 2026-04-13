import { createContext, useContext, useMemo, useRef, useCallback } from 'react';

interface LocateMeContextType {
  locateMe: (useSmooth?: boolean) => void;
  setExpandCategoryHandlerRef: (handler: () => void) => void;
  setExpandChannelHandlerRef: (handler: () => void) => void;
  setCurrentUserRef: (ref: HTMLDivElement | null) => void;
}

const LocateMeContext = createContext<LocateMeContextType | null>(null);

export const useLocateMeContext = () => {
  const context = useContext(LocateMeContext);
  if (!context) {
    throw new Error('useLocateMeContext must be used within an LocateMeProvider');
  }
  return context;
};

const LocateMeProvider = ({ children }: { children: React.ReactNode }) => {
  const expandCategoryHandlerRef = useRef<() => void>(null);
  const expandChannelHandlerRef = useRef<() => void>(null);
  const currentUserRef = useRef<HTMLDivElement>(null);

  const locateMe = useCallback((useSmooth: boolean = true) => {
    expandCategoryHandlerRef.current?.();
    expandChannelHandlerRef.current?.();

    setTimeout(() => {
      currentUserRef.current?.scrollIntoView({
        behavior: useSmooth ? 'smooth' : 'auto',
        block: 'center',
      });
    }, 100);
  }, []);

  const setExpandCategoryHandlerRef = useCallback((handler: () => void) => {
    expandCategoryHandlerRef.current = handler;
  }, []);

  const setExpandChannelHandlerRef = useCallback((handler: () => void) => {
    expandChannelHandlerRef.current = handler;
  }, []);

  const setCurrentUserRef = useCallback((ref: HTMLDivElement | null) => {
    currentUserRef.current = ref;
  }, []);

  const contextValue = useMemo(
    () => ({ locateMe, setExpandCategoryHandlerRef, setExpandChannelHandlerRef, setCurrentUserRef }),
    [locateMe, setExpandCategoryHandlerRef, setExpandChannelHandlerRef, setCurrentUserRef],
  );

  return <LocateMeContext.Provider value={contextValue}>{children}</LocateMeContext.Provider>;
};

LocateMeProvider.displayName = 'LocateMeProvider';

export default LocateMeProvider;
