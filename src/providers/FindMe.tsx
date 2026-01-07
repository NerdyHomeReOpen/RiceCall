import { createContext, useContext, useRef } from 'react';

interface FindMeContextType {
  findMe: () => void;
  expandCategoryHandlerRef: React.RefObject<() => void>;
  expandChannelHandlerRef: React.RefObject<() => void>;
  userTabRef: React.RefObject<HTMLDivElement | null>;
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
  const expandCategoryHandlerRef = useRef<() => void>(() => {});
  const expandChannelHandlerRef = useRef<() => void>(() => {});
  const userTabRef = useRef<HTMLDivElement>(null);

  // Functions
  const findMe = () => {
    expandCategoryHandlerRef.current();
    expandChannelHandlerRef.current();

    setTimeout(() => {
      userTabRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 100);
  };

  return <FindMeContext.Provider value={{ findMe, expandCategoryHandlerRef, expandChannelHandlerRef, userTabRef }}>{children}</FindMeContext.Provider>;
};

FindMeProvider.displayName = 'FindMeProvider';

export default FindMeProvider;
