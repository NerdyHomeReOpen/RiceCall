import { createContext, useContext, useMemo, useRef, useCallback } from 'react';

interface FindMeContextType {
  findMe: () => void;
  setExpandedCategoryHandlerRef: (handler: () => void) => void;
  setExpandedChannelHandlerRef: (handler: () => void) => void;
  setCurrentUserRef: (ref: HTMLDivElement | null) => void;
}

const FindMeContext = createContext<FindMeContextType | null>(null);

export const useFindMeContext = () => {
  const context = useContext(FindMeContext);
  if (!context) {
    throw new Error('useFindMeContext must be used within an FindMeProvider');
  }
  return context;
};

const FindMeProvider = ({ children }: { children: React.ReactNode }) => {
  // Refs
  const expandedCategoryHandlerRef = useRef<() => void>(null);
  const expandedChannelHandlerRef = useRef<() => void>(null);
  const currentUserRef = useRef<HTMLDivElement>(null);

  // Functions
  const findMe = useCallback(() => {
    expandedCategoryHandlerRef.current?.();
    expandedChannelHandlerRef.current?.();

    setTimeout(() => {
      currentUserRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 100);
  }, []);

  const setExpandedCategoryHandlerRef = useCallback((handler: () => void) => {
    expandedCategoryHandlerRef.current = handler;
  }, []);

  const setExpandedChannelHandlerRef = useCallback((handler: () => void) => {
    expandedChannelHandlerRef.current = handler;
  }, []);

  const setCurrentUserRef = useCallback((ref: HTMLDivElement | null) => {
    currentUserRef.current = ref;
  }, []);

  const contextValue = useMemo(
    () => ({ findMe, setExpandedCategoryHandlerRef, setExpandedChannelHandlerRef, setCurrentUserRef }),
    [findMe, setExpandedCategoryHandlerRef, setExpandedChannelHandlerRef, setCurrentUserRef],
  );

  return <FindMeContext.Provider value={contextValue}>{children}</FindMeContext.Provider>;
};

FindMeProvider.displayName = 'FindMeProvider';

export default FindMeProvider;
