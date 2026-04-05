import { Receipt } from 'lucide-react';
import { FinanceBuilderPage, type FinanceBuilderConfig } from './FinanceBuilderPage';

const config: FinanceBuilderConfig = {
  financeType: 'invoice',
  inputVariant: 'invoice-type',
  label: 'Invoice Processing Workflows',
  tagline: 'Consistent AP processes that scale with your volume.',
  accent: '#10b981',
  secondaryAccent: '#34d399',
  icon: Receipt,
  titlePlaceholder: 'e.g. Standard AP invoice processing — Q2 2026',
  descriptionPlaceholder:
    'Add any vendor-specific rules, spend thresholds, or ERP system names to tailor the workflow.',
  showApprovalLevel: true,
  showComplianceNote: true,
  showRole: true,
  aiInsights: [
    'Detects duplicate invoices before routing',
    'Auto-routes approval tiers by spend threshold',
    'Three-way match (PO × GR × Invoice) enforced',
    'Compliance-ready audit trail generated on save',
    'GL coding and cost center fields pre-populated',
  ],
  generateLabel: 'Generate Invoice Workflow',
  saveLabel: 'Save Invoice Workflow',
};

export const InvoiceProcessingPage = () => <FinanceBuilderPage config={config} />;
