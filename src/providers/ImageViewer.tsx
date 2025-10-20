import React, { useContext, createContext, ReactNode, useState } from 'react';

// Styles
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

  // Handlers
  const handleSelectImage = (image: string) => {
    setSelectedImage(image);
  };

  return (
    <ImageViewerContext.Provider value={{ selectImage: handleSelectImage }}>
      {children}
      <div className={`${styles['image-viewer']} ${selectedImage ? styles['visible'] : styles['hidden']}`} onClick={() => setSelectedImage(null)}>
        {selectedImage && <img src={selectedImage} alt="Selected Image" onClick={(e) => e.stopPropagation()} />}
      </div>
    </ImageViewerContext.Provider>
  );
};

ImageViewerProvider.displayName = 'ImageViewerProvider';

export default ImageViewerProvider;
