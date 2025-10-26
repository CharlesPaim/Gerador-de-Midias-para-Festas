import { GoogleGenAI, Modality } from "@google/genai";
import type { PartyAsset, AspectRatio } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const cleanJsonString = (str: string): string => {
  const match = str.match(/```json\n([\s\S]*?)\n```/);
  return match ? match[1] : str;
};


const videoPromptTemplate = {
  character_description: "",
  scene: "",
  dialogue: "■ Olá, pessoal! Tenho uma novidade incrível para vocês!",
  camera: "Gentle zoom-in, starting slightly wider and slowly moving closer to the man's face, maintaining eye contact with the viewer. Slight breeze motion visible in his shirt.",
  lighting: "Bright, natural daylight, reflecting off the clear blue sky and calm ocean, creating a serene and inviting mood.",
  style: "cinematic, realistic, bright tropical tones",
  audio: "Native voice recording synced with the dialogue. Gentle, uplifting ukulele or acoustic guitar music begins softly, reminiscent of a relaxed beach vibe.",
  caption_instruction: "Dialogue is in Portuguese (Brazil). Avoid: subtitles, closed captions, overlays, embedded text, visual words.",
  negative_prompts: "subtitles, captions, on_screen_text, typography, visual text",
  flow_usage: {
    type: "jump",
    transition_note: "Transition to the man holding a cold drink, subtly revealing the party theme."
  },
  model_requirement: "Veo3_native_audio",
  resolution: "4K",
  aspect_ratio: "16:9",
  frame_rate: "24fps"
};

const generateImageForScene = async (
    personImagePart: any,
    flyerImagePart: any,
    scene: string,
    aspectRatio: AspectRatio
): Promise<string> => {
    const imageGenerationPrompt = `Gere uma imagem na proporção EXATA de ${aspectRatio}. Esta é a restrição de formato mais importante. 
A imagem deve ser uma fotografia fotorrealista de alta qualidade usando a pessoa da imagem de referência (fornecida primeiro). MANTENHA A FIDELIDADE TOTAL DO ROSTO DA PESSOA.
O enquadramento deve ser um plano médio (da cintura para cima) ou um close-up. O rosto da pessoa deve estar claramente visível e virado para a câmera.
Coloque esta pessoa na seguinte cena: ${scene}.
O estilo deve ser cinematográfico e vibrante, seguindo o tema da festa (fornecido na segunda imagem).
RESTRIÇÃO ADICIONAL: NÃO adicione chapéus, bonés ou óculos escuros na pessoa, a menos que a cena peça explicitamente por isso.`;

    const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                personImagePart,
                flyerImagePart,
                { text: imageGenerationPrompt }
            ]
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    let imageUrl = '';
    const parts = imageResponse.candidates?.[0]?.content?.parts;
    if (parts) {
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                break;
            }
        }
    }

    if (!imageUrl) {
        throw new Error("Nenhuma imagem foi gerada pelo modelo multimodal.");
    }
    return imageUrl;
};

export const generatePartyAssets = async (
  personImage: File,
  flyerImage: File,
  aspectRatio: AspectRatio
): Promise<PartyAsset[]> => {
  try {
    const personImagePart = await fileToGenerativePart(personImage);
    const flyerImagePart = await fileToGenerativePart(flyerImage);

    const analysisPrompt = "Analise a pessoa na primeira imagem (a 'pessoa de referência') e o tema da festa no segundo. Crie uma `character_description` (string) fotorrealista e EXTREMAMENTE detalhada da pessoa. Foque em características únicas e imutáveis (rosto, olhos, cabelo, tom de pele). IMPORTANTE: IGNORE adereços temporários como chapéus, óculos de sol ou itens que a pessoa esteja segurando. Em seguida, crie um array chamado `assets` contendo 5 objetos. Cada objeto deve ter duas chaves: uma `scene` (string) e um `dialogue` (string). Cada `scene` DEVE incluir explicitamente 'a pessoa de referência' como protagonista (ex: 'A pessoa de referência brindando com amigos...'). IMPORTANTE: Todas as cenas devem ser descritas em plano médio (da cintura para cima) ou close-up, garantindo que o rosto da pessoa de referência esteja visível e virado para a frente. O diálogo deve ser curto, impactante, em Português (BR) e começar com '■'. A saída deve ser um objeto JSON com a chave `character_description` (string) e a chave `assets` (array de 5 objetos {scene, dialogue}).";
    const analysisResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [personImagePart, flyerImagePart, {text: analysisPrompt}] }
    });

    const analysisResultText = cleanJsonString(analysisResponse.text);
    const { character_description, assets } = JSON.parse(analysisResultText);

    if (!character_description || !Array.isArray(assets) || assets.length !== 5 || !assets[0].scene || !assets[0].dialogue) {
        throw new Error("A análise inicial da IA não retornou o formato esperado (esperava { character_description, assets: [{scene, dialogue}] }).");
    }

    const assetPromises = assets.map(async (asset: { scene: string, dialogue: string }) => {
      const videoPrompt = { ...videoPromptTemplate };
      videoPrompt.character_description = character_description;
      videoPrompt.scene = asset.scene;
      videoPrompt.dialogue = asset.dialogue; // <-- Diálogo dinâmico
      videoPrompt.aspect_ratio = aspectRatio;
      
      const imageUrl = await generateImageForScene(personImagePart, flyerImagePart, asset.scene, aspectRatio);

      return { imageUrl, videoPrompt };
    });

    return await Promise.all(assetPromises);
  } catch (error) {
    console.error("Error generating party assets:", error);
    throw new Error("Falha ao gerar os recursos. Verifique o console para mais detalhes.");
  }
};

export const regeneratePartyImage = async (
  personImage: File,
  flyerImage: File,
  scene: string,
  aspectRatio: AspectRatio
): Promise<string> => {
    try {
        const personImagePart = await fileToGenerativePart(personImage);
        const flyerImagePart = await fileToGenerativePart(flyerImage);
        
        return await generateImageForScene(personImagePart, flyerImagePart, scene, aspectRatio);
    } catch (error) {
        console.error("Error regenerating party image:", error);
        throw new Error("Falha ao refazer a imagem. Verifique o console para mais detalhes.");
    }
};