import React, { useState, useEffect } from 'react';
import { generateSpeech } from '../services/geminiService';
import { CopyIcon } from './icons/CopyIcon';
import { SoundWaveIcon } from './icons/SoundWaveIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface NarratorSectionProps {
  script: string;
}

export const NarratorSection: React.FC<NarratorSectionProps> = ({ script }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    // Revoga o URL do objeto quando o componente é desmontado ou o URL muda
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const handleGenerateAudio = async () => {
    setIsGeneratingAudio(true);
    setAudioError(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      const audioBlob = await generateSpeech(script);
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    } catch (err) {
      console.error(err);
      setAudioError(err instanceof Error ? err.message : 'Falha ao gerar áudio.');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-4 space-y-4">
      <div>
        <h3 className="text-xl font-bold mb-2 text-green-300">Voz do Narrador (Roteiro)</h3>
        <div className="relative bg-gray-900 rounded-md p-3">
          <p className="text-gray-300 whitespace-pre-wrap break-words pr-10">{script}</p>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 p-2 rounded-md transition-colors"
            title="Copiar Roteiro"
            aria-label="Copiar roteiro do narrador"
          >
            {copyStatus === 'idle' ? <CopyIcon className="w-5 h-5" /> : <span className="text-xs font-bold text-green-400">Copiado!</span>}
          </button>
        </div>
      </div>

      <div>
        {audioError && <p className="text-sm text-red-400 mb-2">{audioError}</p>}

        {audioUrl ? (
          <div className="flex items-center gap-2">
            <audio src={audioUrl} controls className="w-full h-10"></audio>
            <a
              href={audioUrl}
              download={`narrador_festa_${Date.now()}.wav`}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded-md transition-colors"
              title="Baixar Áudio"
              aria-label="Baixar áudio do narrador"
            >
              <DownloadIcon className="w-5 h-5" />
            </a>
          </div>
        ) : (
          <button
            onClick={handleGenerateAudio}
            disabled={isGeneratingAudio}
            className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {isGeneratingAudio ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Gerando Áudio...
              </>
            ) : (
              <>
                <SoundWaveIcon className="w-5 h-5 mr-2" />
                Gerar Áudio da Narração
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};