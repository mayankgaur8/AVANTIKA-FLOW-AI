import { UserPlus } from 'lucide-react';
import { ITBuilderPage, type ITBuilderConfig } from './ITBuilderPage';

const config: ITBuilderConfig = {
  itType: 'onboarding',
  inputVariant: 'role-picker',
  label: 'System Onboarding Guides',
  tagline: 'New employee IT setup in one click through guided workflows.',
  accent: '#6366f1',
  secondaryAccent: '#818cf8',
  icon: UserPlus,
  titlePlaceholder: 'e.g. New hire IT onboarding — Q3 2025',
  descriptionPlaceholder:
    'Add any team-specific tools, access requirements, or compliance notes to include in this onboarding guide.',
  showRole: true,
  showVerification: true,
  aiInsights: [
    'Role-based access and tool requirements auto-detected',
    'Security and compliance training steps included',
    'Device enrollment and MDM provisioning steps added',
    'First-contribution milestone added as capability check',
  ],
  generateLabel: 'Generate Onboarding Guide',
  saveLabel: 'Publish Onboarding Guide',
};

export const ITOnboardingPage = () => <ITBuilderPage config={config} />;
