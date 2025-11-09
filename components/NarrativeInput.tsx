import React from 'react';

interface NarrativeInputProps {
  narrative: string;
  onNarrativeChange: (text: string) => void;
}

const examples = [
  {
    title: "Festa na Praia",
    text: "Em uma vibrante festa na praia ao pôr do sol, a pessoa de referência dança perto de uma fogueira, cercada por amigos e com o som das ondas ao fundo."
  },
  {
    title: "Balada Neon",
    text: "No coração de uma balada com luzes neon, a pessoa de referência está curtindo a música eletrônica, com feixes de laser coloridos criando uma atmosfera energética."
  },
  {
    title: "Evento de Gala",
    text: "Em um elegante evento de gala, a pessoa de referência, vestida a rigor, conversa animadamente em um salão luxuoso, com um lustre de cristal brilhando acima."
  },
  {
    title: "Churrasco & Samba",
    text: "Em um animado churrasco no quintal, a pessoa de referência segura uma cerveja gelada, sorrindo enquanto amigos tocam samba ao vivo ao fundo."
  }
];

export const NarrativeInput: React.FC<NarrativeInputProps> = ({ narrative, onNarrativeChange }) => {
  return (
    <div className="flex flex-col h-full">
      <textarea
        value={narrative}
        onChange={(e) => onNarrativeChange(e.target.value)}
        placeholder="Descreva uma história ou situação para a pessoa. Ex: A pessoa está em uma festa na praia ao pôr do sol, celebrando com amigos..."
        className="w-full flex-grow bg-gray-700 rounded-md p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:outline-none transition"
        rows={5}
      />
      <div className="mt-4">
        <p className="text-center text-gray-400 mb-2 text-sm">Ou escolha um exemplo:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {examples.map((example) => (
            <button
              key={example.title}
              onClick={() => onNarrativeChange(example.text)}
              className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
            >
              {example.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};