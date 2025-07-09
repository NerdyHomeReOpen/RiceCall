import React, { useEffect, useContext, createContext, ReactNode } from 'react';

// Utils
import { applyThemeToReactState, THEME_CHANGE_EVENT } from '@/utils/themeStorage';

interface ThemeContextType {
  headerImage: string | null;
  mainColor: string | null;
  secondaryColor: string | null;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // States
  const [headerImage, setHeaderImage] = React.useState<string | null>(null);
  const [mainColor, setMainColor] = React.useState<string | null>(null);
  const [secondaryColor, setSecondaryColor] = React.useState<string | null>(null);

  // Effects
  useEffect(() => {
    applyThemeToReactState({
      setHeaderImage,
      setMainColor,
      setSecondaryColor,
    });

    const onThemeChange = () => {
      applyThemeToReactState({
        setHeaderImage,
        setMainColor,
        setSecondaryColor,
      });
    };

    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
    window.addEventListener('storage', onThemeChange);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
      window.removeEventListener('storage', onThemeChange);
    };
  }, []);

  useEffect(() => {
    document.body.style.setProperty('--main-color', mainColor, 'important');
    document.body.style.setProperty('--secondary-color', secondaryColor, 'important');
    document.body.style.setProperty('--header-image', headerImage, 'important');
  }, [headerImage, mainColor, secondaryColor]);

  return <ThemeContext.Provider value={{ headerImage, mainColor, secondaryColor }}>{children}</ThemeContext.Provider>;
};

ThemeProvider.displayName = 'ThemeProvider';

export default ThemeProvider;
