
import React from 'react';
import type { AspectRatio } from '../types';

interface AspectRatioSelectorProps {
  label: string;
  selectedRatio: AspectRatio;
  onRatioChange: (ratio: AspectRatio) => void;
}

const ratios: AspectRatio[] = ['1:1', '16:9', '9:16'];

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
  label,
  selectedRatio,
  onRatioChange,
}) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center">
      <h3 className="text-xl font-semibold mb-4">{label}</h3>
      <div className="flex space-x-4">
        {ratios.map((ratio) => (
          <button
            key={ratio}
            onClick={() => onRatioChange(ratio)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 border-2 ${
              selectedRatio === ratio
                ? 'bg-purple-600 border-purple-400 text-white scale-105'
                : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
            }`}
          >
            {ratio}
          </button>
        ))}
      </div>
    </div>
  );
};
