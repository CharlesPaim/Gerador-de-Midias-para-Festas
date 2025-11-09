import React, { useState, useCallback, useMemo } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { AspectRatioSelector } from './components/AspectRatioSelector';
import { ResultCard } from './components/ResultCard';
import { ImageModal } from './components/ImageModal';
import { generatePartyAssets, regeneratePartyImage, cartoonizeImage } from './services/geminiService';
import type { PartyAsset, AspectRatio, GenerationContext } from './types';
import { GalleryIcon } from './components/icons/GalleryIcon';
import { ListIcon } from './components/icons/ListIcon';
import { NarrativeInput } from './components/NarrativeInput';
import { NarratorSection } from './components/NarratorSection';
import { Cartoonizer, CartoonStyle } from './components/Cartoonizer';

const App: React.FC = () => {
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [characterImage, setCharacterImage] = useState<File | null>(null);
  const [isCartoonizing, setIsCartoonizing] = useState<boolean>(false);

  const [flyerImage, setFlyerImage] = useState<File | null>(null);
  const [narrative, setNarrative] = useState<string>('');
  const [inputType, setInputType] = useState<'flyer' | 'narrative'>('flyer');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [generatedAssets, setGeneratedAssets] = useState<PartyAsset[]>([]);
  const [narratorScript, setNarratorScript] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrompts, setShowPrompts] = useState<boolean>(true);
  const [currentModalIndex, setCurrentModalIndex] = useState<number | null>(null);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState<boolean>(false);


  const imageToUse = useMemo(() => characterImage || personImage, [characterImage, personImage]);

  const handlePersonImageUpload = useCallback((file: File) => {
    setPersonImage(file);
    setCharacterImage(null); // Reseta a imagem do personagem se uma nova foto for enviada
  }, []);

  const handleCartoonize = useCallback(async (style: CartoonStyle) => {
    if (!personImage) {
      setError("Por favor, envie uma foto da pessoa primeiro.");
      return;
    }
    setIsCartoonizing(true);
    setError(null);
    try {
      const cartoonFile = await cartoonizeImage(personImage, style);
      setCharacterImage(cartoonFile);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? `Ocorreu um erro ao criar o personagem: ${err.message}` : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsCartoonizing(false);
    }
  }, [personImage]);


  const handleGenerate = useCallback(async () => {
    if (!imageToUse || (inputType === 'flyer' && !flyerImage) || (inputType === 'narrative' && !narrative.trim())) {
      setError('Por favor, preencha todos os campos antes de gerar.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedAssets([]);
    setNarratorScript('');

    try {
      const context: GenerationContext = inputType === 'flyer'
        ? { type: 'flyer', file: flyerImage! }
        : { type: 'narrative', text: narrative };

      const { assets, narratorScript } = await generatePartyAssets(imageToUse, context, aspectRatio, !!characterImage);
      setGeneratedAssets(assets);
      setNarratorScript(narratorScript);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? `Ocorreu um erro: ${err.message}` : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  }, [imageToUse, flyerImage, narrative, inputType, aspectRatio, characterImage]);

  const handleRestart = () => {
    setPersonImage(null);
    setCharacterImage(null);
    setFlyerImage(null);
    setNarrative('');
    setInputType('flyer');
    setAspectRatio('16:9');
    setGeneratedAssets([]);
    setNarratorScript('');
    setError(null);
    setIsLoading(false);
    setShowPrompts(true);
    setCurrentModalIndex(null);
    setIsCartoonizing(false);
    setIsCharacterModalOpen(false);
  };

  const handleRedo = useCallback(async (index: number) => {
    if (!imageToUse || (inputType === 'flyer' && !flyerImage) || (inputType === 'narrative' && !narrative.trim())) {
      setError('Dados originais não encontrados para refazer.');
      return;
    }

    const assetToRedo = generatedAssets[index];
    if (!assetToRedo) return;

    const characterDescription = assetToRedo.videoPrompt?.character_description;
    if (!characterDescription) {
        setError('Descrição do personagem não encontrada para refazer a imagem.');
        return;
    }

    setGeneratedAssets(currentAssets =>
      currentAssets.map((asset, i) =>
        i === index ? { ...asset, isRegenerating: true } : asset
      )
    );
    setError(null);

    try {
        const context: GenerationContext = inputType === 'flyer'
            ? { type: 'flyer', file: flyerImage! }
            : { type: 'narrative', text: narrative };
      const scene = assetToRedo.videoPrompt.scene;
      const newImageUrl = await regeneratePartyImage(imageToUse, context, scene, aspectRatio, characterDescription, !!characterImage);

      setGeneratedAssets(currentAssets =>
        currentAssets.map((asset, i) =>
          i === index
            ? { ...asset, imageUrl: newImageUrl, isRegenerating: false }
            : asset
        )
      );
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? `Falha ao refazer: ${err.message}` : 'Ocorreu um erro desconhecido ao refazer a imagem.');
      setGeneratedAssets(currentAssets =>
        currentAssets.map((asset, i) =>
          i === index ? { ...asset, isRegenerating: false } : asset
        )
      );
    }
  }, [imageToUse, flyerImage, narrative, inputType, aspectRatio, generatedAssets, characterImage]);

  const handleModalNavigation = (direction: 'prev' | 'next') => {
    if (currentModalIndex === null) return;
    const newIndex = direction === 'next' ? currentModalIndex + 1 : currentModalIndex - 1;
    if (newIndex >= 0 && newIndex < generatedAssets.length) {
      setCurrentModalIndex(newIndex);
    }
  };
  
  const canGenerate = imageToUse && ((inputType === 'flyer' && flyerImage) || (inputType === 'narrative' && narrative.trim() !== '')) && !isLoading;

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Left Column */}
              <div className="space-y-8">
                  <ImageUploader
                    id="person-image"
                    label="Passo 1: Foto da Pessoa"
                    onImageUpload={handlePersonImageUpload}
                    key="person-uploader"
                    forcedImage={characterImage}
                    originalImage={personImage}
                    isLoading={isCartoonizing}
                    onPreviewClick={() => {
                        if (characterImage) {
                            setIsCharacterModalOpen(true);
                        }
                    }}
                  />
                  {personImage && (
                    <Cartoonizer 
                      onCartoonize={handleCartoonize} 
                      isLoading={isCartoonizing}
                    />
                  )}
              </div>
              
              {/* Right Column */}
              <div className="space-y-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col h-full">
                  <h3 className="text-xl font-semibold text-center mb-4">Passo 2: Defina o Contexto</h3>
                  <div className="flex justify-center mb-4">
                    <div className="bg-gray-900 p-1 rounded-lg flex space-x-1">
                      <button onClick={() => { setInputType('flyer'); setNarrative(''); }} className={`px-4 py-1 rounded-md text-sm font-medium transition ${inputType === 'flyer' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
                        Usar Folder
                      </button>
                      <button onClick={() => { setInputType('narrative'); setFlyerImage(null); }} className={`px-4 py-1 rounded-md text-sm font-medium transition ${inputType === 'narrative' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
                        Escrever Narrativa
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                      {inputType === 'flyer' ? (
                          <ImageUploader
                              id="flyer-image"
                              label=""
                              onImageUpload={setFlyerImage}
                              key="flyer-uploader-inner"
                          />
                          ) : (
                          <NarrativeInput
                              narrative={narrative}
                              onNarrativeChange={setNarrative}
                          />
                      )}
                  </div>
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
             <div className="flex justify-between items-center px-2">
                <h2 className="text-3xl font-bold">Resultados Gerados</h2>
                <button
                    onClick={() => setShowPrompts(!showPrompts)}
                    className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    title={showPrompts ? "Ocultar Prompts (Visão de Galeria)" : "Exibir Prompts (Visão de Detalhes)"}
                >
                    {showPrompts ? <GalleryIcon className="w-5 h-5"/> : <ListIcon className="w-5 h-5"/>}
                    <span>{showPrompts ? 'Galeria' : 'Detalhes'}</span>
                </button>
            </div>
            {narratorScript && <NarratorSection script={narratorScript} />}
            <div className={`grid grid-cols-1 ${showPrompts ? 'lg:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-8`}>
              {generatedAssets.map((asset, index) => (
                <ResultCard
                  key={index}
                  asset={asset}
                  originalPersonImage={personImage} // Passa a foto original para visualização
                  onRedo={() => handleRedo(index)}
                  showPrompts={showPrompts}
                  onOpenModal={() => setCurrentModalIndex(index)}
                />
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

      {currentModalIndex !== null && (
        <ImageModal 
          imageUrl={generatedAssets[currentModalIndex].imageUrl}
          onClose={() => setCurrentModalIndex(null)}
          onNavigate={handleModalNavigation}
          currentIndex={currentModalIndex}
          totalImages={generatedAssets.length}
        />
      )}

      {isCharacterModalOpen && characterImage && (
        <ImageModal 
          imageUrl={URL.createObjectURL(characterImage)}
          onClose={() => setIsCharacterModalOpen(false)}
          onNavigate={() => {}} // Navigation not needed for single image
          currentIndex={0}
          totalImages={1}
        />
      )}
    </div>
  );
};

export default App;