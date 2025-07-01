import { createContext, useContext, useRef } from 'react';

interface FindMeContextType {
  findMe: () => void;
  handleCategoryExpanded: React.RefObject<() => void>;
  handleChannelExpanded: React.RefObject<() => void>;
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
  const handleCategoryExpanded = useRef<() => void>(() => {});
  const handleChannelExpanded = useRef<() => void>(() => {});
  const userTabRef = useRef<HTMLDivElement>(null);

  // Handlers
  const findMe = () => {
    handleCategoryExpanded.current();
    handleChannelExpanded.current();

    setTimeout(() => {
      userTabRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 100);
  };

  return (
    <FindMeContext.Provider
      value={{
        findMe,
        handleCategoryExpanded,
        handleChannelExpanded,
        userTabRef,
      }}
    >
      {children}
    </FindMeContext.Provider>
  );
};

FindMeProvider.displayName = 'FindMeProvider';

export default FindMeProvider;
