import React from 'react';
import Image from 'next/image';

import styles from './ImageViewer.module.css';

interface ImageViewerProps {
  imageUrl: string | null;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = React.memo(({ imageUrl, onClose }) => {
  return (
    <div className={`${styles['image-viewer']} ${imageUrl ? styles['visible'] : styles['hidden']}`} onClick={onClose}>
      {imageUrl && <Image loading="lazy" src={imageUrl} alt="image" onClick={(e) => e.stopPropagation()} width={-1} height={-1} />}
    </div>
  );
});

ImageViewer.displayName = 'ImageViewer';

export default ImageViewer;
