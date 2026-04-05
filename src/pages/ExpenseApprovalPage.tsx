import { BadgePercent } from 'lucide-react';
import { FinanceBuilderPage, type FinanceBuilderConfig } from './FinanceBuilderPage';

const config: FinanceBuilderConfig = {
  financeType: 'expense',
  inputVariant: 'expense-category',
  label: 'Expense Approval SOPs',
  tagline: 'Enforce policy every time with guided approval flows.',
  accent: '#f59e0b',
  secondaryAccent: '#fbbf24',
  icon: BadgePercent,
  titlePlaceholder: 'e.g. Travel & Entertainment expense approval SOP',
  descriptionPlaceholder:
    'Include any policy limits, approval chain details, or specific exception-handling rules for this expense category.',
  showApprovalLevel: true,
  showComplianceNote: true,
  showRole: true,
  aiInsights: [
    'Policy violation flags on every submission',
    'Duplicate expense detection within 60-day window',
    'Auto-categorization of expense types',
    'Escalation path generated for exceptions',
    'Reimbursement timeline built into each step',
  ],
  generateLabel: 'Generate Expense Approval SOP',
  saveLabel: 'Publish Expense SOP',
};

export const ExpenseApprovalPage = () => <FinanceBuilderPage config={config} />;
