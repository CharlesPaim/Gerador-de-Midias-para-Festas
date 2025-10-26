
import { GoogleGenAI } from "@google/genai";
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

export const generatePartyAssets = async (
  personImage: File,
  flyerImage: File,
  aspectRatio: AspectRatio
): Promise<PartyAsset[]> => {
  try {
    const personImagePart = await fileToGenerativePart(personImage);
    const flyerImagePart = await fileToGenerativePart(flyerImage);

    // Step 1: Analyze person and flyer to get character description and scenes
    const analysisPrompt = "Analise a pessoa na primeira imagem e o tema da festa no segundo. Crie uma `character_description` extremamente detalhada e fotorrealista da pessoa, focando em características únicas para garantir máxima fidelidade. Inclua formato do rosto, tipo e cor do cabelo, cor dos olhos, tom de pele, idade aproximada, expressão e roupas. Em seguida, crie 5 `scenes` distintas e criativas para imagens promocionais que incorporem esta pessoa e o tema da festa. A saída deve ser um objeto JSON com uma chave `character_description` (string) e uma chave `scenes` (array de 5 strings).";
    const analysisResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [personImagePart, flyerImagePart, {text: analysisPrompt}] }
    });

    const analysisResultText = cleanJsonString(analysisResponse.text);
    const { character_description, scenes } = JSON.parse(analysisResultText);

    if (!character_description || !Array.isArray(scenes) || scenes.length !== 5) {
        throw new Error("A análise inicial da IA não retornou o formato esperado.");
    }

    // Step 2 & 3: Generate video prompts and images in parallel
    const assetPromises = scenes.map(async (scene: string) => {
      // Step 2: Generate Video Prompt (using the template)
      const videoPrompt = { ...videoPromptTemplate };
      videoPrompt.character_description = character_description;
      videoPrompt.scene = scene;
      videoPrompt.aspect_ratio = aspectRatio;
      // Here you could call Gemini again to fill other fields like dialogue, camera etc.
      // For simplicity, we are using the template directly.

      // Step 3: Generate Image
      const imageGenerationPrompt = `Uma fotografia fotorrealista de alta qualidade de uma pessoa: ${character_description}. A pessoa está na seguinte cena: ${scene}. O estilo é cinematográfico e vibrante. A proporção da imagem deve ser ${aspectRatio}.`;
      
      const imageResponse = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: imageGenerationPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: aspectRatio,
          outputMimeType: 'image/jpeg'
        }
      });
      
      const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
      const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;

      return { imageUrl, videoPrompt };
    });

    return await Promise.all(assetPromises);
  } catch (error) {
    console.error("Error generating party assets:", error);
    throw new Error("Falha ao gerar os recursos. Verifique o console para mais detalhes.");
  }
};
