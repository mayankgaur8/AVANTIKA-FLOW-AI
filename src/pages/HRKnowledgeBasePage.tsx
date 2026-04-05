import { BookOpen } from 'lucide-react';
import { HRBuilderPage, type HRBuilderConfig } from './HRBuilderPage';

const config: HRBuilderConfig = {
  hrType: 'knowledge',
  inputVariant: 'knowledge-source',
  label: 'Internal Knowledge Base',
  tagline: 'Capture institutional knowledge before it leaves.',
  accent: '#a855f7',
  secondaryAccent: '#c084fc',
  icon: BookOpen,
  titlePlaceholder: 'e.g. Employee lifecycle knowledge hub',
  descriptionPlaceholder: 'Add source material context, ownership model, category standards, and search behavior goals.',
  aiInsights: [
    'Generated structured knowledge capture flow',
    'Applied terminology and readability improvements',
    'Added smart search metadata recommendations',
    'Enabled versioning and archive governance',
  ],
  generateLabel: 'Generate Knowledge Workflow',
  saveLabel: 'Publish Knowledge Workflow',
};

export const HRKnowledgeBasePage = () => <HRBuilderPage config={config} />;
