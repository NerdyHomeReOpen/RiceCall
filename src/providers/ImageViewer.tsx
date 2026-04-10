import React, { useContext, createContext, ReactNode, useState, useMemo, useCallback } from 'react';

import ImageViewer from '@/components/ImageViewer';

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const selectImage = useCallback((image: string) => {
    setSelectedImage(image);
  }, []);

  const handleUnselectImage = () => {
    setSelectedImage(null);
  };

  const contextValue = useMemo(() => ({ selectImage }), [selectImage]);

  return (
    <ImageViewerContext.Provider value={contextValue}>
      {children}
      <ImageViewer selectedImage={selectedImage} onUnselectImage={handleUnselectImage} />
    </ImageViewerContext.Provider>
  );
};

ImageViewerProvider.displayName = 'ImageViewerProvider';

export default ImageViewerProvider;
