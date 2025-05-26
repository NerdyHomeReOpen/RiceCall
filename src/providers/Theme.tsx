import React, { useEffect, useContext, createContext, ReactNode } from 'react';

// Utils
import {
  applyThemeToReactState,
  THEME_CHANGE_EVENT,
} from '@/utils/themeStorage';

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
  const [secondaryColor, setSecondaryColor] = React.useState<string | null>(
    null,
  );

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

  return (
    <div
      style={
        {
          'width': '100%',
          'height': '100%',
          '--main-color': mainColor,
          '--secondary-color': secondaryColor,
          '--header-image': headerImage,
          'color': 'var(--secondary-color)',
        } as React.CSSProperties
      }
    >
      <ThemeContext.Provider value={{ headerImage, mainColor, secondaryColor }}>
        {children}
      </ThemeContext.Provider>
    </div>
  );
};

ThemeProvider.displayName = 'ThemeProvider';

export default ThemeProvider;
