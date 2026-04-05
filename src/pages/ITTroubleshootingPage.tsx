import { Wrench } from 'lucide-react';
import { ITBuilderPage, type ITBuilderConfig } from './ITBuilderPage';

const config: ITBuilderConfig = {
  itType: 'troubleshooting',
  inputVariant: 'log-input',
  label: 'Troubleshooting Documentation',
  tagline: 'Stop re-solving the same problems — capture the fix once, reuse forever.',
  accent: '#ef4444',
  secondaryAccent: '#f87171',
  icon: Wrench,
  titlePlaceholder: 'e.g. Database connection timeout after deployment',
  descriptionPlaceholder:
    'Describe the affected service, environment, and any steps already tried. The more detail, the better the AI diagnosis.',
  showRole: true,
  showVerification: true,
  aiInsights: [
    'Error pattern matched against known issue library',
    'Root cause hypothesis generated from log analysis',
    'Step-by-step fix with verification checkpoints',
    'Knowledge base entry auto-formatted for reuse',
  ],
  generateLabel: 'Generate Troubleshooting Guide',
  saveLabel: 'Save to Knowledge Base',
};

export const ITTroubleshootingPage = () => <ITBuilderPage config={config} />;
