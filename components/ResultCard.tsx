
import React, { useState, useMemo, useEffect } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { CopyIcon } from './icons/CopyIcon';
import { RedoIcon } from './icons/RedoIcon';
import { ShareIcon } from './icons/ShareIcon';
import type { PartyAsset, AspectRatio } from '../types';
import { generateDescriptivePrompt } from '../services/geminiService';

interface ResultCardProps {
  asset: PartyAsset;
  originalPersonImage: File | null;
  onRedo: () => void;
  showPrompts: boolean;
  onOpenModal: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ asset, originalPersonImage, onRedo, showPrompts, onOpenModal }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [imageCopyStatus, setImageCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [textPromptCopyStatus, setTextPromptCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [showOriginal, setShowOriginal] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const originalImageUrl = useMemo(() => originalPersonImage ? URL.createObjectURL(originalPersonImage) : null, [originalPersonImage]);

  useEffect(() => {
    // A API Web Share com arquivos não é universalmente suportada. Verifique se ela existe.
    if (navigator.share && typeof navigator.canShare === 'function') {
      try {
          const dummyFile = new File(["dummy"], "dummy.png", { type: "image/png" });
          if (navigator.canShare({ files: [dummyFile] })) {
              setCanShare(true);
          }
      } catch (e) {
          // Se o construtor de File não for suportado, podemos assumir que o compartilhamento de arquivos também não é.
          console.warn('Falha na verificação de compartilhamento de arquivos.', e);
          setCanShare(false);
      }
    }
  }, []);


  const handleTextCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(asset.videoPrompt, null, 2));
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };
  
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
        const response = await fetch(asset.imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `festa_imagem_${Date.now()}.jpeg`, { type: blob.type });

        await navigator.share({
            title: 'Imagem de Festa Gerada com IA',
            text: `Confira esta imagem que criei para a festa: ${asset.videoPrompt.scene}`,
            files: [file],
        });
    } catch (err) {
        console.error("Falha ao compartilhar a imagem: ", err);
        // Evita alerta no cancelamento do usuário
        if ((err as Error).name !== 'AbortError') {
          alert("Não foi possível compartilhar a imagem.");
        }
    }
  };

  const handleImageCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
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


  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = asset.imageUrl;
    link.download = `festa_imagem_${Date.now()}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleRedoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRedo();
  }

  const handleTextPromptCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const descriptivePrompt = generateDescriptivePrompt(asset.videoPrompt);
    navigator.clipboard.writeText(descriptivePrompt);
    setTextPromptCopyStatus('copied');
    setTimeout(() => setTextPromptCopyStatus('idle'), 2000);
  };

  const handleToggleOriginalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOriginal(!showOriginal);
  }

  const aspectRatio = asset.videoPrompt.aspect_ratio as AspectRatio;
  const aspectRatioClass = {
    '1:1': 'aspect-square',
    '16:9': 'aspect-video',
    '9:16': 'aspect-[9/16]',
  }[aspectRatio] || 'aspect-video';

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700 flex flex-col">
      <div className="relative" onClick={() => !asset.isRegenerating && onOpenModal()}>
        <img
            src={showOriginal && originalImageUrl ? originalImageUrl : asset.imageUrl}
            alt="Generated content"
            className={`w-full h-auto object-contain bg-black transition-opacity duration-300 ${!asset.isRegenerating && 'cursor-pointer'} ${asset.isRegenerating ? 'opacity-30' : 'opacity-100'} ${aspectRatioClass}`}
        />
        {asset.isRegenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-400"></div>
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-wrap justify-end gap-2">
            {originalImageUrl && (
                <button onClick={handleToggleOriginalClick} disabled={asset.isRegenerating} className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={showOriginal ? "Ver Imagem Gerada" : "Ver Imagem Original"}>
                    <span className="text-xs font-bold px-1">{showOriginal ? "Gerada" : "Original"}</span>
                </button>
            )}
            {canShare && (
                 <button onClick={handleShare} disabled={asset.isRegenerating} className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Compartilhar">
                    <ShareIcon className="w-6 h-6" />
                </button>
            )}
            <button onClick={handleDownload} disabled={asset.isRegenerating} className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Baixar Imagem">
                <DownloadIcon className="w-6 h-6" />
            </button>
            <button onClick={handleImageCopy} disabled={asset.isRegenerating} className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Copiar Imagem">
                {imageCopyStatus === 'idle' ? <CopyIcon className="w-6 h-6" /> : <span className="text-xs font-bold text-green-400">Copiada!</span>}
            </button>
            <button onClick={handleTextPromptCopy} disabled={asset.isRegenerating} className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Copiar Prompt Descritivo (Texto)">
              {textPromptCopyStatus === 'idle'
               ? <CopyIcon className="w-6 h-6" />
               : <span className="text-xs font-bold text-green-400">Copiado!</span>
              }
            </button>
            <button onClick={handleRedoClick} disabled={asset.isRegenerating} className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Refazer Imagem">
                <RedoIcon className="w-6 h-6" />
            </button>
        </div>
      </div>
      {showPrompts && (
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
      )}
    </div>
  );
};
