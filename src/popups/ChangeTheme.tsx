import React, { useEffect, useRef, useState } from 'react';

// CSS
import styles from '@/styles/changeTheme.module.css';
import popup from '@/styles/popup.module.css';

// Types
import { Theme } from '@/types';

// Services
import ipc from '@/services/ipc.service';

// Providers
import { useContextMenu } from '@/providers/ContextMenu';
import { useTranslation } from 'react-i18next';

// Utils
import { getDominantColor, getContrastColor, getVisibleColor, toRGBString, type RGB } from '@/utils/color';
import { handleOpenImageCropper } from '@/utils/popup';

const ChangeThemePopup: React.FC = React.memo(() => {
  // Hooks
  const contextMenu = useContextMenu();
  const { t } = useTranslation();

  // Refs
  const isSelectingColorRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorSelectorRef = useRef<HTMLDivElement>(null);

  // States
  const [hoveredThemeIndex, setHoveredThemeIndex] = useState<number | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [pickedColor, setPickedColor] = useState<RGB>({ r: 0, g: 0, b: 0 });
  const [customThemes, setCustomThemes] = useState<Theme[]>(Array.from({ length: 7 }));

  // Handlers
  const handleSelectTheme = (event: React.MouseEvent<HTMLDivElement>) => {
    const clickedElement = event.currentTarget;
    const computedStyle = window.getComputedStyle(clickedElement as Element);
    const headerImage = computedStyle.getPropertyValue('--header-image');
    const mainColor = computedStyle.getPropertyValue('--main-color');
    const secondaryColor = computedStyle.getPropertyValue('--secondary-color');

    ipc.customThemes.current.set({ headerImage, mainColor, secondaryColor });
  };

  const handleSaveSelectedColor = () => {
    const headerImage = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 20;
      canvas.height = 20;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = `rgb(${pickedColor.r} ${pickedColor.g} ${pickedColor.b})`;
      ctx.fillRect(0, 0, 20, 20);
      return canvas.toDataURL('webp', 1);
    };
    const visibleColor = getVisibleColor(pickedColor);
    const contrastColor = getContrastColor(pickedColor);

    const newTheme: Theme = {
      headerImage: `url(${headerImage()})`,
      mainColor: toRGBString(visibleColor),
      secondaryColor: toRGBString(contrastColor),
    };

    ipc.customThemes.current.set(newTheme);
    ipc.customThemes.add(newTheme);
    setShowColorPicker(false);
  };

  const handleRemoveCustom = (index: number) => {
    ipc.customThemes.delete(index);
  };

  const handleColorSelect = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!colorSelectorRef.current || !isSelectingColorRef.current) return;
    const rect = colorSelectorRef.current.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const imgSrc = '/skin_palette.webp';
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
        const safeOffsetX = Math.max(0, Math.min(offsetX, img.naturalWidth - 1));
        const safeOffsetY = Math.max(0, Math.min(offsetY, img.naturalHeight - 1));
        const pixelData = ctx.getImageData(safeOffsetX, safeOffsetY, 1, 1).data;
        const color: RGB = { r: pixelData[0], g: pixelData[1], b: pixelData[2] };
        setPickedColor(color);
      }
    };
    img.onerror = () => {
      console.error(`Error loading color selector image: ${imgSrc}`);
    };
  };

  const handleUploadImage = async (imageUnit8Array: Uint8Array) => {
    const blob = new Blob([imageUnit8Array], { type: 'image/webp' });
    const imageUrl = URL.createObjectURL(blob);
    const dominantColor = await getDominantColor(imageUrl);
    const visibleColor = getVisibleColor(dominantColor);
    const contrastColor = getContrastColor(dominantColor);

    const newTheme: Theme = {
      headerImage: `url(${imageUrl})`,
      mainColor: toRGBString(visibleColor),
      secondaryColor: toRGBString(contrastColor),
    };

    ipc.customThemes.current.set(newTheme);
    ipc.customThemes.add(newTheme);
  };

  // Effects
  useEffect(() => {
    const changeCustomTheme = (customThemes: Theme[]) => {
      console.info('[Custom Themes] custom themes updated: ', customThemes);
      setCustomThemes(customThemes);
    };
    changeCustomTheme(ipc.customThemes.get());
    const unsub = ipc.customThemes.onUpdate(changeCustomTheme);
    return () => unsub();
  }, []);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (e.target === colorSelectorRef.current) {
        isSelectingColorRef.current = true;
      }
    };
    const onPointerUp = () => {
      isSelectingColorRef.current = false;
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointerup', onPointerUp);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={styles['ct-wrapper']}>
          <div className={styles['ct-contain']}>
            <div className={styles['theme-selector']}>
              <div className={styles['theme-options']}>
                <div className={styles['theme-slots-big']}>
                  {/* Default Themes (Big) */}
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={styles['theme']}
                      data-theme-index={i}
                      onClick={handleSelectTheme}
                      onMouseEnter={() => setHoveredThemeIndex(i)}
                      onMouseLeave={() => setHoveredThemeIndex(null)}
                    >
                      {hoveredThemeIndex === i && (
                        <div className={styles['theme-description']}>
                          {i === 0 && t('pink-memory')}
                          {i === 1 && t('pure-childhood')}
                          {i === 2 && t('cute-cat')}
                          {i === 3 && t('that-year')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className={styles['theme-slots-small']}>
                  {/* Default Themes (Small) */}
                  {Array.from({ length: 15 }, (_, i) => (
                    <div key={i + 4} className={styles['theme']} data-theme-index={i + 4} onClick={handleSelectTheme} />
                  ))}

                  {/* Color Selector */}
                  <div className={styles['color-selector']} onClick={() => setShowColorPicker((prev) => !prev)} />

                  {/* Custom Colors */}
                  {customThemes.slice(0, 7).map((customTheme, i) => {
                    // Handlers
                    const getContextMenuItems = () => [
                      {
                        id: 'delete',
                        label: t('delete'),
                        onClick: () => handleRemoveCustom(i),
                      },
                    ];

                    return customTheme ? (
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
                        onClick={handleSelectTheme}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          const x = e.clientX;
                          const y = e.clientY;
                          contextMenu.showContextMenu(x, y, 'right-bottom', getContextMenuItems());
                        }}
                      />
                    ) : (
                      <div key={`color-box-empty-${i}`} />
                    );
                  })}

                  {/* Image Selector */}
                  <div className={styles['image-selector']} onClick={() => fileInputRef.current?.click()} />
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/png, image/jpg, image/jpeg, image/webp"
                    onChange={(e) => {
                      const image = e.target.files?.[0];
                      if (!image) return;
                      image.arrayBuffer().then((arrayBuffer) => {
                        handleOpenImageCropper(new Uint8Array(arrayBuffer), handleUploadImage);
                      });
                    }}
                  />
                </div>

                {showColorPicker && (
                  <div className={styles['color-selector-box']}>
                    <div ref={colorSelectorRef} className={styles['color-selector-image']} onMouseDown={handleColorSelect} onMouseMove={handleColorSelect} />
                    <div className={styles['color-selector-footer']}>
                      <div className={styles['color-selected-color']} style={{ backgroundColor: toRGBString(pickedColor) }} />
                      <div className={styles['color-selected-btn']}>
                        <div className={styles['color-selected-save']} onClick={handleSaveSelectedColor} />
                        <div className={styles['color-selected-cancel']} onClick={() => setShowColorPicker(false)} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ChangeThemePopup.displayName = 'ChangeThemePopup';

export default ChangeThemePopup;
