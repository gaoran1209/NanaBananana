export interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: Date;
}

export interface PromptPreset {
  id: string;
  name: string;
  prompt: string;
}
