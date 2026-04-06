import { buildApiUrl } from './config';

export interface OAuthStartOptions {
  sourcePage: string;
  ctaClicked: string;
  campaignSource?: string;
  selectedUseCase?: string;
  selectedTeam?: string;
  selectedPersona?: string;
  redirectTo?: string;
}

export const startGoogleOAuth = ({
  sourcePage,
  ctaClicked,
  campaignSource,
  selectedUseCase,
  selectedTeam,
  selectedPersona,
  redirectTo,
}: OAuthStartOptions) => {
  const params = new URLSearchParams({
    source_page: sourcePage,
    cta_clicked: ctaClicked,
    campaign_source: campaignSource || new URLSearchParams(window.location.search).get('utm_source') || '',
    selected_use_case: selectedUseCase || '',
    selected_team: selectedTeam || '',
    selected_persona: selectedPersona || '',
    redirect_to: redirectTo || '',
  });

  const authUrl = buildApiUrl(`/api/auth/google?${params.toString()}`);

  // Debug log — open DevTools → Console before clicking Sign In to verify
  // the URL points to the Azure backend, not the Vercel frontend.
  console.info('[oauth] Redirecting to Google auth:', authUrl);

  window.location.href = authUrl;
};
