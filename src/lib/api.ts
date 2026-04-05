export interface SalesInquiryPayload {
  full_name: string;
  email: string;
  company?: string;
  team_size?: string;
  role?: string;
  interest_area?: string;
  message: string;
  source_page?: string;
  cta_clicked?: string;
  campaign_source?: string;
}

export interface SignupPayload {
  email: string;
  password?: string;
  name?: string;
  source_page?: string;
  cta_clicked?: string;
  selected_use_case?: string;
  selected_team?: string;
  selected_persona?: string;
  campaign_source?: string;
}

export interface DashboardGuide {
  id: string;
  title: string;
  steps: number;
  views: number;
  shared: boolean;
  created_at: string;
  updated_at: string;
  is_favorite?: boolean;
}

export interface DashboardChecklistItem {
  key: string;
  label: string;
  completed: boolean;
  action: string;
}

export interface DashboardBootstrapResponse {
  success: boolean;
  user: Record<string, unknown>;
  workspace: { id: string; name: string } | null;
  guides: DashboardGuide[];
  checklist: {
    progress: Record<string, boolean>;
    completedCount: number;
    total: number;
    percent: number;
    items: DashboardChecklistItem[];
  };
  stats: {
    guidesCreated: number;
    totalViews: number;
    teamMembers: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    text: string;
    guide_id: string | null;
    created_at: string;
  }>;
}

const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || 'Request failed');
  }
  return body as T;
};

const uploadRequest = async <T>(url: string, formData: FormData, token: string): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || 'Upload failed');
  }
  return body as T;
};

export interface SopStep {
  title: string;
  description: string;
  action_type?: string;
  order?: number;
}

export const api = {
  onboarding: (payload: Record<string, unknown>) =>
    request('/api/onboarding', { method: 'POST', body: JSON.stringify(payload) }),

  signup: (payload: SignupPayload) =>
    request<{ success: boolean; token: string; user: Record<string, unknown> }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ success: boolean; token: string; auth_state?: string; user: Record<string, unknown> }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: (token: string) =>
    request<{ success: boolean; auth_state?: string; user: Record<string, unknown> }>('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  dashboardBootstrap: (token: string) =>
    request<DashboardBootstrapResponse>('/api/dashboard/bootstrap', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  dashboardRecent: (token: string) =>
    request<{ success: boolean; recentGuides: RecentGuide[]; recentActivity: RecentActivity[] }>(
      '/api/dashboard/recent',
      { headers: { Authorization: `Bearer ${token}` } },
    ),

  dashboardCreateGuide: (token: string, payload: { title: string; mode: 'recording' | 'manual'; isSample?: boolean }) =>
    request<{ success: boolean; guide: DashboardGuide }>('/api/dashboard/guides', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  dashboardShareGuide: (token: string, guideId: string) =>
    request<{ success: boolean; guide: DashboardGuide }>(`/api/dashboard/guides/${guideId}/share`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  completeChecklistStep: (token: string, key: string) =>
    request<{ success: boolean }>('/api/dashboard/checklist/' + encodeURIComponent(key) + '/complete', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  resendVerification: (token: string) =>
    request('/api/auth/resend-verification', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  createTeam: (token: string, team_name: string) =>
    request('/api/team/create', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ team_name }),
    }),

  onboardingTeam: (token: string, team_name: string) =>
    request<{ success: boolean }>('/api/onboarding/team', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ team_name }),
    }),

  onboardingInvite: (token: string, emails: string[]) =>
    request<{ success: boolean }>('/api/onboarding/invite', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ emails }),
    }),

  onboardingComplete: (token: string) =>
    request<{ success: boolean }>('/api/onboarding/complete', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  changePendingEmail: (token: string, email: string) =>
    request<{ success: boolean; user: Record<string, unknown> }>('/api/auth/change-pending-email', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email }),
    }),

  adminApproveUser: (userId: string, secret: string) =>
    request(`/api/admin/users/${userId}/approve`, {
      method: 'POST',
      headers: { 'x-admin-secret': secret },
    }),

  adminListUsers: (secret: string) =>
    request<{ success: boolean; users: Array<Record<string, unknown>> }>('/api/admin/users', {
      headers: { 'x-admin-secret': secret },
    }),

  adminRejectUser: (userId: string, secret: string, reason?: string) =>
    request(`/api/admin/users/${userId}/reject`, {
      method: 'POST',
      headers: { 'x-admin-secret': secret },
      body: JSON.stringify({ reason }),
    }),

  salesInquiry: (payload: SalesInquiryPayload) =>
    request('/api/sales-inquiry', { method: 'POST', body: JSON.stringify(payload) }),

  demoRequest: (payload: Record<string, unknown>) =>
    request('/api/demo-request', { method: 'POST', body: JSON.stringify(payload) }),

  contact: (payload: { full_name: string; email: string; subject?: string; message: string; source_page?: string }) =>
    request('/api/contact', { method: 'POST', body: JSON.stringify(payload) }),

  // ─── Guide CRUD ───────────────────────────────────────────────────────────

  listGuides: (token: string) =>
    request<{ success: boolean; guides: GuideCard[] }>('/api/guides', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getGuide: (token: string, guideId: string) =>
    request<{ success: boolean; guide: GuideCard; steps: GuideStep[]; share: ShareSettings }>(
      `/api/guides/${guideId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    ),

  updateGuide: (token: string, guideId: string, patch: Partial<Pick<GuideCard, 'title' | 'description' | 'status' | 'thumbnail_url' | 'video_type' | 'video_url' | 'embed_url' | 'duration_seconds'>>) =>
    request<{ success: boolean; guide: GuideCard }>(`/api/guides/${guideId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    }),

  deleteGuide: (token: string, guideId: string) =>
    request<{ success: boolean }>(`/api/guides/${guideId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  duplicateGuide: (token: string, guideId: string) =>
    request<{ success: boolean; guide: GuideCard }>(`/api/guides/${guideId}/duplicate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  shareGuide: (token: string, guideId: string, payload: { shareType: 'private' | 'workspace' | 'public'; publish?: boolean }) =>
    request<{ success: boolean; guide: GuideCard; share: ShareSettings; share_url: string }>(
      `/api/guides/${guideId}/share`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),

  recordGuideView: (token: string, guideId: string) =>
    request<{ success: boolean; views: number }>(`/api/guides/${guideId}/view`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ─── Step CRUD ────────────────────────────────────────────────────────────

  guideAddStep: (token: string, guideId: string, step: { title: string; description?: string; screenshot_url?: string | null; action_type?: string; video_timestamp_seconds?: number | null }) =>
    request<{ success: boolean; step: GuideStep }>(`/api/guides/${guideId}/steps`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(step),
    }),

  guideUpdateStep: (token: string, guideId: string, stepId: string, patch: { title?: string; description?: string; screenshot_url?: string | null; video_timestamp_seconds?: number | null }) =>
    request<{ success: boolean; step: GuideStep }>(`/api/guides/${guideId}/steps/${stepId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    }),

  guideDeleteStep: (token: string, guideId: string, stepId: string) =>
    request<{ success: boolean }>(`/api/guides/${guideId}/steps/${stepId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ─── Guide-specific recording ─────────────────────────────────────────────

  guideStartRecording: (token: string, guideId: string) =>
    request<{ success: boolean; session: { id: string; guide_id: string; started_at: string } }>(`/api/guides/${guideId}/record/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  guideFinishRecording: (token: string, guideId: string, sessionId: string | null) =>
    request<{ success: boolean; guide: GuideCard; steps: GuideStep[] }>(`/api/guides/${guideId}/record/finish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sessionId }),
    }),

  guideCancelRecording: (token: string, guideId: string, sessionId: string | null) =>
    request<{ success: boolean }>(`/api/guides/${guideId}/record/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sessionId }),
    }),

  uploadImage: (token: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return uploadRequest<{ success: boolean; url: string }>('/api/uploads/image', formData, token);
  },

  uploadVideo: (token: string, file: File) => {
    const formData = new FormData();
    formData.append('video', file);
    return uploadRequest<{ success: boolean; videoType: 'uploaded'; videoUrl: string; thumbnailUrl: string | null; durationSeconds: number | null }>('/api/uploads/video', formData, token);
  },

  guideAddYouTube: (token: string, guideId: string, url: string) =>
    request<{ success: boolean; videoType: 'youtube'; videoUrl: string; embedUrl: string; thumbnailUrl: string }>(
      `/api/guides/${guideId}/video/youtube`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ url }) },
    ),

  // ─── Workspace / Team ─────────────────────────────────────────────────────

  getWorkspace: (token: string) =>
    request<WorkspaceBootstrap>('/api/workspace', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getWorkspaceMembers: (token: string) =>
    request<{ success: boolean; members: WorkspaceMember[]; myRole: MemberRole }>('/api/workspace/members', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  inviteMember: (token: string, email: string, role: MemberRole) =>
    request<{ success: boolean; joined?: boolean; pending?: boolean; member?: WorkspaceMember; invite?: PendingInvite }>(
      '/api/workspace/invite',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ email, role }) },
    ),

  updateMemberRole: (token: string, userId: string, role: MemberRole) =>
    request<{ success: boolean; member: WorkspaceMember }>(`/api/workspace/members/${userId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role }),
    }),

  removeMember: (token: string, userId: string) =>
    request<{ success: boolean }>(`/api/workspace/members/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  getWorkspaceGuides: (token: string) =>
    request<{ success: boolean; guides: GuideCard[] }>('/api/workspace/guides', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getWorkspaceActivity: (token: string) =>
    request<{ success: boolean; activity: WorkspaceActivity[] }>('/api/workspace/activity', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ─── Favorites ────────────────────────────────────────────────────────────

  getFavorites: (token: string) =>
    request<{ success: boolean; favorites: FavoriteGuide[] }>('/api/dashboard/favorites', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  addFavorite: (token: string, guideId: string) =>
    request<{ success: boolean; is_favorite: boolean }>(`/api/guides/${guideId}/favorite`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  removeFavorite: (token: string, guideId: string) =>
    request<{ success: boolean; is_favorite: boolean }>(`/api/guides/${guideId}/favorite`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  guideRemoveVideo: (token: string, guideId: string) =>
    request<{ success: boolean; guide: GuideCard }>(`/api/guides/${guideId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ video_type: null, video_url: null, embed_url: null, duration_seconds: null }),
    }),

  // ─── SOP Builder ─────────────────────────────────────────────────────────

  sopGenerateFromText: (token: string, payload: { title: string; description?: string }) =>
    request<{ success: boolean; title: string; steps: SopStep[]; source: string }>(
      '/api/sop/from-text',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),

  sopCreate: (token: string, payload: { title: string; description?: string; source: string; status?: 'draft' | 'published'; steps: SopStep[] }) =>
    request<{ success: boolean; guide: GuideCard; steps: SopStep[] }>(
      '/api/sop/create',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),

  // ─── Workflow Builders (Process Capture / Standardize / Training) ─────────

  workflowGenerate: (token: string, payload: { title: string; description?: string; builderType: WorkflowBuilderType; existingGuideIds?: string[] }) =>
    request<{ success: boolean; title: string; steps: WorkflowStep[]; aiInsights: string[]; builderType: WorkflowBuilderType }>(
      '/api/workflow/generate',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),

  workflowCreate: (token: string, payload: { title: string; description?: string; source: WorkflowBuilderType | 'manual'; status?: 'draft' | 'published'; category?: string; tags?: string[]; steps: WorkflowStep[] }) =>
    request<{ success: boolean; guide: GuideCard; steps: WorkflowStep[] }>(
      '/api/workflow/create',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),

  workflowListGuides: (token: string, source?: string) =>
    request<{ success: boolean; guides: WorkflowGuideCard[] }>(
      `/api/workflow/guides${source ? `?source=${encodeURIComponent(source)}` : ''}`,
      { headers: { Authorization: `Bearer ${token}` } },
    ),

  // ─── IT Builders (Onboarding / Troubleshooting / Runbook / Tutorial) ─────

  itGenerate: (
    token: string,
    payload: {
      title: string;
      description?: string;
      itType: ITBuilderType;
      role?: string;
      errorLog?: string;
      runbookType?: string;
      tool?: string;
    },
  ) =>
    request<{ success: boolean; title: string; steps: ITStep[]; aiInsights: string[]; itType: ITBuilderType }>(
      '/api/it/generate',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),

  // ─── Finance Builders (Invoice / Expense / Audit / Training) ─────────────

  financeGenerate: (
    token: string,
    payload: {
      title: string;
      description?: string;
      financeType: FinanceBuilderType;
      invoiceSubtype?: string;
      expenseCategory?: string;
      auditProcess?: string;
      tool?: string;
    },
  ) =>
    request<{ success: boolean; title: string; steps: FinanceStep[]; aiInsights: string[]; financeType: FinanceBuilderType }>(
      '/api/finance/generate',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),

  financeCreate: (
    token: string,
    payload: {
      title: string;
      description?: string;
      source: FinanceBuilderType;
      status?: 'draft' | 'published';
      category?: string;
      tags?: string[];
      steps: FinanceStep[];
    },
  ) =>
    request<{ success: boolean; guide: GuideCard; steps: FinanceStep[] }>(
      '/api/finance/create',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),

  // ─── Customer Builders (Onboarding / Support / Demo / Sales) ────────────

  customerGenerate: (
    token: string,
    payload: {
      title: string;
      description?: string;
      customerType: CustomerBuilderType;
      templateType?: string;
      issueType?: string;
      demoType?: string;
      salesProcess?: string;
      segment?: string;
    },
  ) =>
    request<{ success: boolean; title: string; steps: CustomerStep[]; aiInsights: string[]; customerType: CustomerBuilderType }>(
      '/api/customer/generate',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),

  customerCreate: (
    token: string,
    payload: {
      title: string;
      description?: string;
      source: CustomerBuilderType;
      status?: 'draft' | 'published';
      category?: string;
      tags?: string[];
      steps: CustomerStep[];
    },
  ) =>
    request<{ success: boolean; guide: GuideCard; steps: CustomerStep[] }>(
      '/api/customer/create',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),

  // ─── Action Systems (Record / Examples / AI Templates) ──────────────────

  actionRecordStart: (token: string, payload: { mode: 'screen' | 'browser' | 'manual'; title?: string }) =>
    request<{ success: boolean; session: { id: string; startedAt: string; mode: string } }>(
      '/api/actions/record/start',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),

  actionRecordEvent: (token: string, payload: { sessionId: string; eventType: string; target?: string; value?: string; url?: string; note?: string }) =>
    request<{ success: boolean; step: Record<string, unknown> }>(
      '/api/actions/record/event',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),

  actionRecordStop: (token: string, payload: { sessionId: string; title: string; description?: string; events: ActionRecordingEvent[] }) =>
    request<{ success: boolean; title: string; steps: SopStep[]; aiInsights: string[] }>(
      '/api/actions/record/stop',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),

  actionExamples: (token: string, role?: string) =>
    request<{ success: boolean; examples: ActionExample[]; recommendedExampleIds: string[] }>(
      `/api/actions/examples${role ? `?role=${encodeURIComponent(role)}` : ''}`,
      { headers: { Authorization: `Bearer ${token}` } },
    ),

  actionCustomizeExample: (token: string, exampleId: string, prompt: string) =>
    request<{ success: boolean; title: string; steps: SopStep[]; aiInsights: string[] }>(
      `/api/actions/examples/${exampleId}/customize`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ prompt }) },
    ),

  actionTemplateGenerate: (token: string, payload: { templateKey: ActionTemplateKey; prompt: string }) =>
    request<{ success: boolean; title: string; steps: SopStep[]; aiInsights: string[] }>(
      '/api/actions/templates/generate',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),

  // ─── Platform Engine (Optimize / Integrations / Agents) ─────────────────

  platformOptimizeWorkflows: (token: string) =>
    request<{ success: boolean; workflows: PlatformWorkflow[] }>(
      '/api/platform/optimize/workflows',
      { headers: { Authorization: `Bearer ${token}` } },
    ),

  platformOptimizeAnalyze: (token: string, payload: { guideId?: string; importedWorkflow?: string; goal?: string }) =>
    request<{ success: boolean; title: string; currentSteps: SopStep[]; optimizedSteps: SopStep[]; bottlenecks: string[]; aiInsights: string[]; suggestedVersionName: string }>(
      '/api/platform/optimize/analyze',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),

  platformIntegrationConnections: (token: string) =>
    request<{ success: boolean; connections: PlatformIntegrationTool[] }>(
      '/api/platform/integrations/connections',
      { headers: { Authorization: `Bearer ${token}` } },
    ),

  platformIntegrationConnect: (token: string, tool: PlatformIntegrationTool) =>
    request<{ success: boolean; tool: PlatformIntegrationTool; status: string; connections: PlatformIntegrationTool[]; aiInsights: string[] }>(
      '/api/platform/integrations/connect',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ tool }) },
    ),

  platformIntegrationSearch: (token: string, query: string) =>
    request<{ success: boolean; results: PlatformWorkflow[] }>(
      `/api/platform/integrations/search?query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    ),

  platformIntegrationTrigger: (token: string, payload: { source: PlatformTriggerSource; query?: string; guideId?: string }) =>
    request<{ success: boolean; workflow: PlatformWorkflow; source: PlatformTriggerSource; summary: string; steps: SopStep[]; aiInsights: string[] }>(
      '/api/platform/integrations/trigger',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),

  platformIntegrationEmbed: (token: string, payload: { guideId: string; target: 'internal-tool' | 'external-app' }) =>
    request<{ success: boolean; embedCode: string; aiInsights: string[] }>(
      '/api/platform/integrations/embed',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),

  platformAgentsActivate: (token: string, payload: { guideIds: string[]; autoFix: boolean }) =>
    request<{ success: boolean; config: { guideIds: string[]; autoFix: boolean; activatedAt: string } }>(
      '/api/platform/agents/activate',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),

  platformAgentsStatus: (token: string) =>
    request<{ success: boolean; active: boolean; config: { guideIds: string[]; autoFix: boolean; activatedAt: string } | null; metrics: PlatformAgentMetrics | null }>(
      '/api/platform/agents/status',
      { headers: { Authorization: `Bearer ${token}` } },
    ),

  platformAgentRecommendations: (token: string, guideIds: string[]) =>
    request<{ success: boolean; recommendations: PlatformAgentRecommendation[] }>(
      '/api/platform/agents/recommendations',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ guideIds }) },
    ),

  platformAgentApplyFix: (token: string, payload: { recommendationId: string; guideId: string }) =>
    request<{ success: boolean; title: string; recommendationId: string; steps: SopStep[]; aiInsights: string[] }>(
      '/api/platform/agents/apply-fix',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),

  // ─── Discover (Case Studies / Reviews / Spotlight) ──────────────────────

  discoverCaseStudies: (role?: string) =>
    request<{ success: boolean; caseStudies: CaseStudy[]; recommendedCaseStudyIds: string[] }>(
      `/api/discover/case-studies${role ? `?role=${encodeURIComponent(role)}` : ''}`,
    ),

  discoverCaseStudyById: (id: string) =>
    request<{ success: boolean; caseStudy: CaseStudyDetail }>(
      `/api/discover/case-studies/${id}`,
    ),

  discoverGenerateSimilar: (token: string, caseStudyId: string, prompt?: string) =>
    request<{ success: boolean; title: string; steps: SopStep[]; aiInsights: string[] }>(
      `/api/discover/case-studies/${caseStudyId}/generate-similar`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ prompt: prompt || '' }) },
    ),

  discoverWorkflowById: (workflowId: string) =>
    request<{ success: boolean; workflow: { title: string; steps: SopStep[] } }>(
      `/api/discover/workflows/${workflowId}`,
    ),

  discoverReviews: (params?: { useCase?: string; companySize?: string }) => {
    const q = new URLSearchParams();
    if (params?.useCase) q.set('useCase', params.useCase);
    if (params?.companySize) q.set('companySize', params.companySize);
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return request<{ success: boolean; reviews: Review[]; insights: ReviewInsights }>(`/api/discover/reviews${suffix}`);
  },

  discoverSpotlight: () =>
    request<{ success: boolean; featured: CustomerSpotlight | null; spotlights: CustomerSpotlight[] }>(
      '/api/discover/spotlight',
    ),

  discoverSpotlightById: (id: string) =>
    request<{ success: boolean; spotlight: CustomerSpotlightDetail }>(
      `/api/discover/spotlight/${id}`,
    ),

  // ─── Resources (Templates / Security / Guides) ─────────────────────────

  resourcesTemplates: (params?: { category?: string; query?: string; role?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.query) q.set('query', params.query);
    if (params?.role) q.set('role', params.role);
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return request<{ success: boolean; templates: ResourceTemplate[]; recommendedTemplateIds: string[] }>(`/api/resources/templates${suffix}`);
  },

  resourcesTemplateById: (id: string) =>
    request<{ success: boolean; template: ResourceTemplate }>(`/api/resources/templates/${id}`),

  resourcesCustomizeTemplate: (token: string, templateId: string, companyContext: string) =>
    request<{ success: boolean; title: string; steps: SopStep[]; aiInsights: string[] }>(
      `/api/resources/templates/${templateId}/customize`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ companyContext }) },
    ),

  resourcesImproveTemplate: (templateId: string) =>
    request<{ success: boolean; suggestions: string[] }>(`/api/resources/templates/${templateId}/improve`, { method: 'POST' }),

  resourcesSecurityDocs: (category?: string) =>
    request<{ success: boolean; docs: SecurityDoc[] }>(`/api/resources/security/docs${category ? `?category=${encodeURIComponent(category)}` : ''}`),

  resourcesSecurityDocById: (id: string) =>
    request<{ success: boolean; doc: SecurityDoc }>(`/api/resources/security/docs/${id}`),

  resourcesSecurityAsk: (query: string) =>
    request<{ success: boolean; answer: string; relatedDocs: Array<{ id: string; title: string }> }>(
      '/api/resources/security/ask',
      { method: 'POST', body: JSON.stringify({ query }) },
    ),

  resourcesSecuritySummarize: (docId: string) =>
    request<{ success: boolean; summary: string; keyPoints: string[] }>(`/api/resources/security/docs/${docId}/summarize`, { method: 'POST' }),

  resourcesSecurityAuditReport: (token: string, scope: string) =>
    request<{ success: boolean; reportTitle: string; findings: string[]; compliance: string[] }>(
      '/api/resources/security/audit-report',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ scope }) },
    ),

  resourcesGuides: (params?: { type?: string; query?: string; role?: string }) => {
    const q = new URLSearchParams();
    if (params?.type) q.set('type', params.type);
    if (params?.query) q.set('query', params.query);
    if (params?.role) q.set('role', params.role);
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return request<{ success: boolean; articles: ResourceArticle[]; recommendedArticleIds: string[] }>(`/api/resources/guides${suffix}`);
  },

  resourcesGuideById: (id: string) =>
    request<{ success: boolean; article: ResourceArticle }>(`/api/resources/guides/${id}`),

  resourcesGuideSummarize: (id: string) =>
    request<{ success: boolean; summary: string; keyPoints: string[] }>(`/api/resources/guides/${id}/summarize`, { method: 'POST' }),

  resourcesGuideToWorkflow: (id: string) =>
    request<{ success: boolean; title: string; steps: SopStep[]; aiInsights: string[] }>(`/api/resources/guides/${id}/to-workflow`, { method: 'POST' }),

  // ─── Home Selector (Smart Launcher) ─────────────────────────────────────

  homeSelectorBootstrap: (params?: { role?: string; userId?: string }, token?: string) => {
    const q = new URLSearchParams();
    if (params?.role) q.set('role', params.role);
    if (params?.userId) q.set('userId', params.userId);
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return request<{
      success: boolean;
      intents: WorkflowIntent[];
      recommendedIntentId: string;
      prefillByIntent: Record<string, Record<string, string>>;
      instantTemplates: Array<{ intentId: string; template: string }>;
      roleDetected: string | null;
    }>(`/api/home/selector/bootstrap${suffix}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  },

  homeSelectorSelect: (payload: { userId?: string; selectedIntent: string; context?: Record<string, unknown> }, token?: string) =>
    request<{ success: boolean; selection: UserSelection }>(
      '/api/home/selector/select',
      { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : undefined, body: JSON.stringify(payload) },
    ),

  homeSelectorGenerate: (intentId: string, payload: Record<string, unknown>) =>
    request<{ success: boolean; intentId: string; title: string; description: string; steps: SopStep[]; aiInsights: string[] }>(
      '/api/home/selector/generate',
      { method: 'POST', body: JSON.stringify({ intentId, payload }) },
    ),

  homeSelectorSuggest: (text: string) =>
    request<{ success: boolean; suggestedIntentId: string; title: string; description: string; steps: SopStep[]; aiInsights: string[] }>(
      '/api/home/selector/suggest',
      { method: 'POST', body: JSON.stringify({ text }) },
    ),

  // ─── HR Builders (Onboarding / Training / Knowledge / Compliance) ───────

  hrGenerate: (
    token: string,
    payload: {
      title: string;
      description?: string;
      hrType: HRBuilderType;
      onboardingTemplate?: string;
      trainingType?: string;
      knowledgeSource?: string;
      complianceType?: string;
      audience?: string;
    },
  ) =>
    request<{ success: boolean; title: string; steps: HRStep[]; aiInsights: string[]; hrType: HRBuilderType }>(
      '/api/hr/generate',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),

  hrCreate: (
    token: string,
    payload: {
      title: string;
      description?: string;
      source: HRBuilderType;
      status?: 'draft' | 'published';
      category?: string;
      tags?: string[];
      steps: HRStep[];
    },
  ) =>
    request<{ success: boolean; guide: GuideCard; steps: HRStep[] }>(
      '/api/hr/create',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),

  itCreate: (
    token: string,
    payload: {
      title: string;
      description?: string;
      source: ITBuilderType;
      status?: 'draft' | 'published';
      category?: string;
      tags?: string[];
      steps: ITStep[];
    },
  ) =>
    request<{ success: boolean; guide: GuideCard; steps: ITStep[] }>(
      '/api/it/create',
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) },
    ),
};

// ─── Shared types (used across api.ts, DashboardPage, GuidePage) ─────────────

export type MemberRole = 'admin' | 'editor' | 'viewer';

export interface WorkspaceMember {
  id: string;
  user_id: string;
  workspace_id: string;
  role: MemberRole;
  joined_at: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface PendingInvite {
  id: string;
  workspace_id: string;
  email: string;
  role: MemberRole;
  invited_by: string;
  invited_at: string;
}

export interface WorkspaceActivity {
  id: string;
  type: string;
  text: string;
  guide_id: string | null;
  created_at: string;
}

export interface WorkspaceBootstrap {
  success: boolean;
  workspace: { id: string; name: string; owner_id: string };
  members: WorkspaceMember[];
  guides: GuideCard[];
  activity: WorkspaceActivity[];
  pendingInvites: PendingInvite[];
  myRole: MemberRole;
}

export interface FavoriteGuide {
  id: string;
  title: string;
  description: string;
  workspace_id: string;
  workspace_name: string | null;
  owner_user_id: string;
  owner_name: string;
  status: 'draft' | 'published';
  total_steps: number;
  views: number;
  thumbnail_url: string | null;
  share_type: 'private' | 'workspace' | 'public';
  created_at: string;
  updated_at: string;
  video_type: 'youtube' | 'uploaded' | 'recorded' | null;
  is_favorite: true;
}

export interface GuideCard {
  id: string;
  title: string;
  description: string;
  workspace_id: string;
  owner_user_id: string;
  owner_name: string;
  status: 'draft' | 'published';
  total_steps: number;
  views: number;
  thumbnail_url: string | null;
  share_type: 'private' | 'workspace' | 'public';
  created_at: string;
  updated_at: string;
  // Video fields
  video_type: 'youtube' | 'uploaded' | 'recorded' | null;
  video_url: string | null;
  embed_url: string | null;
  duration_seconds: number | null;
  // Favorites
  is_favorite?: boolean;
}

export interface GuideStep {
  id: string;
  guide_id: string;
  step_number: number;
  title: string;
  description: string;
  screenshot_url: string | null;
  action_type: string;
  metadata_json: Record<string, unknown>;
  video_timestamp_seconds: number | null;
  created_at: string;
}

export interface RecentGuide {
  id: string;
  title: string;
  totalSteps: number;
  updatedAt: string;
  lastOpenedAt: string;
  workspaceName: string;
  status: 'draft' | 'published';
  views: number;
  owner: string;
}

export interface RecentActivity {
  id: string;
  type: string;
  guideId: string | null;
  guideTitle: string | null;
  action: string;
  createdAt: string;
}

export interface ShareSettings {
  share_type: 'private' | 'workspace' | 'public';
  share_token: string | null;
  public_slug: string | null;
  invited_emails: string[];
}

export type ActionTemplateKey = 'onboarding' | 'internal-workflow' | 'runbook' | 'training';

export interface ActionRecordingEvent {
  eventType: string;
  target?: string;
  value?: string;
  url?: string;
  note?: string;
}

export interface ActionExample {
  id: string;
  category: string;
  title: string;
  description: string;
  aiInsights: string[];
  steps: SopStep[];
}

export type PlatformIntegrationTool = 'slack' | 'teams' | 'jira' | 'crm-erp';
export type PlatformTriggerSource = 'chat' | 'api' | 'event';

export interface PlatformWorkflow {
  id: string;
  title: string;
  description: string;
  source: string;
  status: string;
  total_steps: number;
  updated_at: string;
}

export interface PlatformAgentMetrics {
  monitoredCount: number;
  inefficienciesDetected: number;
  recommendationsGenerated: number;
  autoFixEnabled: boolean;
}

export interface PlatformAgentRecommendation {
  id: string;
  guideId: string;
  workflowTitle: string;
  issue: string;
  impact: string;
  suggestedFix: string;
  confidence: number;
}

export interface CaseStudy {
  id: string;
  company_name: string;
  industry: string;
  problem: string;
  solution: string;
  result_metrics: {
    time_saved: string;
    efficiency_improvement: string;
    cost_reduction: string;
    roi_impact?: string;
  };
  workflow_id: string;
  ai_summary: string;
}

export interface CaseStudyDetail extends CaseStudy {
  before_after: { before: string; after: string };
  workflow?: { title: string; steps: SopStep[] } | null;
  suggested_workflows: Array<{ id: string; title: string; workflow_id: string }>;
}

export interface Review {
  id: string;
  user_name: string;
  role: string;
  company: string;
  rating: number;
  comment: string;
  use_case?: string;
  company_size?: string;
  impact?: {
    time_saved?: string;
    efficiency_improvement?: string;
    cost_reduction?: string;
  };
}

export interface ReviewInsights {
  avg_rating: number;
  sentiment_trend: string;
  key_benefits: string[];
}

export interface CustomerSpotlight {
  id: string;
  company_name: string;
  highlight: string;
  testimonial: string;
  metrics: {
    time_saved: string;
    efficiency_improvement: string;
    cost_reduction: string;
  };
  case_study_id: string;
}

export interface CustomerSpotlightDetail extends CustomerSpotlight {
  ai_summary: string;
  caseStudy: CaseStudy | null;
}

export interface ResourceTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  workflow_steps: SopStep[];
  usage_count: number;
  estimated_time_saved: string;
}

export interface SecurityDoc {
  id: string;
  title: string;
  category: string;
  content: string;
  compliance_type: string;
}

export interface ResourceArticle {
  id: string;
  title: string;
  type: 'guide' | 'blog' | 'update';
  category: string;
  read_time: string;
  summary: string;
  content: string;
  related_templates: string[];
}

export interface WorkflowIntent {
  id: string;
  name: string;
  category: string;
  default_template: string;
}

export interface UserSelection {
  user_id: string;
  selected_intent: string;
  timestamp: string;
}

// ─── Finance Builders ─────────────────────────────────────────────────────────

export type FinanceBuilderType = 'invoice' | 'expense' | 'audit' | 'training';

export interface FinanceStep {
  title: string;
  description: string;
  action_type?: string;
  step_number?: number;
  order?: number;
  approval_level?: 'auto' | 'manager' | 'finance' | 'cfo';
  role?: string;
  tip?: string;
  compliance_note?: string;
}

// ─── IT Builders ─────────────────────────────────────────────────────────────

export type ITBuilderType = 'onboarding' | 'troubleshooting' | 'runbook' | 'tutorial';

export interface ITStep {
  title: string;
  description: string;
  action_type?: string;
  step_number?: number;
  order?: number;
  role?: string;
  tip?: string;
  verification?: string;
}

// ─── Customer Builders ─────────────────────────────────────────────────────

export type CustomerBuilderType = 'onboarding' | 'support' | 'demo' | 'sales';

export interface CustomerStep {
  title: string;
  description: string;
  action_type?: string;
  step_number?: number;
  order?: number;
  role?: string;
  tip?: string;
  script?: string;
  media_url?: string;
  required?: boolean;
}

// ─── HR Builders ───────────────────────────────────────────────────────────

export type HRBuilderType = 'onboarding' | 'training' | 'knowledge' | 'compliance';

export interface HRStep {
  title: string;
  description: string;
  action_type?: string;
  step_number?: number;
  order?: number;
  role?: string;
  tip?: string;
  media_url?: string;
  quiz_question?: string;
  compliance_note?: string;
  required?: boolean;
}

// ─── Workflow Builder (Process Capture / Standardize / Training) ──────────────

export type WorkflowBuilderType = 'process-capture' | 'standardize' | 'training';

export interface WorkflowStep {
  title: string;
  description: string;
  action_type?: string;
  order?: number;
  required?: boolean;
  role?: string;
  tip?: string;
  has_checkpoint?: boolean;
  checkpoint_question?: string;
}

export interface WorkflowGuideCard {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published';
  source: string;
  total_steps: number;
  updated_at: string;
  owner_name: string;
}
