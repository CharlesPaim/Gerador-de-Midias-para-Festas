import React, { useState, useMemo } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { CopyIcon } from './icons/CopyIcon';
import { RedoIcon } from './icons/RedoIcon';
import type { PartyAsset } from '../types';

interface ResultCardProps {
  asset: PartyAsset;
  originalPersonImage: File | null;
  onRedo: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ asset, originalPersonImage, onRedo }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [imageCopyStatus, setImageCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [showOriginal, setShowOriginal] = useState(false);
  const originalImageUrl = useMemo(() => originalPersonImage ? URL.createObjectURL(originalPersonImage) : null, [originalPersonImage]);

  const handleTextCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(asset.videoPrompt, null, 2));
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const handleImageCopy = async () => {
    try {
        const response = await fetch(asset.imageUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
            new ClipboardItem({
                [blob.type]: blob,
            }),
        ]);
        setImageCopyStatus('copied');
        setTimeout(() => setImageCopyStatus('idle'), 2000);
    } catch (err) {
        console.error("Falha ao copiar a imagem: ", err);
        alert("Não foi possível copiar a imagem.");
    }
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
            className={`w-full h-auto object-contain aspect-video bg-black transition-opacity duration-300 ${asset.isRegenerating ? 'opacity-30' : 'opacity-100'}`}
        />
        {asset.isRegenerating && (
           <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
             <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-400"></div>
           </div>
        )}
        <div className="absolute top-2 right-2 flex space-x-2">
            {originalImageUrl && (
                 <button onClick={() => setShowOriginal(!showOriginal)} disabled={asset.isRegenerating} className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={showOriginal ? "Ver Imagem Gerada" : "Ver Imagem Original"}>
                     <span className="text-xs font-bold">{showOriginal ? "Ver Gerada" : "Ver Original"}</span>
                 </button>
            )}
            <button onClick={handleImageCopy} disabled={asset.isRegenerating} className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Copiar Imagem">
                 {imageCopyStatus === 'idle' ? <CopyIcon className="w-6 h-6" /> : <span className="text-xs font-bold text-green-400">Copiada!</span>}
            </button>
            <button onClick={handleDownload} disabled={asset.isRegenerating} className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Baixar Imagem">
                <DownloadIcon className="w-6 h-6" />
            </button>
            <button onClick={onRedo} disabled={asset.isRegenerating} className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Refazer Imagem">
                <RedoIcon className="w-6 h-6" />
            </button>
        </div>
      </div>
      <div className="p-4">
        <h4 className="text-lg font-bold mb-2 text-purple-300">Prompt de Vídeo (JSON)</h4>
        <div className="relative bg-gray-900 rounded-md p-3">
          <div className="max-h-40 overflow-y-auto">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap break-all">
              <code>{JSON.stringify(asset.videoPrompt, null, 2)}</code>
            </pre>
          </div>
          <button onClick={handleTextCopy} className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 p-2 rounded-md transition-colors" title="Copiar Prompt">
            {copyStatus === 'idle' ? <CopyIcon className="w-5 h-5" /> : <span className="text-xs font-bold text-green-400">Copiado!</span>}
          </button>
        </div>
      </div>
    </div>
  );
};