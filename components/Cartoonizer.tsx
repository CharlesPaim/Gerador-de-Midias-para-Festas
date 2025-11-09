import React, { useState } from 'react';
import { MagicWandIcon } from './icons/MagicWandIcon';

export type CartoonStyle = 'Pixar' | 'Anime (Anos 90)' | 'Desenho 2D Moderno' | 'Fantasia Épica';

const styles: CartoonStyle[] = ['Pixar', 'Anime (Anos 90)', 'Desenho 2D Moderno', 'Fantasia Épica'];

interface CartoonizerProps {
  onCartoonize: (style: CartoonStyle) => void;
  isLoading: boolean;
}

export const Cartoonizer: React.FC<CartoonizerProps> = ({ onCartoonize, isLoading }) => {
  const [isActive, setIsActive] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<CartoonStyle>('Pixar');

  const handleGenerateClick = () => {
    if (isActive) {
      onCartoonize(selectedStyle);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4 border border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Passo 1.5 (Opcional): Crie um Personagem</h3>
        <label htmlFor="cartoon-toggle" className="flex items-center cursor-pointer">
          <div className="relative">
            <input 
              id="cartoon-toggle" 
              type="checkbox" 
              className="sr-only" 
              checked={isActive}
              onChange={() => setIsActive(!isActive)}
            />
            <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isActive ? 'transform translate-x-6 bg-purple-400' : ''}`}></div>
          </div>
        </label>
      </div>

      {isActive && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <label htmlFor="style-select" className="block text-sm font-medium text-gray-300 mb-2">Selecione o Estilo:</label>
            <select
              id="style-select"
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value as CartoonStyle)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:ring-purple-500 focus:border-purple-500"
              disabled={isLoading}
            >
              {styles.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerateClick}
            disabled={isLoading}
            className="w-full flex items-center justify-center bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Criando...
              </>
            ) : (
              <>
                <MagicWandIcon className="w-5 h-5 mr-2" />
                Criar Personagem
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
