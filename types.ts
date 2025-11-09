
export interface PartyAsset {
  imageUrl: string;
  videoPrompt: Record<string, any>;
  isRegenerating?: boolean;
}

export type AspectRatio = '1:1' | '16:9' | '9:16';

export type GenerationContext = { type: 'flyer'; file: File } | { type: 'narrative'; text: string };