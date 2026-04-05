import { UserPlus } from 'lucide-react';
import { HRBuilderPage, type HRBuilderConfig } from './HRBuilderPage';

const config: HRBuilderConfig = {
  hrType: 'onboarding',
  inputVariant: 'onboarding-template',
  label: 'Employee Onboarding Guides',
  tagline: 'Every new hire gets the same great first-week experience.',
  accent: '#22c55e',
  secondaryAccent: '#4ade80',
  icon: UserPlus,
  titlePlaceholder: 'e.g. Engineering onboarding flow — North America',
  descriptionPlaceholder: 'Include role requirements, day-1 logistics, mentor model, and 30-60-90 goals.',
  aiInsights: [
    'Generated role-based onboarding checklist',
    'Added Day 1, Week 1, and 30-60-90 structure',
    'Detected potential onboarding gaps',
    'Added completion and bottleneck tracking',
  ],
  generateLabel: 'Generate Onboarding Guide',
  saveLabel: 'Publish Onboarding Guide',
};

export const HROnboardingGuidesPage = () => <HRBuilderPage config={config} />;
