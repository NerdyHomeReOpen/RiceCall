import React, { useEffect, useRef, useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import changeTheme from '@/styles/popups/changeTheme.module.css';

// Services
import ipcService from '@/services/ipc.service';

// Providers
import { setThemeValue, removeThemeValue } from '@/utils/themeStorage';

// Components
import ContextMenu from '@/components/ContextMenu';

// Types
import { ContextMenuItem } from '@/types';

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
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [pickedColor, setPickedColor] = useState<string>('#000000');
  const [customAppliedColors, setCustomAppliedColors] = useState<
    (string | null)[]
  >(() => {
    const storedColors = localStorage.getItem('customAppliedColors');
    if (storedColors) {
      try {
        const parsedColors = JSON.parse(storedColors);
        if (Array.isArray(parsedColors) && parsedColors.length === 7) {
          return parsedColors;
        }
      } catch (e) {
        console.error('解析 localStorage customAppliedColors 出錯', e);
      }
    }
    return Array(7).fill(null);
  });
  const [contextMenuVisible, setContextMenuVisible] = useState<boolean>(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [contextMenuTargetIndex, setContextMenuTargetIndex] = useState<
    number | null
  >(null);

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
    const color = window.getComputedStyle(clickedElement).background;

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
  const handleColorCustomClick = () => {
    setShowColorPicker(!showColorPicker);
  };
  const handleColorSelectorImageClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    const imageElement = event.currentTarget;
    const rect = imageElement.getBoundingClientRect();
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
  const handleSavePickedColor = () => {
    if (pickedColor) {
      setThemeValue('selectedThemeColor', pickedColor);
      removeThemeValue('selectedTheme');
      removeThemeValue('customThemeImage');
      const updatedColors = [...customAppliedColors];
      const targetSlotIndex = updatedColors.findIndex(
        (color) => color === null,
      );
      if (targetSlotIndex !== -1) {
        updatedColors[targetSlotIndex] = pickedColor;
      } else {
        updatedColors[0] = pickedColor;
      }
      setCustomAppliedColors(updatedColors);
      localStorage.setItem(
        'customAppliedColors',
        JSON.stringify(updatedColors),
      );
    }
    setShowColorPicker(false);
  };
  const handleCancelPickColor = () => {
    setShowColorPicker(false);
  };
  const handleCustomColorRightClick = (
    event: React.MouseEvent<HTMLDivElement>,
    indexInCustomArray: number,
  ) => {
    event.preventDefault();
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setContextMenuTargetIndex(indexInCustomArray);
    setContextMenuVisible(true);
  };
  const handleRemoveCustomColor = () => {
    if (contextMenuTargetIndex !== null) {
      const newAppliedColors = [...customAppliedColors];
      newAppliedColors[contextMenuTargetIndex] = null;
      setCustomAppliedColors(newAppliedColors);
      localStorage.setItem(
        'customAppliedColors',
        JSON.stringify(newAppliedColors),
      );
    }
    setContextMenuVisible(false);
    setContextMenuTargetIndex(null);
  };
  const handleCloseContextMenu = () => {
    setContextMenuVisible(false);
    setContextMenuTargetIndex(null);
  };

  // Effects
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenuVisible) {
        handleCloseContextMenu();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenuVisible]);

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
                  {Array.from({ length: 15 }).map((_, i) => {
                    if (i === 7) {
                      return (
                        <div
                          key={`color-custom-${i}`}
                          className={`${changeTheme['colorBox']} ${changeTheme['colorCustom']}`}
                          onClick={handleColorCustomClick}
                        ></div>
                      );
                    } else {
                      const isEmptyPlaceholder = i >= 8;
                      if (isEmptyPlaceholder) {
                        const customSlotIndex = i - 8;
                        const customColor =
                          customAppliedColors[customSlotIndex];
                        if (customColor) {
                          return (
                            <div
                              key={`color-box-custom-filled-${i}`}
                              className={changeTheme['colorBox']}
                              style={{ backgroundColor: customColor }}
                              onClick={handleColorBoxClick}
                              onContextMenu={(e) =>
                                handleCustomColorRightClick(e, customSlotIndex)
                              }
                            />
                          );
                        } else {
                          return (
                            <div
                              key={`color-box-empty-${i}`}
                              className={`${changeTheme['colorBox']} ${changeTheme['emptyColorBox']}`}
                            />
                          );
                        }
                      } else {
                        return (
                          <div
                            key={`color-box-predefined-${i}`}
                            className={changeTheme['colorBox']}
                            onClick={handleColorBoxClick}
                          />
                        );
                      }
                    }
                  })}
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
                {showColorPicker && (
                  <div className={changeTheme['colorSelectorBox']}>
                    <div
                      className={changeTheme['colorSelectorImage']}
                      onClick={handleColorSelectorImageClick}
                    ></div>
                    <div className={changeTheme['colorSelectorFooter']}>
                      <div
                        className={changeTheme['colorSelectedColor']}
                        style={{ backgroundColor: pickedColor }}
                      ></div>
                      <div className={changeTheme['colorSelectedBtn']}>
                        <div
                          className={changeTheme['colorSelectedSave']}
                          onClick={handleSavePickedColor}
                        ></div>
                        <div
                          className={changeTheme['colorSelectedCancel']}
                          onClick={handleCancelPickColor}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                {contextMenuVisible && contextMenuTargetIndex !== null && (
                  <ContextMenu
                    x={contextMenuPosition.x}
                    y={contextMenuPosition.y}
                    items={
                      [
                        {
                          id: 'remove-color',
                          label: '移除顏色',
                          onClick: handleRemoveCustomColor,
                        },
                      ] as ContextMenuItem[]
                    }
                    onClose={handleCloseContextMenu}
                  />
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
