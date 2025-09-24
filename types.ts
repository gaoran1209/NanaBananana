import { XIcon } from './icons/XIcon';
import { UserIcon } from './icons/UserIcon';
import { LandscapeIcon } from './icons/LandscapeIcon';

export type TaskStatus = 'pending' | 'completed' | 'error';

export type View = 'create' | 'model' | 'try-on' | 'background' | 'posture' | 'fusion';

export interface Task {
  id: string;
  prompt: string;
  inputImages?: string[];
  outputImageUrl?: string;
  status: TaskStatus;
  error?: string;
  timestamp: Date;
  retryCount?: number;
  view: View;
  batchId?: string;
}

export interface PromptPreset {
  id:string;
  name: string;
  prompt: string;
}