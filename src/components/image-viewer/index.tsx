import React from 'react';
import Image from 'next/image';

interface ImageViewerProps {
  selectedImage: string | null;
  onUnselectImage: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = React.memo(({ selectedImage, onUnselectImage }) => {
  return (
    <div className={`fixed top-0 left-0 z-10000 items-center justify-center w-full h-full p-[5%] bg-[#00000080] ${selectedImage ? 'flex animate-visibility' : 'hidden'}`} onClick={onUnselectImage}>
      {selectedImage && (
        <Image className={`max-w-full max-h-full object-contain animate-fade-in`} loading="lazy" src={selectedImage} alt="image" onClick={(e) => e.stopPropagation()} width={-1} height={-1} />
      )}
    </div>
  );
});

ImageViewer.displayName = 'ImageViewer';

export default ImageViewer;
