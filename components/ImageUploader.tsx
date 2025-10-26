
import React, { useState, useRef } from 'react';
import { CameraIcon } from './icons/CameraIcon';
import { UploadIcon } from './icons/UploadIcon';

interface ImageUploaderProps {
  id: string;
  label: string;
  onImageUpload: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ id, label, onImageUpload }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-600 h-full">
      <h3 className="text-xl font-semibold text-center mb-4">{label}</h3>
      <div className="w-full h-48 bg-gray-700 rounded-md mb-4 flex items-center justify-center overflow-hidden">
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400">Preview da Imagem</span>
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
