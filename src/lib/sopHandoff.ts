import type { SopStep } from './api';

const SOP_HANDOFF_KEY = 'avantika:sop-builder:handoff:v1';

export interface SopBuilderHandoff {
  title: string;
  description?: string;
  sourceMethod?: 'recording' | 'ai-text' | 'template' | 'video' | 'document';
  steps: SopStep[];
  aiInsights?: string[];
}

export const setSopBuilderHandoff = (payload: SopBuilderHandoff) => {
  localStorage.setItem(SOP_HANDOFF_KEY, JSON.stringify(payload));
};

export const consumeSopBuilderHandoff = (): SopBuilderHandoff | null => {
  const raw = localStorage.getItem(SOP_HANDOFF_KEY);
  if (!raw) return null;
  localStorage.removeItem(SOP_HANDOFF_KEY);
  try {
    return JSON.parse(raw) as SopBuilderHandoff;
  } catch {
    return null;
  }
};
