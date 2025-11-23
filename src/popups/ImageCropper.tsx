import React, { useCallback, useEffect, useRef, useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';

// Providers
import { useTranslation } from 'react-i18next';

// Services
import ipc from '@/services/ipc.service';

interface ImageCropperPopupProps {
  imageData: string;
  submitTo: string;
}

const INITIAL_CROP_SIZE = 200;
const MIN_CROP_SIZE = 100;

const ImageCropperPopup: React.FC<ImageCropperPopupProps> = React.memo(({ imageData, submitTo }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(new Image());
  const imageInfoRef = useRef({ drawX: 0, drawY: 0, drawWidth: 0, drawHeight: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });

  // States
  const [cropBox, setCropBox] = useState({ x: 100, y: 100, size: INITIAL_CROP_SIZE });
  const [draggingBox, setDraggingBox] = useState(false);

  // Handlers
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { drawX, drawY, drawWidth, drawHeight } = imageInfoRef.current;
    ctx.drawImage(imgRef.current, drawX, drawY, drawWidth, drawHeight);

    const { x: cropX, y: cropY, size } = cropBox;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.rect(cropX, cropY, size, size);
    ctx.fill('evenodd');
    ctx.restore();

    const previewCanvas = previewRef.current;
    const previewCtx = previewCanvas?.getContext('2d');
    if (previewCanvas && previewCtx) {
      const sx = ((cropX - drawX) / drawWidth) * imgRef.current.width;
      const sy = ((cropY - drawY) / drawHeight) * imgRef.current.height;
      const sSize = (cropBox.size / drawWidth) * imgRef.current.width;

      const previewSize = 500;
      previewCanvas.width = previewSize;
      previewCanvas.height = previewSize;
      previewCtx.clearRect(0, 0, previewSize, previewSize);

      previewCtx.imageSmoothingEnabled = true;
      previewCtx.imageSmoothingQuality = 'high';

      previewCtx.drawImage(imgRef.current, sx, sy, sSize, sSize, 0, 0, previewSize, previewSize);
    }
  }, [cropBox]);

  const handleCrop = async () => {
    const canvas = previewRef.current;
    const imageDataUrl = canvas?.toDataURL('image/png');
    if (!imageDataUrl) return;
    ipc.popup.submit(submitTo, imageDataUrl);
    handleClose();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { x: bx, y: by, size } = cropBox;
    if (x >= bx && x <= bx + size && y >= by && y <= by + size) {
      setDraggingBox(true);
      startPosRef.current = { x, y };
    }
  };

  const handleMouseUp = () => setDraggingBox(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingBox) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - startPosRef.current.x;
    const dy = y - startPosRef.current.y;
    const size = cropBox.size;
    const { drawX, drawY, drawWidth, drawHeight } = imageInfoRef.current;

    const newX = Math.min(Math.max(drawX, cropBox.x + dx), drawX + drawWidth - size);
    const newY = Math.min(Math.max(drawY, cropBox.y + dy), drawY + drawHeight - size);

    setCropBox({ ...cropBox, x: newX, y: newY });
    startPosRef.current = { x, y };
  };

  const handleMouseLeave = () => setDraggingBox(false);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY < 0 ? -10 : 10;
    const newSize = cropBox.size + delta;
    const { drawX, drawY, drawWidth, drawHeight } = imageInfoRef.current;

    const maxSize = Math.min(drawWidth, drawHeight);
    const clampedSize = Math.min(maxSize, Math.max(MIN_CROP_SIZE, newSize));

    const relX = (mouseX - cropBox.x) / cropBox.size;
    const relY = (mouseY - cropBox.y) / cropBox.size;

    let newX = mouseX - relX * clampedSize;
    let newY = mouseY - relY * clampedSize;

    newX = Math.min(drawX + drawWidth - clampedSize, Math.max(drawX, newX));
    newY = Math.min(drawY + drawHeight - clampedSize, Math.max(drawY, newY));

    setCropBox({ x: newX, y: newY, size: clampedSize });
  };

  const handleClose = () => {
    ipc.window.close();
  };

  // Effects
  useEffect(() => {
    imgRef.current.src = imageData;
    imgRef.current.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const scale = Math.min(canvas.width / imgRef.current.width, canvas.height / imgRef.current.height);
      const drawWidth = imgRef.current.width * scale;
      const drawHeight = imgRef.current.height * scale;
      const drawX = (canvas.width - drawWidth) / 2;
      const drawY = (canvas.height - drawHeight) / 2;
      imageInfoRef.current = { drawX, drawY, drawWidth, drawHeight };
      const borderSize = 20;
      const maxCropSize = Math.max(borderSize, Math.min(drawWidth, drawHeight) - borderSize);
      const cropX = drawX + (drawWidth - maxCropSize) / 2;
      const cropY = drawY + (drawHeight - maxCropSize) / 2;
      setCropBox({ x: cropX, y: cropY, size: maxCropSize });
    };
  }, [imageData]);

  useEffect(() => {
    draw();
  }, [cropBox, draw]);

  return (
    <>
      <div className={popup['popup-wrapper']}>
        {/* Body */}
        <div className={popup['popup-body']}>
          <div className={`${popup['content']} ${popup['row']}`} style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              style={{ border: '1px solid #000' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onWheel={handleWheel}
            />
            <div className={popup['col']}>
              <div
                className={`${popup['input-box']} ${popup['col']}`}
                style={{
                  width: '150px',
                  height: '150px',
                  boxShadow: '0 1px 1px #00000080',
                  padding: '5px',
                  border: '1px solid #888',
                  borderRadius: '12px',
                }}
              >
                <canvas
                  ref={previewRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: '1px solid #888',
                    borderRadius: '8px',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={popup['popup-footer']}>
          <div className={`${popup['button']}`} onClick={handleCrop}>
            {t('upload')}
          </div>
          <div className={popup['button']} onClick={handleClose}>
            {t('close')}
          </div>
        </div>
      </div>
    </>
  );
});

ImageCropperPopup.displayName = 'ImageCropperPopup';

export default ImageCropperPopup;
