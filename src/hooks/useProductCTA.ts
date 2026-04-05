import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { startGoogleOAuth, type OAuthStartOptions } from '../lib/oauth';
import { setPostAuthRedirect } from '../lib/postAuthRedirect';

export type ProductIntent =
  | 'sop-creation'
  | 'process-documentation'
  | 'workflow-standardization'
  | 'internal-training'
  | 'it-documentation'
  | 'troubleshooting'
  | 'devops-runbook'
  | 'software-tutorial'
  | 'finance-workflow'
  | 'expense-approval'
  | 'audit-documentation'
  | 'financial-training'
  | 'customer-onboarding'
  | 'support-playbook'
  | 'demo-walkthrough'
  | 'sales-enablement'
  | 'hr-onboarding'
  | 'training-program'
  | 'knowledge-base'
  | 'compliance-sop'
  | 'generic';

/** Map a product intent to the best in-app destination */
const intentToDestination = (intent: ProductIntent): string => {
  switch (intent) {
    case 'sop-creation':
      return '/workflow-ai/sop-builder';
    case 'process-documentation':
      return '/workflow-ai/process-capture';
    case 'workflow-standardization':
      return '/workflow-ai/standardize';
    case 'internal-training':
      return '/workflow-ai/training-builder';

    case 'it-documentation':
      return '/it/onboarding-guides';
    case 'troubleshooting':
      return '/it/troubleshooting';
    case 'devops-runbook':
      return '/it/devops-runbooks';
    case 'software-tutorial':
      return '/it/software-tutorials';

    case 'finance-workflow':
    case 'expense-approval':
    case 'audit-documentation':
    case 'financial-training':
      return '/dashboard?intent=finance-workflow';

    case 'customer-onboarding':
    case 'support-playbook':
    case 'demo-walkthrough':
    case 'sales-enablement':
      return '/dashboard?intent=customer-onboarding';

    case 'hr-onboarding':
    case 'training-program':
    case 'knowledge-base':
    case 'compliance-sop':
      return '/dashboard?intent=hr-onboarding';

    default:
      return '/dashboard';
  }
};

/**
 * Auth-aware product CTA hook.
 *
 * - Authenticated users → navigate directly to the product destination
 * - Unauthenticated users → start Google OAuth with redirect_to preserved
 */
export const useProductCTA = () => {
  const { state } = useAuth();
  const navigate = useNavigate();

  const isAuthenticated =
    state === 'email_verified_with_team' ||
    state === 'onboarding_incomplete';

  /**
   * @param intent      What the user wants to do
   * @param oauthOpts   Source/CTA tracking passed to OAuth (only used when not authenticated)
   * @param destination Optional override — defaults to intentToDestination(intent)
   */
  const handleCTA = (
    intent: ProductIntent,
    oauthOpts: Pick<OAuthStartOptions, 'sourcePage' | 'ctaClicked'>,
    destination?: string,
  ) => {
    const dest = destination ?? intentToDestination(intent);

    if (isAuthenticated) {
      navigate(dest);
      return;
    }

    // Persist the destination so AuthCallbackPage can recover it
    setPostAuthRedirect(dest);
    startGoogleOAuth({
      ...oauthOpts,
      redirectTo: dest,
      selectedUseCase: intent,
    });
  };

  return { handleCTA, isAuthenticated, intentToDestination };
};
