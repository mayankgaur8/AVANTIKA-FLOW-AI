import { ShieldCheck } from 'lucide-react';
import { FinanceBuilderPage, type FinanceBuilderConfig } from './FinanceBuilderPage';

const config: FinanceBuilderConfig = {
  financeType: 'audit',
  inputVariant: 'process-picker',
  label: 'Audit Documentation',
  tagline: 'Always audit-ready with automated trail capture.',
  accent: '#8b5cf6',
  secondaryAccent: '#a78bfa',
  icon: ShieldCheck,
  titlePlaceholder: 'e.g. Q4 2025 AP Audit Documentation',
  descriptionPlaceholder:
    'Specify the audit period, materiality threshold, sampling approach, and any compliance frameworks in scope (SOX, GAAP, IFRS).',
  showApprovalLevel: false,
  showComplianceNote: true,
  showRole: true,
  aiInsights: [
    'Auto-generates complete audit trail from transactions',
    'Detects missing documentation and control gaps',
    'Flags segregation of duties violations',
    'Compliance checklist (SOX, GAAP) auto-embedded',
    'Exception register built step-by-step',
  ],
  generateLabel: 'Generate Audit Documentation',
  saveLabel: 'Finalize Audit Report',
};

export const AuditDocsPage = () => <FinanceBuilderPage config={config} />;
