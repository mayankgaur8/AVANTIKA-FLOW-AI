import { FileText } from 'lucide-react';
import { WorkflowBuilderPage, type WorkflowBuilderConfig } from './WorkflowBuilderPage';

const config: WorkflowBuilderConfig = {
  builderType: 'process-capture',
  label: 'Process Documentation',
  tagline: 'Turn any business process into a clear, reusable step-by-step guide in minutes.',
  accent: '#3b82f6',
  secondaryAccent: '#60a5fa',
  icon: FileText,
  inputPlaceholder: 'e.g. Employee onboarding, Invoice approval, Shipping fulfillment…',
  descriptionPlaceholder:
    'Describe the process in plain language. Include who does it, what triggers it, and what a completed run looks like.',
  showRole: false,
  showRequired: false,
  showCheckpoint: false,
  showGuidePicker: false,
  aiInsights: [
    'Detected sequential workflow structure',
    'Added ownership fields to each step',
    'Flagged potential decision points for documentation',
    'Suggested SLA targets based on process type',
  ],
  generateLabel: 'Generate Process Guide',
  saveLabel: 'Save Process Guide',
};

export const ProcessCapturePage = () => <WorkflowBuilderPage config={config} />;
