import React from 'react';
import Image from 'next/image';

import styles from './ImageViewer.module.css';

interface ImageViewerProps {
  selectedImage: string | null;
  onUnselectImage: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = React.memo(({ selectedImage, onUnselectImage }) => {
  return (
    <div className={`${styles['image-viewer']} ${selectedImage ? styles['visible'] : styles['hidden']}`} onClick={onUnselectImage}>
      {selectedImage && <Image loading="lazy" src={selectedImage} alt="image" onClick={(e) => e.stopPropagation()} width={-1} height={-1} />}
    </div>
  );
});

ImageViewer.displayName = 'ImageViewer';

export default ImageViewer;
