import React, { useEffect, useRef } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import changeTheme from '@/styles/popups/changeTheme.module.css';

// Services
import ipcService from '@/services/ipc.service';

// Providers
import { useLanguage } from '@/providers/Language';
import { setThemeValue, removeThemeValue } from '@/utils/themeStorage';

interface ChangeThemePopupProps {
  title: React.ReactNode;
  submitTo: string;
}

const ChangeThemePopup: React.FC<ChangeThemePopupProps> = ({ submitTo }) => {
  const lang = useLanguage();
  const containerRef = useRef<HTMLFormElement>(null);

  const handleSubmit = () => {
    ipcService.popup.submit(submitTo);
    handleClose();
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  const changeThemes = (index: number) => {
    setThemeValue('selectedTheme', `theme-${index}`);
    removeThemeValue('selectedThemeColor');
    removeThemeValue('customThemeImage');
  };

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  return (
    <form
      className={popup['popupContainer']}
      tabIndex={0}
      ref={containerRef}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleSubmit();
      }}
    >
      <div className={popup['popupBody']}>
        <div className={changeTheme['ctWrapper']}>
          <div className={changeTheme['ctContain']}>
            <div className={changeTheme['themeSelector']}>
              <div className={changeTheme['themeOptions']}>
                <div
                  className={`${changeTheme['themeImages']} ${changeTheme['big']}`}
                >
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={changeTheme[`themePreview-${i}`]}
                      onClick={() => changeThemes(i)}
                    />
                  ))}
                </div>
                <div
                  className={`${changeTheme['themeImages']} ${changeTheme['small']}`}
                >
                  {Array.from({ length: 8 }, (_, i) => (
                    <div
                      key={i + 5}
                      className={changeTheme[`themePreview-${i + 5}`]}
                      onClick={() => changeThemes(i + 5)}
                    />
                  ))}
                </div>

                <div className={changeTheme['themeColors']}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={changeTheme['colorBox']} />
                  ))}
                  <div className={changeTheme['addColorBtn']} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={popup['popupFooter']}>
        <button className={popup['button']} onClick={handleSubmit}>
          {lang.tr.confirm}
        </button>
      </div>
    </form>
  );
};

ChangeThemePopup.displayName = 'ChangeThemePopup';

export default ChangeThemePopup;
