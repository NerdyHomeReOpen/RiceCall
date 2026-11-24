import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import Logger from '@/utils/logger';

import { openImageCropper } from '@/services';

import { useContextMenu } from '@/providers/ContextMenu';

import { getDominantColor, getVisibleColor, getContrastColor, toRGBString, RGB } from '@/utils/color';

// Preset theme tiles: handleThemeSelect reads --header-image / --main-color / --secondary-color back with getComputedStyle.
const PRESET_THEMES = [
  "bg-black bg-[url('/skin/57KJ57SF5Zue5oa2_preview.svg')] [--header-image:url('/skin/57KJ57SF5Zue5oa2.svg')] [--main-color:#f6e6d7] [--secondary-color:#000]",
  "bg-black bg-[url('/skin/57SU55yf56ul5bm0_preview.svg')] [--header-image:url('/skin/57SU55yf56ul5bm0.svg')] [--main-color:#1b71ac] [--secondary-color:#fff]",
  "bg-black bg-[url('/skin/5Y+v5oSb6LKT5ZKq_preview.svg')] [--header-image:url('/skin/5Y+v5oSb6LKT5ZKq.svg')] [--main-color:#efd1ab] [--secondary-color:#000]",
  "bg-black bg-[url('/skin/6YKj5LiA5bm0_preview.svg')] [--header-image:url('/skin/6YKj5LiA5bm0.svg')] [--main-color:#d4be99] [--secondary-color:#000]",
  "bg-black bg-[url('/skin/img_greenmood_preview.svg')] [--header-image:url('/skin/img_greenmood.svg')] [--main-color:#89c68b] [--secondary-color:#000]",
  "bg-black bg-[url('/skin/img_sunflower_preview.svg')] [--header-image:url('/skin/img_sunflower.svg')] [--main-color:#edd569] [--secondary-color:#000]",
  "bg-black bg-[url('/skin/img_sunset_preview.svg')] [--header-image:url('/skin/img_sunset.svg')] [--main-color:#7464ad] [--secondary-color:#000]",
  "bg-black bg-[url('/skin/img_colddrink_preview.svg')] [--header-image:url('/skin/img_colddrink.svg')] [--main-color:#e3908f] [--secondary-color:#000]",
  "bg-black bg-[url('/skin/img_pebble_preview.svg')] [--header-image:url('/skin/img_pebble.svg')] [--main-color:#a4cfd5] [--secondary-color:#000]",
  "bg-black bg-[url('/skin/img_love_preview.svg')] [--header-image:url('/skin/img_love.svg')] [--main-color:#aa7a52] [--secondary-color:#000]",
  "bg-black bg-[url('/skin/img_hamburger_preview.svg')] [--header-image:url('/skin/img_hamburger.svg')] [--main-color:#591234] [--secondary-color:#fff]",
  "bg-black bg-[url('/skin/img_coastline_preview.svg')] [--header-image:url('/skin/img_coastline.svg')] [--main-color:#313131] [--secondary-color:#fff]",
  'bg-black bg-[linear-gradient(to_bottom,#0073c6,#0073c6)] [--header-image:linear-gradient(to_bottom,#0073c6,#0073c6)] [--main-color:#0073c6] [--secondary-color:#fff]',
  'bg-black bg-[linear-gradient(to_bottom,#6d95da,#6d95da)] [--header-image:linear-gradient(to_bottom,#6d95da,#6d95da)] [--main-color:#6d95da] [--secondary-color:#fff]',
  'bg-black bg-[linear-gradient(to_bottom,#91b719,#729714)] [--header-image:linear-gradient(to_bottom,#91b719,#729714)] [--main-color:#91b719] [--secondary-color:#fff]',
  'bg-black bg-[linear-gradient(to_bottom,#d7aa35,#c79c2d)] [--header-image:linear-gradient(to_bottom,#d7aa35,#c79c2d)] [--main-color:#d7aa35] [--secondary-color:#fff]',
  'bg-black bg-[linear-gradient(to_bottom,#f3c89a,#edc193)] [--header-image:linear-gradient(to_bottom,#f3c89a,#edc193)] [--main-color:#f3c89a] [--secondary-color:#fff]',
  'bg-black bg-[linear-gradient(to_bottom,#d74a33,#c8412b)] [--header-image:linear-gradient(to_bottom,#d74a33,#c8412b)] [--main-color:#d74a33] [--secondary-color:#fff]',
  'bg-black bg-[linear-gradient(to_bottom,#ae6b73,#ab6a72)] [--header-image:linear-gradient(to_bottom,#ae6b73,#ab6a72)] [--main-color:#ae6b73] [--secondary-color:#fff]',
];

const ChangeThemePopup: React.FC = React.memo(() => {
  const { t } = useTranslation();

  const isSelectingColorRef = useRef<boolean>(false);
  const ImageInputRef = useRef<HTMLInputElement>(null);
  const colorSelectorRef = useRef<HTMLDivElement>(null);

  const [isColorPickerVisible, setIsColorPickerVisible] = useState<boolean>(false);
  const [pickedColor, setPickedColor] = useState<RGB>({ r: 0, g: 0, b: 0 });
  const [customThemes, setCustomThemes] = useState<Types.Theme[]>(Array.from({ length: 7 }));

  const handleThemeSelect = (event: React.MouseEvent<HTMLDivElement>) => {
    const clickedElement = event.currentTarget;
    const computedStyle = window.getComputedStyle(clickedElement as Element);
    const headerImage = computedStyle.getPropertyValue('--header-image');
    const mainColor = computedStyle.getPropertyValue('--main-color');
    const secondaryColor = computedStyle.getPropertyValue('--secondary-color');

    ipc.customThemes.current.set({ headerImage, mainColor, secondaryColor });
  };

  const handleThemeRemove = (index: number) => {
    ipc.customThemes.delete(index);
  };

  const handleColorSelect = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!colorSelectorRef.current || !isSelectingColorRef.current) return;
    const rect = colorSelectorRef.current.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const imgSrc = '/skin_palette.svg';
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
      new Logger('COLOR_SELECTOR').error(`Error loading color selector image: ${imgSrc}`);
    };
  };

  const handleColorSaveBtnClick = () => {
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

    const newTheme: Types.Theme = {
      headerImage: `url(${headerImage()})`,
      mainColor: toRGBString(visibleColor),
      secondaryColor: toRGBString(contrastColor),
    };

    ipc.customThemes.current.set(newTheme);
    ipc.customThemes.add(newTheme);
    setIsColorPickerVisible(false);
  };

  const handleColorCancelBtnClick = () => {
    setIsColorPickerVisible(false);
  };

  const handleColorSelectBtnClick = () => {
    setIsColorPickerVisible((prev) => !prev);
  };

  const handleUploadImageBtnClick = () => {
    ImageInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const image = e.target.files?.[0];
    if (!image) return;
    image.arrayBuffer().then((arrayBuffer) => {
      openImageCropper(new Uint8Array(arrayBuffer), async (imageUnit8Array) => {
        const buffer = imageUnit8Array.buffer;
        const imageUrl = await ipc.customThemes.saveImage(buffer as ArrayBuffer, 'custom_themes', 'theme', 'webp').catch((e) => {
          const error = e instanceof Error ? e : new Error('Unknown error');
          new Logger('CHANGE_THEME').error(`Error saving image: ${error.message}`);
          return null;
        });

        if (imageUrl) {
          const dominantColor = await getDominantColor(imageUrl);
          const visibleColor = getVisibleColor(dominantColor);
          const contrastColor = getContrastColor(dominantColor);

          const newTheme: Types.Theme = {
            headerImage: `url(${imageUrl})`,
            mainColor: toRGBString(visibleColor),
            secondaryColor: toRGBString(contrastColor),
          };

          ipc.customThemes.current.set(newTheme);
          ipc.customThemes.add(newTheme);
        }
      });
    });
  };

  useEffect(() => {
    const changeCustomTheme = (customThemes: Types.Theme[]) => {
      new Logger('CUSTOM_THEMES').info(`Custom themes updated: ${customThemes}`);
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
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="flex flex-col h-full bg-[url('/channel/dialog_body_bg.svg')] bg-no-repeat bg-center bg-cover">
          <div className="flex w-full mr-[30px]">
            <div className="w-full m-px rounded-[8px]">
              <div>
                <div className="grid grid-cols-[repeat(4,1fr)]">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={`group relative h-[120px] cursor-pointer bg-no-repeat bg-position-[0_0] bg-cover border border-border hover:border-[#20a5d8] ${PRESET_THEMES[i]}`}
                      onClick={handleThemeSelect}
                    >
                      <div className="relative h-[120px] cursor-pointer bg-no-repeat bg-position-[0_0] bg-cover border border-border hover:border-[#20a5d8] hidden items-center justify-center w-full text-white bg-[#00000080] group-hover:flex">
                        {i === 0 && t('pink-memory')}
                        {i === 1 && t('pure-childhood')}
                        {i === 2 && t('cute-cat')}
                        {i === 3 && t('that-year')}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-[repeat(8,1fr)] gap-px w-full mt-px">
                  {Array.from({ length: 15 }, (_, i) => (
                    <div
                      key={i + 4}
                      className={`relative h-[60px] cursor-pointer bg-no-repeat bg-position-[0_0] bg-cover border border-border hover:border-[#20a5d8] ${PRESET_THEMES[i + 4]}`}
                      onClick={handleThemeSelect}
                    />
                  ))}
                  <div
                    className="relative h-[60px] cursor-pointer bg-no-repeat bg-position-[0_0] bg-cover border border-border hover:border-[#20a5d8] bg-[url('/palette.svg')]"
                    onClick={handleColorSelectBtnClick}
                  />
                  {customThemes.slice(0, 7).map((customTheme, i) => (
                    <CustomThemeItem key={`custom-${i}`} index={i} customTheme={customTheme} onThemeSelect={handleThemeSelect} onThemeRemove={handleThemeRemove} />
                  ))}
                  <div
                    className="relative h-[60px] cursor-pointer bg-no-repeat bg-position-[0_0] bg-cover border border-border hover:border-[#20a5d8] min-w-[60px] min-h-[60px] bg-[url('/user_defined.svg')] hover:bg-position-[-58px_0] active:bg-position-[-116px_0]"
                    onClick={handleUploadImageBtnClick}
                  />
                  <input type="file" ref={ImageInputRef} style={{ display: 'none' }} accept="image/png, image/jpg, image/jpeg, image/webp" onChange={handleImageChange} />
                </div>
                {isColorPickerVisible && (
                  <div className="absolute top-[100px] left-[100px] p-[5px] bg-background shadow-box-shadow">
                    <div
                      ref={colorSelectorRef}
                      className="w-[270px] h-[105px] cursor-crosshair bg-[url('/skin_palette.svg')] bg-no-repeat bg-position-[0_0] bg-cover"
                      onMouseDown={handleColorSelect}
                      onMouseMove={handleColorSelect}
                    />
                    <div className="flex items-center justify-between mt-[5px]">
                      <div className="w-[60px] h-[25px]" style={{ backgroundColor: toRGBString(pickedColor) }} />
                      <div className="flex items-center justify-between">
                        <div
                          className="w-[56px] h-[25px] mr-[3px] cursor-pointer border border-border bg-[url('/palette_ok.svg')] bg-no-repeat bg-center bg-auto hover:bg-hover"
                          onClick={handleColorSaveBtnClick}
                        />
                        <div
                          className="w-[56px] h-[25px] cursor-pointer border border-border bg-[url('/palette_cancel.svg')] bg-no-repeat bg-center bg-auto hover:bg-hover"
                          onClick={handleColorCancelBtnClick}
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
    </div>
  );
});

ChangeThemePopup.displayName = 'ChangeThemePopup';

export default ChangeThemePopup;

interface CustomThemeItemProps {
  index: number;
  customTheme: Types.Theme;
  onThemeSelect: (event: React.MouseEvent<HTMLDivElement>) => void;
  onThemeRemove: (index: number) => void;
}

const CustomThemeItem: React.FC<CustomThemeItemProps> = React.memo(({ index, customTheme, onThemeSelect, onThemeRemove }) => {
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();

  const handleThemeSelect = (e: React.MouseEvent<HTMLDivElement>) => {
    onThemeSelect(e);
  };

  const handleThemeContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { clientX: x, clientY: y } = e;
    showContextMenu(x, y, 'right-bottom', (() => [{ id: 'delete', label: t('delete'), onClick: () => onThemeRemove(index) }])());
  };

  return customTheme ? (
    <div
      className="relative h-[60px] cursor-pointer bg-no-repeat bg-position-[0_0] bg-cover border border-border hover:border-[#20a5d8]"
      style={
        {
          'backgroundColor': customTheme.mainColor,
          'backgroundImage': customTheme.headerImage,
          '--main-color': customTheme.mainColor,
          '--secondary-color': customTheme.secondaryColor,
          '--header-image': customTheme.headerImage,
        } as React.CSSProperties
      }
      onClick={handleThemeSelect}
      onContextMenu={handleThemeContextMenu}
    />
  ) : null;
});

CustomThemeItem.displayName = 'CustomThemeItem';
