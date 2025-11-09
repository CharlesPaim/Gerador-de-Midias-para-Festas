// Fix: Imported 'useMemo' from 'react' to resolve reference errors.
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { CameraIcon } from './icons/CameraIcon';
import { UploadIcon } from './icons/UploadIcon';
import { SwitchIcon } from './icons/SwitchIcon';

interface ImageUploaderProps {
  id: string;
  label: string | React.ReactNode;
  onImageUpload: (file: File) => void;
  forcedImage?: File | null;
  originalImage?: File | null;
  isLoading?: boolean;
  onPreviewClick?: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ id, label, onImageUpload, forcedImage, originalImage, isLoading, onPreviewClick }) => {
  const [internalPreview, setInternalPreview] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [viewing, setViewing] = useState<'forced' | 'original'>('forced');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const forcedImageUrl = useMemo(() => forcedImage ? URL.createObjectURL(forcedImage) : null, [forcedImage]);
  const originalImageUrl = useMemo(() => originalImage ? URL.createObjectURL(originalImage) : null, [originalImage]);
  
  const currentPreviewUrl = useMemo(() => {
    if (forcedImageUrl) {
      return viewing === 'forced' ? forcedImageUrl : originalImageUrl;
    }
    return internalPreview;
  }, [forcedImageUrl, originalImageUrl, internalPreview, viewing]);
  
  useEffect(() => {
    if (forcedImage) {
        setViewing('forced');
        setInternalPreview(null);
    }
  }, [forcedImage]);
  
  const processFile = useCallback((file: File | undefined | null) => {
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
      const url = URL.createObjectURL(file);
      setInternalPreview(url);
    }
  }, [onImageUpload]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFile(event.target.files?.[0]);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    processFile(event.dataTransfer.files?.[0]);
  };
  
  const handleSwitchView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewing(prev => prev === 'forced' ? 'original' : 'forced');
  }

  const containerClasses = label ? 
    `bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center justify-center border-2 border-dashed h-full transition-colors ${isDraggingOver ? 'border-purple-400' : 'border-gray-600'}` :
    `flex flex-col items-center justify-center border-2 border-dashed h-full transition-colors rounded-lg ${isDraggingOver ? 'border-purple-400' : 'border-gray-600'}`;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={containerClasses}
    >
      {label && <h3 className="text-xl font-semibold text-center mb-4">{label}</h3>}
      <div 
        className={`w-full h-48 bg-gray-700 rounded-md mb-4 flex items-center justify-center overflow-hidden relative transition-opacity ${onPreviewClick && currentPreviewUrl ? 'cursor-pointer hover:opacity-90' : ''}`}
        onClick={onPreviewClick}
        >
        {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-400"></div>
            </div>
        )}
        {currentPreviewUrl ? (
          <img src={currentPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-gray-400">
             <UploadIcon className="w-8 h-8 mx-auto mb-2" />
             <p>Arraste e solte ou clique para enviar</p>
          </div>
        )}
        {forcedImageUrl && originalImageUrl && (
            <button
                onClick={handleSwitchView}
                className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={viewing === 'forced' ? 'Ver Original' : 'Ver Personagem'}
            >
                <SwitchIcon className="w-5 h-5" />
            </button>
        )}
      </div>
      <div className="flex space-x-4">
        <input
          type="file"
          id={id}
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <UploadIcon className="w-5 h-5 mr-2" />
          Escolher
        </button>

        <input
          type="file"
          id={`${id}-camera`}
          accept="image/*"
          capture="user"
          onChange={handleFileChange}
          className="hidden"
          ref={cameraInputRef}
        />
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <CameraIcon className="w-5 h-5 mr-2" />
          Câmera
        </button>
      </div>
    </div>
  );
};