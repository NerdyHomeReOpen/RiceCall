import React, { useContext, createContext, ReactNode, useState } from 'react';
import Image from 'next/image';

import styles from '@/styles/imageViewer.module.css';

type ImageViewerContextType = {
  selectImage: (image: string) => void;
};

const ImageViewerContext = createContext<ImageViewerContextType | null>(null);

export const useImageViewer = () => {
  const context = useContext(ImageViewerContext);
  if (!context) throw new Error('useImageViewer must be used within a ImageViewerProvider');
  return context;
};

interface ImageViewerProviderProps {
  children: ReactNode;
}

const ImageViewerProvider = ({ children }: ImageViewerProviderProps) => {
  // States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Functions
  const selectImage = (image: string) => {
    setSelectedImage(image);
  };

  // Handlers
  const handleUnselectImage = () => {
    setSelectedImage(null);
  };

  return (
    <ImageViewerContext.Provider value={{ selectImage }}>
      {children}
      <div className={`${styles['image-viewer']} ${selectedImage ? styles['visible'] : styles['hidden']}`} onClick={handleUnselectImage}>
        {selectedImage && <Image loading="lazy" src={selectedImage} alt="image" onClick={(e) => e.stopPropagation()} width={-1} height={-1} />}
      </div>
    </ImageViewerContext.Provider>
  );
};

ImageViewerProvider.displayName = 'ImageViewerProvider';

export default ImageViewerProvider;
