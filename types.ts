export enum ViewMode {
  SPLIT = 'SPLIT',
  UNIFIED = 'UNIFIED',
  DIFF = 'DIFF'
}

export interface DiffChunk {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export interface EditorState {
  original: string;
  modified: string;
}

export interface AIRequestConfig {
  prompt: string;
  systemInstruction?: string;
}
