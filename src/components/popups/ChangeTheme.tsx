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
  headerImage: string;
  mainColor: string;
  secondaryColor: string;
}

function getDominantColor(url: string): Promise<[number, number, number]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const colorCount: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const key = `${r},${g},${b}`;
        colorCount[key] = (colorCount[key] || 0) + 1;
      }

      const dominant = Object.entries(colorCount).sort(
        (a, b) => b[1] - a[1],
      )[0][0];
      const [r, g, b] = dominant.split(',').map(Number);
      resolve([r, g, b]);
    };

    img.onerror = reject;
  });
}

function getSimilarColor([r, g, b]: [number, number, number]): string {
  return `rgb(${r}, ${g}, ${b})`;
}

function getContrastColor([r, g, b]: [number, number, number]): string {
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? 'black' : 'white';
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
  const [pickedColor, setPickedColor] = useState<[number, number, number]>([
    0, 0, 0,
  ]);
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
    const computedStyle = window.getComputedStyle(clickedElement as Element);
    const headerImage = computedStyle.getPropertyValue('--header-image');
    const mainColor = computedStyle.getPropertyValue('--main-color');
    const secondaryColor = computedStyle.getPropertyValue('--secondary-color');

    setThemeValue('theme-main-color', mainColor);
    setThemeValue('theme-secondary-color', secondaryColor);
    setThemeValue('theme-header-image', headerImage);
  };

  const handleSaveSelectedImage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const dominantColor = await getDominantColor(base64String);
      const similarColor = getSimilarColor(dominantColor);
      const contrastColor = getContrastColor(dominantColor);
      const newTheme: Theme = {
        headerImage: `url(${base64String})`,
        mainColor: similarColor,
        secondaryColor: contrastColor,
      };

      if (customThemes.unshift(newTheme) >= 7) customThemes.length = 7;

      setThemeValue('theme-header-image', newTheme.headerImage);
      setThemeValue('theme-main-color', newTheme.mainColor);
      setThemeValue('theme-secondary-color', newTheme.secondaryColor);
      setCustomThemes(customThemes);
      localStorage.setItem('custom-themes', JSON.stringify(customThemes));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSelectedColor = () => {
    if (!pickedColor) return;

    const contrastColor = getContrastColor(pickedColor);
    const similarColor = getSimilarColor(pickedColor);

    const newTheme: Theme = {
      headerImage: '',
      mainColor: similarColor,
      secondaryColor: contrastColor,
    };

    if (customThemes.unshift(newTheme) >= 7) customThemes.length = 7;

    setThemeValue('theme-header-image', '');
    setThemeValue('theme-main-color', newTheme.mainColor);
    setThemeValue('theme-secondary-color', newTheme.secondaryColor);
    setCustomThemes(customThemes);
    setShowColorPicker(false);
    localStorage.setItem('custom-themes', JSON.stringify(customThemes));
  };

  const handleRemoveCustom = (index: number) => {
    if (index !== null) {
      const newThemes = customThemes;
      newThemes[index] = undefined as unknown as Theme;
      setCustomThemes(newThemes);
      localStorage.setItem('custom-themes', JSON.stringify(newThemes));
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
        const color: [number, number, number] = [
          pixelData[0],
          pixelData[1],
          pixelData[2],
        ];
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

    const localTheme = localStorage.getItem('custom-themes');

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
                          style={
                            {
                              'backgroundColor': customTheme.mainColor,
                              'backgroundImage': customTheme.headerImage,
                              '--main-color': customTheme.mainColor,
                              '--secondary-color': customTheme.secondaryColor,
                              '--header-image': customTheme.headerImage,
                            } as React.CSSProperties
                          }
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
                      onMouseLeave={() => setIsSelectingColor(false)}
                    />
                    <div className={changeTheme['colorSelectorFooter']}>
                      <div
                        className={changeTheme['colorSelectedColor']}
                        style={{
                          backgroundColor: `rgb(${pickedColor[0]}, ${pickedColor[1]}, ${pickedColor[2]})`,
                        }}
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
