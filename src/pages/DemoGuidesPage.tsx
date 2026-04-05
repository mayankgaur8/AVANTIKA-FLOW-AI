import { PlayCircle } from 'lucide-react';
import { CustomerBuilderPage, type CustomerBuilderConfig } from './CustomerBuilderPage';

const config: CustomerBuilderConfig = {
  customerType: 'demo',
  inputVariant: 'demo-type',
  label: 'Demo Walkthrough Guides',
  tagline: 'Empower every rep to run a flawless product demo.',
  accent: '#8b5cf6',
  secondaryAccent: '#a78bfa',
  icon: PlayCircle,
  titlePlaceholder: 'e.g. Enterprise security-focused product demo',
  descriptionPlaceholder: 'Add audience context, product narrative goals, and key objections to handle during the walkthrough.',
  aiInsights: [
    'Generates demo scripts and talking points',
    'Highlights weak narrative transitions',
    'Suggests media-driven storytelling flow',
    'Optimizes close and next-step prompts',
  ],
  generateLabel: 'Generate Demo Guide',
  saveLabel: 'Publish Demo Guide',
};

export const DemoGuidesPage = () => <CustomerBuilderPage config={config} />;
