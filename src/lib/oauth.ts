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

  // In production this targets the backend origin from VITE_API_URL.
  // In local dev it stays relative so the Vite proxy can forward it.
  window.location.href = buildApiUrl(`/api/auth/google?${params.toString()}`);
};
