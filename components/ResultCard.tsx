
import React, { useState, useMemo } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { CopyIcon } from './icons/CopyIcon';
import type { PartyAsset } from '../types';

interface ResultCardProps {
  asset: PartyAsset;
  originalPersonImage: File | null;
}

export const ResultCard: React.FC<ResultCardProps> = ({ asset, originalPersonImage }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [showOriginal, setShowOriginal] = useState(false);
  const originalImageUrl = useMemo(() => originalPersonImage ? URL.createObjectURL(originalPersonImage) : null, [originalPersonImage]);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(asset.videoPrompt, null, 2));
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = asset.imageUrl;
    link.download = `festa_imagem_${Date.now()}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
      <div className="relative">
        <img
            src={showOriginal ? originalImageUrl : asset.imageUrl}
            alt="Generated content"
            className="w-full h-auto object-contain aspect-video bg-black"
        />
        <div className="absolute top-2 right-2 flex space-x-2">
            {originalImageUrl && (
                 <button onClick={() => setShowOriginal(!showOriginal)} className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-colors">
                     <span className="text-xs font-bold">{showOriginal ? "Ver Gerada" : "Ver Original"}</span>
                 </button>
            )}
            <button onClick={handleDownload} className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-colors">
                <DownloadIcon className="w-6 h-6" />
            </button>
        </div>
      </div>
      <div className="p-4">
        <h4 className="text-lg font-bold mb-2 text-purple-300">Prompt de Vídeo (JSON)</h4>
        <div className="relative bg-gray-900 rounded-md p-3 max-h-48 overflow-y-auto">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap break-all">
            <code>{JSON.stringify(asset.videoPrompt, null, 2)}</code>
          </pre>
          <button onClick={handleCopy} className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 p-2 rounded-md transition-colors">
            {copyStatus === 'idle' ? <CopyIcon className="w-5 h-5" /> : <span className="text-xs font-bold text-green-400">Copiado!</span>}
          </button>
        </div>
      </div>
    </div>
  );
};
