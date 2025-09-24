import React, { useEffect } from 'react';
import { XIcon } from './icons/XIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface ImageModalProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ images, currentIndex, onClose, onNext, onPrevious }) => {
  const src = images[currentIndex];
  const showNav = images.length > 1;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
      if (showNav) {
          if (event.key === 'ArrowRight') onNext();
          if (event.key === 'ArrowLeft') onPrevious();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrevious, showNav]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-fast"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-[52]"
        aria-label="Close image viewer"
      >
        <XIcon className="w-8 h-8" />
      </button>

      {showNav && (
        <>
            <button
              onClick={(e) => { e.stopPropagation(); onPrevious(); }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-all z-[51]"
              aria-label="Previous image"
            >
              <ChevronLeftIcon />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-all z-[51]"
              aria-label="Next image"
            >
              <ChevronRightIcon />
            </button>
        </>
      )}

      <div className="relative w-full h-full p-4 sm:p-8 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt={`Enlarged view ${currentIndex + 1} of ${images.length}`}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
};

const style = document.createElement('style');
style.innerHTML = `
@keyframes fade-in-fast {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in-fast {
  animation: fade-in-fast 0.2s ease-out forwards;
}
`;
document.head.appendChild(style);