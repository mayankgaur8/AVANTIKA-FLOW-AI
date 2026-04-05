import { GraduationCap } from 'lucide-react';
import { FinanceBuilderPage, type FinanceBuilderConfig } from './FinanceBuilderPage';

const config: FinanceBuilderConfig = {
  financeType: 'training',
  inputVariant: 'tool-picker',
  label: 'Financial Tool Training',
  tagline: 'Fast-track adoption of ERP and accounting platforms.',
  accent: '#3b82f6',
  secondaryAccent: '#60a5fa',
  icon: GraduationCap,
  titlePlaceholder: 'e.g. SAP FI onboarding for new AP team members',
  descriptionPlaceholder:
    'Describe the role, current skill level, and which modules or workflows the training should cover.',
  showApprovalLevel: false,
  showComplianceNote: false,
  showRole: true,
  aiInsights: [
    'Simplifies complex ERP steps for first-time users',
    'Adds contextual tips for common mistakes',
    'Role-based learning path auto-structured',
    'Estimated completion time calculated per module',
    'Transaction code reference cards embedded',
  ],
  generateLabel: 'Generate Training Guide',
  saveLabel: 'Publish Training Guide',
};

export const FinanceToolTrainingPage = () => <FinanceBuilderPage config={config} />;
