import { UserCheck } from 'lucide-react';
import { CustomerBuilderPage, type CustomerBuilderConfig } from './CustomerBuilderPage';

const config: CustomerBuilderConfig = {
  customerType: 'onboarding',
  inputVariant: 'onboarding-template',
  label: 'Customer Onboarding Flows',
  tagline: 'Turn first-time users into power users, systematically.',
  accent: '#f59e0b',
  secondaryAccent: '#fbbf24',
  icon: UserCheck,
  titlePlaceholder: 'e.g. Enterprise onboarding flow — RevOps team',
  descriptionPlaceholder: 'Add onboarding goals, activation criteria, and any required handoff points for customer success.',
  aiInsights: [
    'Detects missing activation milestones',
    'Generates role-based onboarding paths',
    'Includes drop-off and completion checkpoints',
    'Suggests segment-specific improvements',
  ],
  generateLabel: 'Generate Onboarding Flow',
  saveLabel: 'Publish Onboarding Flow',
};

export const CustomerOnboardingFlowsPage = () => <CustomerBuilderPage config={config} />;
