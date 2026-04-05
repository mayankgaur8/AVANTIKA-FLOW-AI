import { Zap } from 'lucide-react';
import { CustomerBuilderPage, type CustomerBuilderConfig } from './CustomerBuilderPage';

const config: CustomerBuilderConfig = {
  customerType: 'sales',
  inputVariant: 'sales-process',
  label: 'Sales Enablement Workflows',
  tagline: 'Get new reps to quota faster with proven playbooks.',
  accent: '#ec4899',
  secondaryAccent: '#f472b6',
  icon: Zap,
  titlePlaceholder: 'e.g. Discovery-to-proposal conversion workflow',
  descriptionPlaceholder: 'Include ICP notes, objection themes, qualification criteria, and progression KPIs for each stage.',
  aiInsights: [
    'Generates sales scripts for each stage',
    'Adds objection-handling branches',
    'Suggests stronger messaging paths',
    'Includes conversion and activity tracking hooks',
  ],
  generateLabel: 'Generate Sales Workflow',
  saveLabel: 'Publish Sales Workflow',
};

export const SalesWorkflowsPage = () => <CustomerBuilderPage config={config} />;
