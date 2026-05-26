import React, { useLayoutEffect, useRef, useState } from 'react';
import { ColorResult, SketchPicker } from 'react-color';

import styles from './ColorPicker.module.css';

interface ColorPickerProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  onColorSelect: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = React.memo(({ x, y, direction, onColorSelect }) => {
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const [display, setDisplay] = useState<boolean>(false);
  const [positionX, setPositionX] = useState<number>(x);
  const [positionY, setPositionY] = useState<number>(y);
  const [color, setColor] = useState<string>('#FFFFFF');

  const handleColorChange = (color: ColorResult) => {
    setColor(color.hex);
    onColorSelect(color.hex);
  };

  useLayoutEffect(() => {
    if (!colorPickerRef.current) return;

    const { offsetWidth: pickerWidth, offsetHeight: pickerHeight } = colorPickerRef.current;
    const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
    const marginEdge = 10;

    let newPosX = x;
    let newPosY = y;

    if (direction === 'left-top' || direction === 'right-top') {
      newPosY -= pickerHeight;
    }
    if (direction === 'left-top' || direction === 'left-bottom') {
      newPosX -= pickerWidth;
    }

    if (newPosX + pickerWidth + marginEdge > windowWidth) {
      newPosX = windowWidth - pickerWidth - marginEdge;
    }
    if (newPosX < marginEdge) {
      newPosX = marginEdge;
    }
    if (newPosY + pickerHeight + marginEdge > windowHeight) {
      newPosY = windowHeight - pickerHeight - marginEdge;
    }
    if (newPosY < marginEdge) {
      newPosY = marginEdge;
    }

    setPositionX(newPosX);
    setPositionY(newPosY);
    setDisplay(true);
  }, [x, y, direction]);

  return (
    <div
      ref={colorPickerRef}
      className={`color-picker-container context-menu-container ${styles['color-picker']}`}
      style={display ? { left: positionX, top: positionY } : { opacity: 0 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <SketchPicker disableAlpha={true} color={color} onChange={handleColorChange} />
    </div>
  );
});

ColorPicker.displayName = 'ColorPicker';

export default ColorPicker;
