export interface OAuthStartOptions {
  sourcePage: string;
  ctaClicked: string;
  campaignSource?: string;
  selectedUseCase?: string;
  redirectTo?: string;
}

export const startGoogleOAuth = ({
  sourcePage,
  ctaClicked,
  campaignSource,
  selectedUseCase,
  redirectTo,
}: OAuthStartOptions) => {
  const params = new URLSearchParams({
    source_page: sourcePage,
    cta_clicked: ctaClicked,
    campaign_source: campaignSource || new URLSearchParams(window.location.search).get('utm_source') || '',
    selected_use_case: selectedUseCase || '',
    redirect_to: redirectTo || '',
  });

  window.location.href = `/api/auth/google?${params.toString()}`;
};
