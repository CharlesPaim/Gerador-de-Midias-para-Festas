import { GoogleGenAI, Modality } from "@google/genai";
import type { PartyAsset, AspectRatio, GenerationContext } from '../types';
import type { CartoonStyle } from '../components/Cartoonizer';

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

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const pcmToWav = (pcmData: ArrayBuffer, sampleRate: number, numChannels: number, bitsPerSample: number): Blob => {
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmData.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  new Uint8Array(buffer, 44).set(new Uint8Array(pcmData));

  return new Blob([buffer], { type: 'audio/wav' });
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
    contextPart: any,
    contextType: 'flyer' | 'narrative',
    scene: string,
    aspectRatio: AspectRatio,
    characterDescription: string,
    isCartoon: boolean,
): Promise<string> => {
    const imageStyle = isCartoon ? "no estilo do personagem cartoon fornecido" : "uma fotografia fotorrealista de alta qualidade";
    const imageGenerationPrompt = `Gere uma imagem na proporção EXATA de ${aspectRatio}. Esta é a restrição de formato mais importante.
A imagem deve ser ${imageStyle}.
PERSONAGEM: Use a pessoa/personagem da imagem de referência (fornecida primeiro). A descrição detalhada do personagem é: "${characterDescription}". MANTENHA A FIDELIDADE TOTAL DO ROSTO, ESTILO E ROUPA DESCRITA. A pessoa deve estar usando EXATAMENTE a mesma roupa em todas as imagens.
CENA: Coloque o personagem na seguinte cena: ${scene}.
ENQUADRAMENTO: O enquadramento deve ser um plano médio (da cintura para cima) ou um close-up. O rosto da pessoa deve estar claramente visível e virado para a câmera.
ESTILO: O estilo geral deve ser cinematográfico e vibrante, inspirado pelo contexto fornecido (${contextType === 'flyer' ? 'na segunda imagem' : 'na narrativa de texto'}).
RESTRIÇÃO ADICIONAL: NÃO adicione NENHUM adereço extra na pessoa (como chapéus, bonés, óculos escuros, colares de flores, etc.), a menos que a cena peça explicitamente por isso.`;


    const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                personImagePart,
                contextPart,
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
  context: GenerationContext,
  aspectRatio: AspectRatio,
  isCartoon: boolean,
): Promise<{ assets: PartyAsset[], narratorScript: string }> => {
  try {
    const personImagePart = await fileToGenerativePart(personImage);
    let analysisContextParts: any[];
    let imageGenContextPart: any;
    let analysisPrompt: string;
    const personType = isCartoon ? "o personagem de desenho" : "a pessoa";
    const descriptionStyle = isCartoon ? "no estilo do desenho" : "fotorrealista";
    
    if (context.type === 'flyer') {
        const flyerImagePart = await fileToGenerativePart(context.file);
        imageGenContextPart = flyerImagePart;
        analysisContextParts = [personImagePart, flyerImagePart];
        analysisPrompt = `Analise ${personType} na primeira imagem (a 'pessoa de referência') e o tema da festa no segundo. Crie uma \`character_description\` (string) ${descriptionStyle} e EXTREMAMENTE detalhada da pessoa. Foque em características únicas e imutáveis (rosto, olhos, cabelo, tom de pele, estilo artístico) E descreva detalhadamente a roupa que a pessoa está vestindo (cor, estilo, tipo). IMPORTANTE: IGNORE adereços temporários como chapéus, óculos de sol ou itens que a pessoa esteja segurando. Esta descrição do personagem, incluindo a roupa, deve ser usada consistentemente em todas as imagens geradas. Em seguida, crie um array chamado \`assets\` contendo 5 objetos. Cada objeto deve ter duas chaves: uma \`scene\` (string) e um \`dialogue\` (string). As 5 cenas devem formar uma mini-narrativa coesa, mostrando uma progressão de momentos durante a festa (ex: chegando, interagindo com amigos, dançando, brindando). Garanta que cada cena seja VISUALMENTE DISTINTA da outra em termos de ação, interação e composição. Cada \`scene\` DEVE incluir explicitamente 'a pessoa de referência' como protagonista. IMPORTANTE: Todas as cenas devem ser descritas em plano médio (da cintura para cima) ou close-up, garantindo que o rosto da pessoa de referência esteja visível e virado para a frente. O diálogo deve ser curto, impactante, em Português (BR) e começar com '■'. Finalmente, crie uma chave \`narrator_script\` (string). O \`narrator_script\` deve ser um texto curto (para 20-25 segundos de locução), em tom animado e convidativo, que capture a essência da festa. A saída deve ser um objeto JSON único com as três chaves: \`character_description\`, \`assets\` e \`narrator_script\`.`;
    } else {
        imageGenContextPart = { text: context.text };
        analysisContextParts = [personImagePart];
        analysisPrompt = `Analise ${personType} na imagem (a 'pessoa de referência'). Crie uma \`character_description\` (string) ${descriptionStyle} e EXTREMAMENTE detalhada da pessoa. Foque em características únicas e imutáveis (rosto, olhos, cabelo, tom de pele, estilo artístico) E descreva detalhadamente a roupa que a pessoa está vestindo (cor, estilo, tipo). IMPORTANTE: IGNORE adereços temporários. Esta descrição do personagem, incluindo a roupa, deve ser usada consistentemente em todas as imagens geradas. Em seguida, usando a seguinte narrativa como base: '${context.text}', crie um array chamado \`assets\` contendo 5 objetos. Cada objeto deve ter uma \`scene\` (string) e um \`dialogue\` (string). As cenas devem ser desdobramentos criativos e DIVERSIFICADOS da narrativa, mostrando uma progressão de eventos. Evite repetições. Cada cena deve ser VISUALMENTE DISTINTA da anterior, explorando diferentes ações, emoções ou interações do personagem dentro do contexto da história. As cenas devem incluir 'a pessoa de referência' como protagonista em plano médio ou close-up. O diálogo deve ser curto, impactante, em Português (BR) e começar com '■'. Finalmente, crie uma chave \`narrator_script\` (string). O \`narrator_script\` deve ser um texto curto (para 20-25 segundos de locução), baseado na narrativa, em tom apropriado ao contexto. A saída deve ser um objeto JSON único com as três chaves: \`character_description\`, \`assets\` e \`narrator_script\`.`;
    }


    const analysisResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [...analysisContextParts, {text: analysisPrompt}] }
    });

    const analysisResultText = cleanJsonString(analysisResponse.text);
    const { character_description, assets: sceneAssets, narrator_script } = JSON.parse(analysisResultText);

    if (!character_description || !Array.isArray(sceneAssets) || sceneAssets.length === 0 || !sceneAssets[0].scene || !sceneAssets[0].dialogue || !narrator_script) {
        throw new Error("A análise inicial da IA não retornou o formato esperado (esperava { character_description, assets: [...], narrator_script }).");
    }

    const assetPromises = sceneAssets.map(async (asset: { scene: string, dialogue: string }) => {
      const videoPrompt = { ...videoPromptTemplate };
      videoPrompt.character_description = character_description;
      videoPrompt.scene = asset.scene;
      videoPrompt.dialogue = asset.dialogue;
      videoPrompt.aspect_ratio = aspectRatio;
      
      const imageUrl = await generateImageForScene(personImagePart, imageGenContextPart, context.type, asset.scene, aspectRatio, character_description, isCartoon);

      return { imageUrl, videoPrompt };
    });
    
    const assets = await Promise.all(assetPromises);

    return { assets, narratorScript: narrator_script };
  } catch (error) {
    console.error("Error generating party assets:", error);
    throw new Error("Falha ao gerar os recursos. Verifique o console para mais detalhes.");
  }
};

export const regeneratePartyImage = async (
  personImage: File,
  context: GenerationContext,
  scene: string,
  aspectRatio: AspectRatio,
  characterDescription: string,
  isCartoon: boolean
): Promise<string> => {
    try {
        const personImagePart = await fileToGenerativePart(personImage);
        let contextPart: any;
        if (context.type === 'flyer') {
            contextPart = await fileToGenerativePart(context.file);
        } else {
            contextPart = { text: context.text };
        }
        
        return await generateImageForScene(personImagePart, contextPart, context.type, scene, aspectRatio, characterDescription, isCartoon);
    } catch (error) {
        console.error("Error regenerating party image:", error);
        throw new Error("Falha ao refazer a imagem. Verifique o console para mais detalhes.");
    }
};

export const generateDescriptivePrompt = (videoPrompt: Record<string, any>): string => {
  const { character_description, scene, style, lighting, aspect_ratio, negative_prompts } = videoPrompt;

  // Mapeia aspect_ratio para descrição
  let aspectRatioDesc = '';
  switch (aspect_ratio) {
    case '1:1': aspectRatioDesc = 'formato quadrado (proporção 1:1)'; break;
    case '16:9': aspectRatioDesc = 'formato paisagem (proporção 16:9)'; break;
    case '9:16': aspectRatioDesc = 'formato vertical (proporção 9:16)'; break;
    default: aspectRatioDesc = `proporção ${aspect_ratio}`;
  }

  // Monta a string descritiva
  let prompt = `Uma fotografia ${style || 'cinematográfica, realista'}, em ${aspectRatioDesc}.\n\n`;
  prompt += `A cena mostra: ${scene}.\n\n`;
  prompt += `Descrição detalhada da pessoa: ${character_description}.\n\n`;
  if (lighting) {
    prompt += `Iluminação: ${lighting}.\n\n`;
  }
  if (negative_prompts) {
    prompt += `Evite: ${negative_prompts}.`;
  }

  return prompt.trim();
};

export const generateSpeech = async (text: string): Promise<Blob> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Diga com um tom animado e convidativo: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("Nenhum áudio foi gerado pelo modelo.");
    }
    const pcmData = decode(base64Audio);
    // O modelo TTS retorna PCM de 24000Hz, 1 canal, 16 bits
    const wavBlob = pcmToWav(pcmData.buffer, 24000, 1, 16);
    return wavBlob;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw new Error("Falha ao gerar o áudio. Verifique o console para mais detalhes.");
  }
};


export const cartoonizeImage = async (
  personImage: File,
  style: CartoonStyle
): Promise<File> => {
  try {
    const personImagePart = await fileToGenerativePart(personImage);

    const prompt = `Transforme a pessoa na imagem em um personagem de desenho animado com alta fidelidade ao rosto original.
Estilo Alvo: "${style}".
A imagem de saída deve ser um retrato do personagem (da cintura para cima ou close-up), com um fundo neutro e suave (cinza claro ou desfocado).
Mantenha as mesmas roupas da imagem original.
A proporção da imagem gerada deve ser a mesma da imagem original.`;

    const imageResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          personImagePart,
          { text: prompt }
        ]
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    
    let imageDataUrl = '';
    const parts = imageResponse.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
          imageDataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageDataUrl) {
      throw new Error("Nenhuma imagem foi gerada pelo modelo de cartoonização.");
    }

    const response = await fetch(imageDataUrl);
    const blob = await response.blob();
    return new File([blob], `character_${style}.png`, { type: blob.type });

  } catch (error) {
    console.error("Error cartoonizing image:", error);
    throw new Error("Falha ao criar o personagem. Verifique o console para mais detalhes.");
  }
};
