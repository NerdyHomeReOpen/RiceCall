import React, { useEffect, useRef, useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import changeTheme from '@/styles/popups/changeTheme.module.css';

// Services
import ipcService from '@/services/ipc.service';

// Providers
import { setThemeValue } from '@/utils/themeStorage';
import { useContextMenu } from '@/providers/ContextMenu';

interface ChangeThemePopupProps {
  submitTo: string;
}

interface Theme {
  backgroundColor: string;
  backgroundImage: string;
}

const ChangeThemePopup: React.FC<ChangeThemePopupProps> = ({ submitTo }) => {
  // Hooks
  const contextMenu = useContextMenu();

  // Refs
  const containerRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorSelectorRef = useRef<HTMLDivElement>(null);

  // States
  const [hoveredThemeIndex, setHoveredThemeIndex] = useState<number | null>(
    null,
  );
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [pickedColor, setPickedColor] = useState<string>('#000000');
  const [customThemes, setCustomThemes] = useState<Theme[]>(
    Array.from({ length: 7 }),
  );
  const [isSelectingColor, setIsSelectingColor] = useState<boolean>(false);

  // Handlers
  const handleSubmit = () => {
    ipcService.popup.submit(submitTo);
    handleClose();
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  const handleSelectTheme = (event: React.MouseEvent<HTMLDivElement>) => {
    const clickedElement = event.currentTarget;
    const image = window.getComputedStyle(clickedElement).backgroundImage;
    const color = window.getComputedStyle(clickedElement).backgroundColor;

    setThemeValue('themeColor', color);
    setThemeValue('themeImage', image);
  };

  const handleSaveSelectedImage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const newTheme: Theme = {
        backgroundColor: '#000000',
        backgroundImage: `url(${base64String})`,
      };

      if (customThemes.unshift(newTheme) >= 7) customThemes.length = 7;

      setThemeValue('themeColor', newTheme.backgroundColor);
      setThemeValue('themeImage', newTheme.backgroundImage);
      setCustomThemes(customThemes);
      localStorage.setItem('customThemes', JSON.stringify(customThemes));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSelectedColor = () => {
    if (!pickedColor) return;

    const newTheme: Theme = {
      backgroundColor: pickedColor,
      backgroundImage: '',
    };

    if (customThemes.unshift(newTheme) >= 7) customThemes.length = 7;

    setThemeValue('themeColor', newTheme.backgroundColor);
    setThemeValue('themeImage', newTheme.backgroundImage);
    setCustomThemes(customThemes);
    setShowColorPicker(false);
    localStorage.setItem('customThemes', JSON.stringify(customThemes));
  };

  const handleRemoveCustom = (index: number) => {
    if (index !== null) {
      const newThemes = customThemes.filter((_, i) => i !== index);
      setCustomThemes(newThemes);
      localStorage.setItem('customThemes', JSON.stringify(newThemes));
    }
  };

  const handleColorSelect = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!colorSelectorRef.current) return;
    const rect = colorSelectorRef.current.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const imgSrc = '/skin_palette.png';
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imgSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
        const safeOffsetX = Math.max(
          0,
          Math.min(offsetX, img.naturalWidth - 1),
        );
        const safeOffsetY = Math.max(
          0,
          Math.min(offsetY, img.naturalHeight - 1),
        );
        const pixelData = ctx.getImageData(safeOffsetX, safeOffsetY, 1, 1).data;
        const color = `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;
        setPickedColor(color);
      }
    };
    img.onerror = () => {
      console.error('載入顏色選擇器圖片時發生錯誤。');
    };
  };

  // Effects
  useEffect(() => {
    containerRef.current?.focus();

    const localTheme = localStorage.getItem('customThemes');

    if (localTheme) {
      const themes = JSON.parse(localTheme);
      setCustomThemes(themes);
    }
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
      {/* Body */}
      <div className={popup['popupBody']}>
        <div className={changeTheme['ctWrapper']}>
          <div className={changeTheme['ctContain']}>
            <div className={changeTheme['themeSelector']}>
              <div className={changeTheme['themeOptions']}>
                <div className={changeTheme['themeSlotsBig']}>
                  {/* Default Themes (Big) */}
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={changeTheme['theme']}
                      data-theme-index={i}
                      onClick={(e) => handleSelectTheme(e)}
                      onMouseEnter={() => setHoveredThemeIndex(i)}
                      onMouseLeave={() => setHoveredThemeIndex(null)}
                    >
                      {hoveredThemeIndex === i && (
                        <div className={changeTheme['themeDescription']}>
                          {i === 0 && '粉紅回憶'}
                          {i === 1 && '純真童年'}
                          {i === 2 && '可愛貓咪'}
                          {i === 3 && '那一年'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className={changeTheme['themeSlotsSmall']}>
                  {/* Default Themes (Small) */}
                  {Array.from({ length: 15 }, (_, i) => (
                    <div
                      key={i + 4}
                      className={changeTheme['theme']}
                      data-theme-index={i + 4}
                      onClick={(e) => handleSelectTheme(e)}
                    />
                  ))}

                  {/* Color Selector */}
                  <div
                    className={changeTheme['colorSelector']}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                  />

                  {/* Custom Colors */}
                  {customThemes.slice(0, 7).map((_, i) => {
                    const customTheme = customThemes[i];
                    if (customTheme) {
                      return (
                        <div
                          key={`custom-${i}`}
                          style={{
                            backgroundColor: customTheme.backgroundColor,
                            backgroundImage: customTheme.backgroundImage,
                          }}
                          onClick={(e) => handleSelectTheme(e)}
                          onContextMenu={(e) => {
                            contextMenu.showContextMenu(
                              e.clientX,
                              e.clientY,
                              false,
                              false,
                              [
                                {
                                  id: 'remove-custom-color',
                                  label: '刪除',
                                  onClick: () => handleRemoveCustom(i),
                                },
                              ],
                            );
                          }}
                        />
                      );
                    } else {
                      return <div key={`color-box-empty-${i}`} />;
                    }
                  })}

                  {/* Image Selector */}
                  <div
                    className={changeTheme['imageSelector']}
                    onClick={() => fileInputRef.current?.click()}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleSaveSelectedImage}
                  />
                </div>

                {showColorPicker && (
                  <div className={changeTheme['colorSelectorBox']}>
                    <div
                      ref={colorSelectorRef}
                      className={changeTheme['colorSelectorImage']}
                      onMouseDown={(e) => {
                        handleColorSelect(e);
                        setIsSelectingColor(true);
                      }}
                      onMouseUp={() => setIsSelectingColor(false)}
                      onMouseMove={(e) => {
                        if (isSelectingColor) handleColorSelect(e);
                      }}
                    />
                    <div className={changeTheme['colorSelectorFooter']}>
                      <div
                        className={changeTheme['colorSelectedColor']}
                        style={{ backgroundColor: pickedColor }}
                      />
                      <div className={changeTheme['colorSelectedBtn']}>
                        <div
                          className={changeTheme['colorSelectedSave']}
                          onClick={() => handleSaveSelectedColor()}
                        />
                        <div
                          className={changeTheme['colorSelectedCancel']}
                          onClick={() => setShowColorPicker(false)}
                        />
                      </div>
                    </div>
                  </div>
                )}
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
