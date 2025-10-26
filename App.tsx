
import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { AspectRatioSelector } from './components/AspectRatioSelector';
import { ResultCard } from './components/ResultCard';
import { generatePartyAssets } from './services/geminiService';
import type { PartyAsset, AspectRatio } from './types';

const App: React.FC = () => {
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [flyerImage, setFlyerImage] = useState<File | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [generatedAssets, setGeneratedAssets] = useState<PartyAsset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!personImage || !flyerImage) {
      setError('Por favor, envie as duas imagens antes de gerar.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedAssets([]);

    try {
      const assets = await generatePartyAssets(personImage, flyerImage, aspectRatio);
      setGeneratedAssets(assets);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? `Ocorreu um erro: ${err.message}` : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  }, [personImage, flyerImage, aspectRatio]);

  const handleRestart = () => {
    setPersonImage(null);
    setFlyerImage(null);
    setAspectRatio('16:9');
    setGeneratedAssets([]);
    setError(null);
    setIsLoading(false);
  };

  const canGenerate = personImage && flyerImage && !isLoading;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4 sm:p-6 md:p-8">
      <main className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Gerador de Mídia para Festas
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Crie imagens e prompts de vídeo incríveis com IA!</p>
        </header>

        {generatedAssets.length === 0 && !isLoading && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ImageUploader
                id="person-image"
                label="Passo 1: Foto da Pessoa"
                onImageUpload={setPersonImage}
                key="person-uploader"
              />
              <ImageUploader
                id="flyer-image"
                label="Passo 2: Folder da Festa"
                onImageUpload={setFlyerImage}
                key="flyer-uploader"
              />
            </div>

            <AspectRatioSelector
              label="Passo 3: Proporção da Imagem"
              selectedRatio={aspectRatio}
              onRatioChange={setAspectRatio}
            />

            <div className="text-center">
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-10 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg shadow-purple-500/30"
              >
                Gerar Mídia
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center flex flex-col items-center justify-center p-12 bg-gray-800 rounded-lg">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-400 mb-4"></div>
            <p className="text-2xl font-semibold">Gerando suas imagens e prompts...</p>
            <p className="text-gray-400 mt-2">Isso pode levar alguns minutos. Por favor, aguarde.</p>
          </div>
        )}

        {error && <p className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</p>}
        
        {generatedAssets.length > 0 && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center">Resultados Gerados</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {generatedAssets.map((asset, index) => (
                <ResultCard key={index} asset={asset} originalPersonImage={personImage} />
              ))}
            </div>
             <div className="text-center mt-8">
              <button
                onClick={handleRestart}
                className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-10 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-pink-500/30"
              >
                Começar Novamente
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
