import { GraduationCap } from 'lucide-react';
import { HRBuilderPage, type HRBuilderConfig } from './HRBuilderPage';

const config: HRBuilderConfig = {
  hrType: 'training',
  inputVariant: 'training-type',
  label: 'Training Programs',
  tagline: 'Build modular L&D content your team actually finishes.',
  accent: '#3b82f6',
  secondaryAccent: '#60a5fa',
  icon: GraduationCap,
  titlePlaceholder: 'e.g. Manager communication training track',
  descriptionPlaceholder: 'Define target skill outcomes, module difficulty, and assignment cohorts.',
  aiInsights: [
    'Generated modular learning path',
    'Created quiz checkpoints automatically',
    'Simplified complex training content',
    'Added completion and score tracking',
  ],
  generateLabel: 'Generate Training Program',
  saveLabel: 'Publish Training Program',
};

export const HRTrainingProgramsPage = () => <HRBuilderPage config={config} />;
