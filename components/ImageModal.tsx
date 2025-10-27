import React from 'react';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  currentIndex: number;
  totalImages: number;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose, onNavigate, currentIndex, totalImages }) => {
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < totalImages - 1;

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft' && canGoPrev) {
        onNavigate('prev');
      } else if (event.key === 'ArrowRight' && canGoNext) {
        onNavigate('next');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onNavigate, canGoPrev, canGoNext]);
  
  const handlePrevClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canGoPrev) onNavigate('prev');
  };
  
  const handleNextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canGoNext) onNavigate('next');
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative max-w-4xl w-full max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {totalImages > 1 && (
          <button 
            onClick={handlePrevClick}
            disabled={!canGoPrev}
            className="absolute left-0 sm:-left-12 text-white bg-black bg-opacity-30 hover:bg-opacity-60 disabled:opacity-20 disabled:cursor-not-allowed p-2 rounded-full transition-all z-10"
            aria-label="Imagem anterior"
          >
            <ChevronLeftIcon className="w-8 h-8"/>
          </button>
        )}

        <img src={imageUrl} alt="Visualização ampliada" className="w-full h-auto max-h-[90vh] object-contain rounded-lg shadow-2xl" />
        
        {totalImages > 1 && (
          <button 
            onClick={handleNextClick}
            disabled={!canGoNext}
            className="absolute right-0 sm:-right-12 text-white bg-black bg-opacity-30 hover:bg-opacity-60 disabled:opacity-20 disabled:cursor-not-allowed p-2 rounded-full transition-all z-10"
            aria-label="Próxima imagem"
          >
            <ChevronRightIcon className="w-8 h-8"/>
          </button>
        )}
        
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 sm:top-0 sm:-right-12 bg-white text-black rounded-full w-10 h-10 flex items-center justify-center font-bold text-2xl leading-none transition-transform hover:scale-110"
          aria-label="Fechar"
        >
          &times;
        </button>
      </div>
    </div>
  );
};
