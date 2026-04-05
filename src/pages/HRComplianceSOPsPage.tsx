import { Shield } from 'lucide-react';
import { HRBuilderPage, type HRBuilderConfig } from './HRBuilderPage';

const config: HRBuilderConfig = {
  hrType: 'compliance',
  inputVariant: 'compliance-type',
  label: 'Policy & Compliance SOPs',
  tagline: 'Keep everyone aligned on the latest policies automatically.',
  accent: '#ef4444',
  secondaryAccent: '#f87171',
  icon: Shield,
  titlePlaceholder: 'e.g. Data privacy policy compliance SOP',
  descriptionPlaceholder: 'Include policy scope, regulation mapping, assignment rules, and escalation controls.',
  aiInsights: [
    'Generated policy-to-action SOP steps',
    'Detected compliance control gaps',
    'Added assignment and reminder enforcement',
    'Prepared audit-ready tracking flow',
  ],
  generateLabel: 'Generate Compliance SOP',
  saveLabel: 'Publish Compliance SOP',
};

export const HRComplianceSOPsPage = () => <HRBuilderPage config={config} />;
