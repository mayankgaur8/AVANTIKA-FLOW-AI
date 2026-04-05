import { Monitor } from 'lucide-react';
import { ITBuilderPage, type ITBuilderConfig } from './ITBuilderPage';

const config: ITBuilderConfig = {
  itType: 'tutorial',
  inputVariant: 'tool-picker',
  label: 'Software Setup Tutorials',
  tagline: 'Standardize tool adoption and reduce training time across the entire org.',
  accent: '#f59e0b',
  secondaryAccent: '#fbbf24',
  icon: Monitor,
  titlePlaceholder: 'e.g. GitHub onboarding for new engineers',
  descriptionPlaceholder:
    'Add team-specific conventions, required extensions, or any custom configuration that should be included in this tutorial.',
  showRole: false,
  showVerification: true,
  aiInsights: [
    'Tool-specific step patterns applied',
    'Exact commands and configuration included',
    'Beginner-friendly language with pro tips',
    'Verification checkpoint at end to confirm competency',
  ],
  generateLabel: 'Generate Tutorial',
  saveLabel: 'Publish Tutorial',
};

export const ITTutorialsPage = () => <ITBuilderPage config={config} />;
