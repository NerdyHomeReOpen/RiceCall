import React, { useEffect, useRef, useState } from 'react';
import { ColorResult, SketchPicker } from 'react-color';

import styles from '@/styles/color.module.css';

interface ColorPickerProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  onColorSelect: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = React.memo(({ x, y, direction, onColorSelect }) => {
  // Refs
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // States
  const [display, setDisplay] = useState(false);
  const [pickerX, setPickerX] = useState<number>(x);
  const [pickerY, setPickerY] = useState<number>(y);
  const [color, setColor] = useState<string>('#FFFFFF');

  // Handlers
  const handleColorChange = (color: ColorResult) => {
    setColor(color.hex);
    onColorSelect(color.hex);
  };

  // Effects
  useEffect(() => {
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

    setPickerX(newPosX);
    setPickerY(newPosY);
    setDisplay(true);
  }, [x, y, direction]);

  return (
    <div
      ref={colorPickerRef}
      className={`color-picker-container context-menu-container ${styles['color-picker']}`}
      style={display ? { left: pickerX, top: pickerY } : { opacity: 0 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <SketchPicker disableAlpha={true} color={color} onChange={handleColorChange} />
    </div>
  );
});

ColorPicker.displayName = 'ColorPicker';

export default ColorPicker;
