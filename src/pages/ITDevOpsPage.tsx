import { Terminal } from 'lucide-react';
import { ITBuilderPage, type ITBuilderConfig } from './ITBuilderPage';

const config: ITBuilderConfig = {
  itType: 'runbook',
  inputVariant: 'runbook-type',
  label: 'DevOps Runbooks',
  tagline: 'Ship faster with documented, repeatable deployment checklists.',
  accent: '#10b981',
  secondaryAccent: '#34d399',
  icon: Terminal,
  titlePlaceholder: 'e.g. Production deployment — payments service v2.4',
  descriptionPlaceholder:
    'Describe the service, environment, and any special considerations for this runbook (feature flags, migrations, dependencies).',
  showRole: true,
  showVerification: true,
  aiInsights: [
    'Deployment type pattern detected and matched',
    'Pre- and post-execution verification steps added',
    'Stakeholder communication steps included',
    'Rollback and escalation paths documented',
  ],
  generateLabel: 'Generate Runbook',
  saveLabel: 'Save Runbook',
};

export const ITDevOpsPage = () => <ITBuilderPage config={config} />;
