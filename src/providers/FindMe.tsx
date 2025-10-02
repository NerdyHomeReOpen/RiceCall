import { createContext, useContext, useRef, useState } from 'react';

interface FindMeContextType {
  findMe: () => void;
  handleCategoryExpanded: React.RefObject<() => void>;
  handleChannelExpanded: React.RefObject<() => void>;
  userTabRef: React.RefObject<HTMLDivElement | null>;
  isUserSelected: boolean;
  setUserSelected: (v: boolean) => void;
}

const FindMeContext = createContext<FindMeContextType | null>(null);

export const useFindMeContext = () => {
  const context = useContext(FindMeContext);
  if (!context) throw new Error('useFindMeContext must be used within an FindMeProvider');
  return context;
};

const FindMeProvider = ({ children }: { children: React.ReactNode }) => {
  const handleCategoryExpanded = useRef<() => void>(() => {});
  const handleChannelExpanded = useRef<() => void>(() => {});
  const userTabRef = useRef<HTMLDivElement>(null);

  const [isUserSelected, setUserSelected] = useState(false);

  const findMe = () => {
    handleCategoryExpanded.current();
    handleChannelExpanded.current();
    setTimeout(() => {
      const el = userTabRef.current;
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
      setUserSelected(true);
    }, 150);
  };

  return (
    <FindMeContext.Provider
      value={{
        findMe,
        handleCategoryExpanded,
        handleChannelExpanded,
        userTabRef,
        isUserSelected,
        setUserSelected,
      }}
    >
      {children}
    </FindMeContext.Provider>
  );
};

FindMeProvider.displayName = 'FindMeProvider';
export default FindMeProvider;
