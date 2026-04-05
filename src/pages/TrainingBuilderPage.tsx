import { BookOpen } from 'lucide-react';
import { WorkflowBuilderPage, type WorkflowBuilderConfig } from './WorkflowBuilderPage';

const config: WorkflowBuilderConfig = {
  builderType: 'training',
  label: 'Internal Training Guides',
  tagline: 'Convert any process or SOP into an engaging, trackable training experience.',
  accent: '#f59e0b',
  secondaryAccent: '#fbbf24',
  icon: BookOpen,
  inputPlaceholder: 'e.g. New-hire sales training, Security awareness, Tool onboarding…',
  descriptionPlaceholder:
    'Describe the skill or knowledge you want to train. Include the target audience and any existing documentation to build from.',
  showRole: true,
  showRequired: false,
  showCheckpoint: true,
  showGuidePicker: false,
  aiInsights: [
    'Simplified technical language for beginner audience',
    'Added knowledge checkpoints after key concepts',
    'Estimated completion time: 25–35 minutes',
    'Generated quiz questions for knowledge validation',
  ],
  generateLabel: 'Generate Training Guide',
  saveLabel: 'Publish Training Guide',
};

export const TrainingBuilderPage = () => <WorkflowBuilderPage config={config} />;
