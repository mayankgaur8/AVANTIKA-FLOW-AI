import { MessageSquare } from 'lucide-react';
import { CustomerBuilderPage, type CustomerBuilderConfig } from './CustomerBuilderPage';

const config: CustomerBuilderConfig = {
  customerType: 'support',
  inputVariant: 'support-issue',
  label: 'Support Response Playbooks',
  tagline: 'Resolve tickets faster with guided, consistent answers.',
  accent: '#3b82f6',
  secondaryAccent: '#60a5fa',
  icon: MessageSquare,
  titlePlaceholder: 'e.g. Tier-1 API timeout response playbook',
  descriptionPlaceholder: 'Include common issue patterns, escalation policy, SLA expectations, and response tone requirements.',
  aiInsights: [
    'Classifies ticket issue and urgency',
    'Creates consistent response scripts',
    'Builds diagnosis and resolution flow',
    'Stores reusable patterns for next tickets',
  ],
  generateLabel: 'Generate Support Playbook',
  saveLabel: 'Save Support Playbook',
};

export const SupportPlaybooksPage = () => <CustomerBuilderPage config={config} />;
