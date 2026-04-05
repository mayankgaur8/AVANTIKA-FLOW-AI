import { GitBranch } from 'lucide-react';
import { WorkflowBuilderPage, type WorkflowBuilderConfig } from './WorkflowBuilderPage';

const config: WorkflowBuilderConfig = {
  builderType: 'standardize',
  label: 'Workflow Standardization',
  tagline: 'Compare workflow variants across teams and publish a single, canonical standard.',
  accent: '#8b5cf6',
  secondaryAccent: '#a78bfa',
  icon: GitBranch,
  inputPlaceholder: 'e.g. Sales handoff process, Support escalation, Deployment runbook…',
  descriptionPlaceholder:
    'Describe the workflow you want to standardize. Select existing guides below for AI to compare and merge.',
  showRole: true,
  showRequired: true,
  showCheckpoint: false,
  showGuidePicker: true,
  aiInsights: [
    'Comparing workflow variants across selected guides',
    'Detected naming inconsistencies in steps 2–4',
    'Found duplicate steps — merged into single standard',
    'Recommended 3 steps as required, 2 as optional',
  ],
  generateLabel: 'Generate Standard Workflow',
  saveLabel: 'Publish Standard Workflow',
};

export const StandardizePage = () => <WorkflowBuilderPage config={config} />;
