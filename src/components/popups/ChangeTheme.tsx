import React, { useEffect, useRef, useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import changeTheme from '@/styles/popups/changeTheme.module.css';

// Services
import ipcService from '@/services/ipc.service';

// Providers
import { setThemeValue, removeThemeValue } from '@/utils/themeStorage';

interface ChangeThemePopupProps {
  title: React.ReactNode;
  submitTo: string;
}

const ChangeThemePopup: React.FC<ChangeThemePopupProps> = ({ submitTo }) => {
  // Refs
  const containerRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [hoveredThemeIndex, setHoveredThemeIndex] = useState<number | null>(
    null,
  );

  // Handlers
  const handleSubmit = () => {
    ipcService.popup.submit(submitTo);
    handleClose();
  };
  const handleClose = () => {
    ipcService.window.close();
  };
  const handleChangeTheme = (index: number) => {
    setThemeValue('selectedTheme', `theme-${index}`);
    removeThemeValue('selectedThemeColor');
    removeThemeValue('customThemeImage');
  };
  const handleColorBoxClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const clickedElement = event.currentTarget;
    const color = window.getComputedStyle(clickedElement).backgroundColor;

    if (color) {
      setThemeValue('selectedThemeColor', color);
      removeThemeValue('selectedTheme');
      removeThemeValue('customThemeImage');
    }
  };
  const handleAddCustomImageClick = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setThemeValue('customThemeImage', base64String);
        removeThemeValue('selectedTheme');
        removeThemeValue('selectedThemeColor');
      };
      reader.readAsDataURL(file);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  // Effects
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
                      onClick={() => handleChangeTheme(i)}
                      onMouseEnter={() => setHoveredThemeIndex(i)}
                      onMouseLeave={() => setHoveredThemeIndex(null)}
                    >
                      {hoveredThemeIndex === i && (
                        <div className={changeTheme['themeDescription']}>
                          {i === 1 && '粉紅回憶'}
                          {i === 2 && '純真童年'}
                          {i === 3 && '可愛貓咪'}
                          {i === 4 && '那一年'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div
                  className={`${changeTheme['themeImages']} ${changeTheme['small']}`}
                >
                  {Array.from({ length: 8 }, (_, i) => (
                    <div
                      key={i + 5}
                      className={changeTheme[`themePreview-${i + 5}`]}
                      onClick={() => handleChangeTheme(i + 5)}
                    />
                  ))}
                </div>

                <div className={changeTheme['themeColors']}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={`color-${i}`}
                      className={changeTheme['colorBox']}
                      onClick={handleColorBoxClick}
                    />
                  ))}
                  <div
                    className={changeTheme['addColorBtn']}
                    onClick={handleAddCustomImageClick}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

ChangeThemePopup.displayName = 'ChangeThemePopup';

export default ChangeThemePopup;
