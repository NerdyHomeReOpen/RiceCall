import React, { useEffect, useContext, createContext, ReactNode } from 'react';

// Utils
import {
  applyThemeToReactState,
  THEME_CHANGE_EVENT,
} from '@/utils/themeStorage';

interface ThemeContextType {
  backgroundColor: string | null;
  backgroundImage: string | null;
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
  const [backgroundColor, setBackgroundColor] = React.useState<string | null>(
    null,
  );
  const [backgroundImage, setBackgroundImage] = React.useState<string | null>(
    null,
  );

  // Effects
  useEffect(() => {
    applyThemeToReactState({
      setBackgroundColor,
      setBackgroundImage,
    });

    const onThemeChange = () => {
      applyThemeToReactState({
        setBackgroundColor,
        setBackgroundImage,
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
      style={{
        'width': '100%',
        'height': '100%',
        '--main-color': backgroundColor,
        '--secondary-color': backgroundColor,
        '--header-image': backgroundImage,
      }}
    >
      <ThemeContext.Provider value={{ backgroundColor, backgroundImage }}>
        {children}
      </ThemeContext.Provider>
    </div>
  );
};

ThemeProvider.displayName = 'ThemeProvider';

export default ThemeProvider;
