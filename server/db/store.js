const { v4: uuidv4 } = require('uuid');

const usersByEmail = new Map();
const usersById = new Map();
const workspaces = new Map();

const guidesById = new Map();
const guidesByWorkspace = new Map();
const guideStepsByGuide = new Map();
const guideShareByGuide = new Map();
const guideActivitiesByGuide = new Map();
const recordingSessionsById = new Map();

// favoritesByUser: Map<userId, Set<guideId>>
const favoritesByUser = new Map();

// workspaceMembers: Map<workspaceId, Map<userId, memberRecord>>
const workspaceMembers = new Map();
// pendingInvites: Map<workspaceId, Array<{id, email, role, invitedAt, invitedBy}>>
const pendingInvites = new Map();

const onboardingEvents = new Map();
const salesInquiries = new Map();
const demoRequests = new Map();
const authSessions = new Map();

const activityByWorkspace = new Map();

const DEFAULT_ONBOARDING_PROGRESS = {
  workspaceCreated: false,
  invitedTeam: false,
  installedExtension: false,
  createdGuide: false,
  sharedGuide: false,
};

const USER_STATUSES = ['pending_approval', 'approved', 'rejected'];

const getMergedProgress = (progress = {}) => ({
  ...DEFAULT_ONBOARDING_PROGRESS,
  ...progress,
});

const addWorkspaceActivity = (workspaceId, activity) => {
  const existing = activityByWorkspace.get(workspaceId) || [];
  activityByWorkspace.set(workspaceId, [activity, ...existing].slice(0, 25));
};

const addGuideActivity = ({ guideId, workspaceId, type, userId = null, metadata = {} }) => {
  const entry = {
    id: uuidv4(),
    guide_id: guideId,
    workspace_id: workspaceId,
    type,
    user_id: userId,
    metadata,
    created_at: new Date().toISOString(),
  };
  const existing = guideActivitiesByGuide.get(guideId) || [];
  guideActivitiesByGuide.set(guideId, [entry, ...existing].slice(0, 60));

  const messageMap = {
    created: 'Guide created',
    opened: 'Guide opened',
    viewed: 'Guide viewed',
    shared: 'Guide shared',
    edited: 'Guide edited',
    published: 'Guide published',
    unpublished: 'Guide unpublished',
    deleted: 'Guide deleted',
    duplicated: 'Guide duplicated',
  };

  addWorkspaceActivity(workspaceId, {
    id: entry.id,
    type: `guide_${type}`,
    text: metadata.title ? `${messageMap[type] || 'Guide updated'}: "${metadata.title}"` : (messageMap[type] || 'Guide updated'),
    guide_id: guideId,
    created_at: entry.created_at,
  });

  return entry;
};

const ensureGuidesStore = (workspaceId) => {
  if (!guidesByWorkspace.has(workspaceId)) guidesByWorkspace.set(workspaceId, []);
  return guidesByWorkspace.get(workspaceId);
};

const safeGuideCard = (guide, owner, workspace) => ({
  id: guide.id,
  title: guide.title,
  description: guide.description || '',
  workspace_id: guide.workspace_id,
  workspace_name: workspace?.name || null,
  owner_user_id: guide.owner_user_id,
  owner_name: owner?.name || owner?.email || 'Unknown',
  status: guide.status,
  total_steps: guide.total_steps,
  views: guide.views,
  thumbnail_url: guide.thumbnail_url || null,
  created_at: guide.created_at,
  updated_at: guide.updated_at,
  share_type: guide.share_type || 'private',
  // Video fields
  video_type: guide.video_type || null,
  video_url: guide.video_url || null,
  embed_url: guide.embed_url || null,
  duration_seconds: guide.duration_seconds || null,
});

const upsertUser = (input) => {
  const email = input.email.toLowerCase().trim();
  const existing = usersByEmail.get(email);
  const isNew = !existing;
  const now = new Date().toISOString();

  const user = {
    id: existing?.id || uuidv4(),
    google_id: input.provider_id || existing?.google_id || null,
    email,
    name: input.name || existing?.name || null,
    avatar_url: input.avatar_url || existing?.avatar_url || null,
    auth_provider: input.auth_provider || existing?.auth_provider || 'email',
    provider_id: input.provider_id || existing?.provider_id || null,
    password_hash: input.password_hash || existing?.password_hash || null,

    status: input.status || existing?.status || 'approved',
    approved_at: input.approved_at || existing?.approved_at || null,
    rejected_at: input.rejected_at || existing?.rejected_at || null,
    rejection_reason: input.rejection_reason || existing?.rejection_reason || null,

    email_verified: input.email_verified === true
      ? true
      : input.email_verified === false
        ? false
        : existing?.email_verified || false,
    verification_token_hash: input.verification_token_hash !== undefined ? input.verification_token_hash : existing?.verification_token_hash || null,
    verification_token_expires_at: input.verification_token_expires_at !== undefined ? input.verification_token_expires_at : existing?.verification_token_expires_at || null,
    verification_sent_at: input.verification_sent_at || existing?.verification_sent_at || null,

    is_onboarded: input.is_onboarded === true
      ? true
      : input.is_onboarded === false
        ? false
        : existing?.is_onboarded ?? false,

    onboarding_progress: getMergedProgress(
      input.onboarding_progress !== undefined ? input.onboarding_progress : existing?.onboarding_progress,
    ),

    team_name: input.team_name || existing?.team_name || null,
    workspace_id: input.workspace_id || existing?.workspace_id || null,

    source_page: input.source_page || existing?.source_page || null,
    cta_clicked: input.cta_clicked || existing?.cta_clicked || null,
    campaign_source: input.campaign_source || existing?.campaign_source || null,
    selected_use_case: input.selected_use_case || existing?.selected_use_case || null,
    selected_team: input.selected_team || existing?.selected_team || null,
    selected_persona: input.selected_persona || existing?.selected_persona || null,
    onboarding_source: input.onboarding_source || existing?.onboarding_source || null,

    created_at: existing?.created_at || now,
    updated_at: now,
  };

  usersByEmail.set(email, user);
  usersById.set(user.id, user);
  return { user, isNew };
};

const patchUser = (id, fields) => {
  const user = usersById.get(id);
  if (!user) return null;
  const updated = {
    ...user,
    ...fields,
    onboarding_progress: getMergedProgress(
      fields.onboarding_progress !== undefined ? fields.onboarding_progress : user.onboarding_progress,
    ),
    updated_at: new Date().toISOString(),
  };
  usersById.set(id, updated);
  usersByEmail.set(updated.email, updated);
  return updated;
};

const markOnboardingProgress = (userId, patch) => {
  const user = usersById.get(userId);
  if (!user) return null;
  return patchUser(userId, {
    onboarding_progress: {
      ...getMergedProgress(user.onboarding_progress),
      ...patch,
    },
  });
};

const createWorkspace = (userId, teamName) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  const workspace = {
    id,
    name: teamName,
    owner_id: userId,
    created_at: now,
    updated_at: now,
  };
  workspaces.set(id, workspace);
  ensureGuidesStore(id);

  patchUser(userId, { workspace_id: id, team_name: teamName });
  markOnboardingProgress(userId, { workspaceCreated: true });
  addWorkspaceActivity(id, {
    id: uuidv4(),
    type: 'workspace_created',
    text: `Workspace "${teamName}" created`,
    guide_id: null,
    created_at: now,
  });

  return workspace;
};

const createGuideRecord = ({
  title,
  description = '',
  workspaceId,
  ownerUserId,
  status = 'draft',
  thumbnailUrl = null,
  source = 'manual',
}) => {
  const now = new Date().toISOString();
  const guide = {
    id: uuidv4(),
    title,
    description,
    workspace_id: workspaceId,
    owner_user_id: ownerUserId,
    status,
    total_steps: 0,
    views: 0,
    thumbnail_url: thumbnailUrl,
    share_type: 'private',
    created_at: now,
    updated_at: now,
    source,
  };

  guidesById.set(guide.id, guide);
  const workspaceGuides = ensureGuidesStore(workspaceId);
  workspaceGuides.unshift(guide.id);
  guideStepsByGuide.set(guide.id, []);
  guideShareByGuide.set(guide.id, {
    id: uuidv4(),
    guide_id: guide.id,
    share_type: 'private',
    share_token: null,
    public_slug: null,
    invited_emails: [],
    created_by: ownerUserId,
    created_at: now,
    updated_at: now,
  });

  addGuideActivity({
    guideId: guide.id,
    workspaceId,
    type: 'created',
    userId: ownerUserId,
    metadata: { title: guide.title },
  });

  markOnboardingProgress(ownerUserId, { createdGuide: true });

  return guide;
};

const upsertGuideSteps = (guideId, steps) => {
  const now = new Date().toISOString();
  const normalized = steps.map((step, index) => ({
    id: step.id || uuidv4(),
    guide_id: guideId,
    step_number: index + 1,
    title: step.title || `Step ${index + 1}`,
    description: step.description || '',
    screenshot_url: step.screenshot_url || step.screenshotUrl || null,
    action_type: step.action_type || step.actionType || 'action',
    metadata_json: step.metadata_json || step.metadataJson || {},
    video_timestamp_seconds: step.video_timestamp_seconds != null ? Number(step.video_timestamp_seconds) : null,
    created_at: step.created_at || now,
  }));
  guideStepsByGuide.set(guideId, normalized);
  const guide = guidesById.get(guideId);
  if (guide) {
    guide.total_steps = normalized.length;
    guide.updated_at = now;
  }
  return normalized;
};

const appendGuideStep = (guideId, step) => {
  const existing = guideStepsByGuide.get(guideId) || [];
  const normalized = {
    id: uuidv4(),
    guide_id: guideId,
    step_number: existing.length + 1,
    title: step.title || `Step ${existing.length + 1}`,
    description: step.description || '',
    screenshot_url: step.screenshot_url || step.screenshotUrl || null,
    action_type: step.action_type || step.actionType || 'action',
    metadata_json: step.metadata_json || step.metadataJson || {},
    video_timestamp_seconds: step.video_timestamp_seconds != null ? Number(step.video_timestamp_seconds) : null,
    created_at: new Date().toISOString(),
  };
  const next = [...existing, normalized];
  guideStepsByGuide.set(guideId, next);
  const guide = guidesById.get(guideId);
  if (guide) {
    guide.total_steps = next.length;
    guide.updated_at = new Date().toISOString();
  }
  return normalized;
};

const createGuide = ({ workspaceId, userId, title, mode = 'manual', isSample = false }) => {
  const guide = createGuideRecord({
    title,
    description: isSample ? 'Sample guide to demonstrate workflow documentation.' : '',
    workspaceId,
    ownerUserId: userId,
    status: isSample ? 'published' : 'draft',
    source: mode,
  });

  const sampleSteps = isSample
    ? [
        {
          title: 'Open the source system',
          description: 'Navigate to the dashboard and open the required module.',
          action_type: 'navigate',
          metadata_json: { path: '/dashboard' },
        },
        {
          title: 'Perform the workflow action',
          description: 'Complete the main action and verify expected response.',
          action_type: 'click',
          metadata_json: { element: 'primary-action' },
        },
        {
          title: 'Validate final output',
          description: 'Confirm the workflow result and save screenshots if needed.',
          action_type: 'validate',
          metadata_json: { check: 'success-message' },
        },
      ]
    : [];

  upsertGuideSteps(guide.id, sampleSteps);
  return guide;
};

const startRecordingSession = ({ workspaceId, userId, title = 'Untitled workflow' }) => {
  const now = new Date().toISOString();
  const session = {
    id: uuidv4(),
    workspace_id: workspaceId,
    user_id: userId,
    title,
    started_at: now,
    updated_at: now,
    steps: [],
  };
  recordingSessionsById.set(session.id, session);
  return session;
};

const appendRecordingStep = ({ sessionId, step }) => {
  const session = recordingSessionsById.get(sessionId);
  if (!session) return null;
  const nextStep = {
    id: uuidv4(),
    step_number: session.steps.length + 1,
    title: step.title || `Step ${session.steps.length + 1}`,
    description: step.description || '',
    screenshot_url: step.screenshot_url || step.screenshotUrl || null,
    action_type: step.action_type || step.actionType || 'action',
    metadata_json: step.metadata_json || step.metadataJson || {},
    created_at: new Date().toISOString(),
  };
  session.steps.push(nextStep);
  session.updated_at = new Date().toISOString();
  return nextStep;
};

const finishRecordingSession = ({ sessionId, title, description = '', thumbnailUrl = null, status = 'draft' }) => {
  const session = recordingSessionsById.get(sessionId);
  if (!session) return null;

  const guide = createGuideRecord({
    title: title || session.title || 'Untitled workflow',
    description,
    workspaceId: session.workspace_id,
    ownerUserId: session.user_id,
    status,
    thumbnailUrl,
    source: 'recording',
  });

  upsertGuideSteps(guide.id, session.steps);
  recordingSessionsById.delete(sessionId);

  return { guide, steps: guideStepsByGuide.get(guide.id) || [] };
};

const getShareSettings = (guideId) => guideShareByGuide.get(guideId) || null;

const shareGuideSettings = ({ guideId, userId, shareType, inviteEmails = [], publish = null }) => {
  const guide = guidesById.get(guideId);
  if (!guide) return null;

  const now = new Date().toISOString();
  const existing = guideShareByGuide.get(guideId) || {
    id: uuidv4(),
    guide_id: guideId,
    created_by: userId,
    created_at: now,
  };

  const nextShareType = shareType || existing.share_type || 'private';
  const next = {
    ...existing,
    share_type: nextShareType,
    invited_emails: inviteEmails,
    share_token: nextShareType === 'workspace' ? uuidv4().replace(/-/g, '') : null,
    public_slug: nextShareType === 'public' ? `g-${uuidv4().slice(0, 8)}` : null,
    updated_at: now,
  };

  guideShareByGuide.set(guideId, next);
  guide.share_type = nextShareType;

  if (publish === true) guide.status = 'published';
  if (publish === false) guide.status = 'draft';
  guide.updated_at = now;

  addGuideActivity({
    guideId,
    workspaceId: guide.workspace_id,
    type: 'shared',
    userId,
    metadata: { title: guide.title, share_type: nextShareType },
  });

  markOnboardingProgress(userId, { sharedGuide: true });

  return { guide, share: next };
};

const getGuideSteps = (guideId) => guideStepsByGuide.get(guideId) || [];

const canUserAccessGuide = ({ user, guide, shareToken = null, publicSlug = null }) => {
  if (!user || !guide) return false;
  if (user.id === guide.owner_user_id) return true;
  const share = guideShareByGuide.get(guide.id);
  if (guide.workspace_id && user.workspace_id === guide.workspace_id && share?.share_type === 'workspace') return true;
  if (share?.share_type === 'public' && guide.status === 'published' && share.public_slug && share.public_slug === publicSlug) return true;
  if (share?.share_type === 'workspace' && share.share_token && share.share_token === shareToken) return true;
  return false;
};

const listGuidesForUser = (user) => {
  if (!user?.workspace_id) return [];
  const ids = guidesByWorkspace.get(user.workspace_id) || [];
  const guides = ids
    .map((id) => guidesById.get(id))
    .filter(Boolean)
    .filter((guide) => canUserAccessGuide({ user, guide }) || guide.owner_user_id === user.id);

  return guides.map((guide) => safeGuideCard(guide, usersById.get(guide.owner_user_id), workspaces.get(guide.workspace_id)));
};

const getGuideForUser = ({ user, guideId, shareToken = null }) => {
  const guide = guidesById.get(guideId);
  if (!guide) return null;
  const canAccess = canUserAccessGuide({ user, guide, shareToken });
  if (!canAccess) return { forbidden: true };

  return {
    guide: safeGuideCard(guide, usersById.get(guide.owner_user_id), workspaces.get(guide.workspace_id)),
    steps: getGuideSteps(guideId),
    share: getShareSettings(guideId),
    activity: guideActivitiesByGuide.get(guideId) || [],
  };
};

const getPublicGuideBySlug = (slug) => {
  for (const [guideId, share] of guideShareByGuide.entries()) {
    if (share.public_slug === slug && share.share_type === 'public') {
      const guide = guidesById.get(guideId);
      if (!guide || guide.status !== 'published') return null;
      return {
        guide: safeGuideCard(guide, usersById.get(guide.owner_user_id), workspaces.get(guide.workspace_id)),
        steps: getGuideSteps(guideId),
        share,
      };
    }
  }
  return null;
};

const updateGuide = ({ guideId, userId, patch }) => {
  const guide = guidesById.get(guideId);
  if (!guide) return null;
  if (guide.owner_user_id !== userId) return { forbidden: true };

  if (typeof patch.title === 'string') guide.title = patch.title;
  if (typeof patch.description === 'string') guide.description = patch.description;
  if (patch.status === 'draft' || patch.status === 'published') guide.status = patch.status;
  if (typeof patch.thumbnail_url === 'string' || patch.thumbnail_url === null) guide.thumbnail_url = patch.thumbnail_url;
  // Video fields
  if (patch.video_type !== undefined) guide.video_type = patch.video_type;
  if (patch.video_url !== undefined) guide.video_url = patch.video_url;
  if (patch.embed_url !== undefined) guide.embed_url = patch.embed_url;
  if (patch.duration_seconds !== undefined) guide.duration_seconds = patch.duration_seconds;
  guide.updated_at = new Date().toISOString();

  addGuideActivity({
    guideId,
    workspaceId: guide.workspace_id,
    type: patch.status ? 'published' : 'edited',
    userId,
    metadata: { title: guide.title },
  });

  return guide;
};

const deleteGuide = ({ guideId, userId }) => {
  const guide = guidesById.get(guideId);
  if (!guide) return null;
  if (guide.owner_user_id !== userId) return { forbidden: true };

  const workspaceGuides = guidesByWorkspace.get(guide.workspace_id) || [];
  guidesByWorkspace.set(guide.workspace_id, workspaceGuides.filter((id) => id !== guideId));
  guidesById.delete(guideId);
  guideStepsByGuide.delete(guideId);
  guideShareByGuide.delete(guideId);

  addGuideActivity({
    guideId,
    workspaceId: guide.workspace_id,
    type: 'deleted',
    userId,
    metadata: { title: guide.title },
  });

  return { success: true };
};

const duplicateGuide = ({ guideId, userId }) => {
  const guide = guidesById.get(guideId);
  if (!guide) return null;

  const copy = createGuideRecord({
    title: `${guide.title} (Copy)`,
    description: guide.description,
    workspaceId: guide.workspace_id,
    ownerUserId: userId,
    status: 'draft',
    thumbnailUrl: guide.thumbnail_url,
    source: 'manual',
  });

  const originalSteps = getGuideSteps(guideId);
  upsertGuideSteps(copy.id, originalSteps);

  addGuideActivity({
    guideId: copy.id,
    workspaceId: copy.workspace_id,
    type: 'duplicated',
    userId,
    metadata: { title: copy.title },
  });

  return copy;
};

const updateGuideStep = (guideId, stepId, userId, patch) => {
  const guide = guidesById.get(guideId);
  if (!guide) return null;
  if (guide.owner_user_id !== userId) return { forbidden: true };

  const steps = guideStepsByGuide.get(guideId) || [];
  const idx = steps.findIndex((s) => s.id === stepId);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  steps[idx] = {
    ...steps[idx],
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.screenshot_url !== undefined ? { screenshot_url: patch.screenshot_url } : {}),
    ...(patch.video_timestamp_seconds !== undefined ? { video_timestamp_seconds: patch.video_timestamp_seconds != null ? Number(patch.video_timestamp_seconds) : null } : {}),
    updated_at: now,
  };
  guideStepsByGuide.set(guideId, steps);
  guide.updated_at = now;
  return steps[idx];
};

const deleteGuideStep = (guideId, stepId, userId) => {
  const guide = guidesById.get(guideId);
  if (!guide) return null;
  if (guide.owner_user_id !== userId) return { forbidden: true };

  const steps = guideStepsByGuide.get(guideId) || [];
  const filtered = steps.filter((s) => s.id !== stepId);
  if (filtered.length === steps.length) return null;

  filtered.forEach((s, i) => { s.step_number = i + 1; });
  guideStepsByGuide.set(guideId, filtered);
  guide.total_steps = filtered.length;
  guide.updated_at = new Date().toISOString();

  addGuideActivity({ guideId, workspaceId: guide.workspace_id, type: 'edited', userId, metadata: { title: guide.title } });
  return { success: true };
};

const startGuideRecording = (guideId, userId) => {
  const guide = guidesById.get(guideId);
  if (!guide) return null;

  const now = new Date().toISOString();
  const session = { id: uuidv4(), guide_id: guideId, user_id: userId, started_at: now };
  recordingSessionsById.set(session.id, session);
  return session;
};

const finishGuideRecording = (sessionId, guideId, userId) => {
  const session = recordingSessionsById.get(sessionId);
  if (session) recordingSessionsById.delete(sessionId);

  const guide = guidesById.get(guideId);
  if (!guide) return null;

  addGuideActivity({ guideId, workspaceId: guide.workspace_id, type: 'edited', userId, metadata: { title: guide.title } });
  return guide;
};

// ─── Workspace Members ────────────────────────────────────────────────────────

const ROLES = ['admin', 'editor', 'viewer'];

const ensureMemberMap = (workspaceId) => {
  if (!workspaceMembers.has(workspaceId)) workspaceMembers.set(workspaceId, new Map());
  return workspaceMembers.get(workspaceId);
};

const ensureInviteList = (workspaceId) => {
  if (!pendingInvites.has(workspaceId)) pendingInvites.set(workspaceId, []);
  return pendingInvites.get(workspaceId);
};

// Called internally when a user joins a workspace so their record appears in the member list.
const registerWorkspaceMember = (workspaceId, userId, role = 'editor') => {
  const map = ensureMemberMap(workspaceId);
  if (map.has(userId)) return map.get(userId); // already registered
  const workspace = workspaces.get(workspaceId);
  const isOwner = workspace?.owner_id === userId;
  const record = {
    id: uuidv4(),
    workspace_id: workspaceId,
    user_id: userId,
    role: isOwner ? 'admin' : role,
    joined_at: new Date().toISOString(),
  };
  map.set(userId, record);
  return record;
};

// Ensure workspace owner is always in the member map.
const ensureOwnerMember = (workspaceId) => {
  const workspace = workspaces.get(workspaceId);
  if (workspace) registerWorkspaceMember(workspaceId, workspace.owner_id, 'admin');
};

// Also register every existing user in their workspace at bootstrap time.
// We call this lazily from getWorkspaceMembers so no migration needed.
const getWorkspaceMembers = (workspaceId) => {
  ensureOwnerMember(workspaceId);
  // Register any other users that share this workspace (may have joined via another path).
  for (const user of usersById.values()) {
    if (user.workspace_id === workspaceId) {
      registerWorkspaceMember(workspaceId, user.id);
    }
  }
  const map = ensureMemberMap(workspaceId);
  return Array.from(map.values()).map((m) => {
    const u = usersById.get(m.user_id);
    return {
      id: m.id,
      user_id: m.user_id,
      workspace_id: m.workspace_id,
      role: m.role,
      joined_at: m.joined_at,
      name: u?.name || u?.email || 'Unknown',
      email: u?.email || '',
      avatar_url: u?.avatar_url || null,
    };
  });
};

const getMemberRole = (workspaceId, userId) => {
  ensureOwnerMember(workspaceId);
  const map = ensureMemberMap(workspaceId);
  return map.get(userId)?.role || null;
};

const updateMemberRole = (workspaceId, targetUserId, newRole, actingUserId) => {
  if (!ROLES.includes(newRole)) return { error: 'Invalid role' };
  const actorRole = getMemberRole(workspaceId, actingUserId);
  if (actorRole !== 'admin') return { forbidden: true };
  const workspace = workspaces.get(workspaceId);
  if (workspace?.owner_id === targetUserId) return { error: 'Cannot change owner role' };
  const map = ensureMemberMap(workspaceId);
  const member = map.get(targetUserId);
  if (!member) return null;
  member.role = newRole;
  return member;
};

const removeMember = (workspaceId, targetUserId, actingUserId) => {
  const actorRole = getMemberRole(workspaceId, actingUserId);
  if (actorRole !== 'admin') return { forbidden: true };
  const workspace = workspaces.get(workspaceId);
  if (workspace?.owner_id === targetUserId) return { error: 'Cannot remove workspace owner' };
  const map = ensureMemberMap(workspaceId);
  if (!map.has(targetUserId)) return null;
  map.delete(targetUserId);
  // Also detach user from workspace
  const user = usersById.get(targetUserId);
  if (user) patchUser(targetUserId, { workspace_id: null, team_name: null });
  return { success: true };
};

const inviteMember = (workspaceId, email, role, invitedByUserId) => {
  const actorRole = getMemberRole(workspaceId, invitedByUserId);
  if (actorRole !== 'admin') return { forbidden: true };
  if (!ROLES.includes(role)) return { error: 'Invalid role' };

  const list = ensureInviteList(workspaceId);
  const existing = list.find((i) => i.email === email.toLowerCase());
  if (existing) return { error: 'Already invited' };

  // If the user already exists in the system, join them immediately.
  const existingUser = usersByEmail.get(email.toLowerCase());
  if (existingUser) {
    if (existingUser.workspace_id === workspaceId) return { error: 'Already a member' };
    patchUser(existingUser.id, { workspace_id: workspaceId });
    registerWorkspaceMember(workspaceId, existingUser.id, role);
    markOnboardingProgress(invitedByUserId, { invitedTeam: true });
    addWorkspaceActivity(workspaceId, {
      id: uuidv4(),
      type: 'member_joined',
      text: `${existingUser.name || existingUser.email} joined the workspace`,
      guide_id: null,
      created_at: new Date().toISOString(),
    });
    return { joined: true, member: getWorkspaceMembers(workspaceId).find((m) => m.user_id === existingUser.id) };
  }

  // Otherwise add to pending invites list.
  const invite = {
    id: uuidv4(),
    workspace_id: workspaceId,
    email: email.toLowerCase(),
    role,
    invited_by: invitedByUserId,
    invited_at: new Date().toISOString(),
  };
  list.push(invite);
  markOnboardingProgress(invitedByUserId, { invitedTeam: true });
  return { pending: true, invite };
};

const getPendingInvites = (workspaceId) => ensureInviteList(workspaceId);

const getWorkspaceGuides = (workspaceId) => {
  const ids = guidesByWorkspace.get(workspaceId) || [];
  return ids
    .map((id) => guidesById.get(id))
    .filter(Boolean)
    .map((guide) => ({
      ...safeGuideCard(guide, usersById.get(guide.owner_user_id), workspaces.get(guide.workspace_id)),
      share_type: guide.share_type || 'private',
    }))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
};

const getWorkspaceActivity = (workspaceId, limit = 30) => {
  return (activityByWorkspace.get(workspaceId) || []).slice(0, limit);
};

// ─── Favorites ────────────────────────────────────────────────────────────────

const getUserFavorites = (userId) => {
  if (!favoritesByUser.has(userId)) favoritesByUser.set(userId, new Set());
  return favoritesByUser.get(userId);
};

const addFavorite = (userId, guideId) => {
  const guide = guidesById.get(guideId);
  if (!guide) return null;
  const favs = getUserFavorites(userId);
  favs.add(guideId);
  return true;
};

const removeFavorite = (userId, guideId) => {
  const favs = getUserFavorites(userId);
  favs.delete(guideId);
  return true;
};

const isFavorite = (userId, guideId) => {
  const favs = getUserFavorites(userId);
  return favs.has(guideId);
};

const getFavoriteGuides = (user) => {
  const favs = getUserFavorites(user.id);
  const results = [];
  for (const guideId of favs) {
    const guide = guidesById.get(guideId);
    if (!guide) continue;
    const canAccess = canUserAccessGuide({ user, guide });
    if (!canAccess) continue;
    const owner = usersById.get(guide.owner_user_id);
    const workspace = workspaces.get(guide.workspace_id);
    results.push({
      ...safeGuideCard(guide, owner, workspace),
      is_favorite: true,
    });
  }
  return results.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
};

const incrementGuideView = ({ guideId, userId = null }) => {
  const guide = guidesById.get(guideId);
  if (!guide) return null;
  guide.views += 1;
  guide.updated_at = new Date().toISOString();
  addGuideActivity({
    guideId,
    workspaceId: guide.workspace_id,
    type: userId ? 'opened' : 'viewed',
    userId,
    metadata: { title: guide.title },
  });
  return guide.views;
};

const getDashboardBootstrap = (userId) => {
  const user = usersById.get(userId);
  if (!user) return null;

  const workspace = user.workspace_id ? workspaces.get(user.workspace_id) || null : null;
  const guides = listGuidesForUser(user);
  const progress = getMergedProgress(user.onboarding_progress);
  const completedCount = Object.values(progress).filter(Boolean).length;
  const total = Object.keys(DEFAULT_ONBOARDING_PROGRESS).length;

  const teamMembers = user.workspace_id
    ? Array.from(usersById.values()).filter((u) => u.workspace_id === user.workspace_id).length || 1
    : 1;

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const guideIds = user.workspace_id ? (guidesByWorkspace.get(user.workspace_id) || []) : [];
  const guidesCreatedThisMonth = guideIds
    .map((id) => guidesById.get(id))
    .filter(Boolean)
    .filter((guide) => new Date(guide.created_at).getTime() >= thisMonthStart.getTime()).length;

  return {
    user,
    workspace,
    guides,
    checklist: {
      progress,
      completedCount,
      total,
      percent: Math.round((completedCount / total) * 100),
      items: [
        { key: 'workspaceCreated', label: 'Create workspace', completed: progress.workspaceCreated, action: 'create_workspace' },
        { key: 'invitedTeam', label: 'Invite teammates', completed: progress.invitedTeam, action: 'invite_teammates' },
        { key: 'installedExtension', label: 'Install extension', completed: progress.installedExtension, action: 'install_extension' },
        { key: 'createdGuide', label: 'Create first guide', completed: progress.createdGuide, action: 'create_guide' },
        { key: 'sharedGuide', label: 'Share your first guide', completed: progress.sharedGuide, action: 'share_guide' },
      ],
    },
    stats: {
      guidesCreated: guidesCreatedThisMonth,
      totalViews: guides.reduce((sum, g) => sum + g.views, 0),
      teamMembers,
    },
    recentActivity: workspace ? (activityByWorkspace.get(workspace.id) || []) : [],
  };
};

const getRecentData = (userId) => {
  const user = usersById.get(userId);
  if (!user) return null;

  const workspace = user.workspace_id ? workspaces.get(user.workspace_id) || null : null;
  if (!workspace) return { recentGuides: [], recentActivity: [] };

  // Get all guides in workspace
  const guideIds = guidesByWorkspace.get(workspace.id) || [];
  const allGuides = guideIds
    .map((id) => guidesById.get(id))
    .filter(Boolean)
    .filter((guide) => canUserAccessGuide({ user, guide }) || guide.owner_user_id === user.id);

  // Sort by updated_at, get top 12
  const recentGuides = allGuides
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 12)
    .map((guide) => ({
      id: guide.id,
      title: guide.title,
      totalSteps: guide.total_steps,
      updatedAt: guide.updated_at,
      lastOpenedAt: guide.updated_at, // In MVP, we'll use updated_at as proxy for last opened
      workspaceName: workspace.name,
      status: guide.status,
      views: guide.views,
      owner: usersById.get(guide.owner_user_id)?.name || 'Unknown',
    }));

  // Get recent activity for the workspace, limited to 20 items
  const recentActivity = (activityByWorkspace.get(workspace.id) || [])
    .slice(0, 20)
    .map((activity) => ({
      id: activity.id,
      type: activity.type.replace('guide_', ''), // e.g., 'guide_viewed' -> 'viewed'
      guideId: activity.guide_id,
      guideTitle: activity.guide_id ? guidesById.get(activity.guide_id)?.title || 'Unknown' : null,
      action: activity.text, // e.g., "Guide opened: Customer Onboarding"
      createdAt: activity.created_at,
    }));

  return { recentGuides, recentActivity };
};

module.exports = {
  usersByEmail,
  usersById,
  workspaces,
  guidesById,
  guidesByWorkspace,
  guideStepsByGuide,
  guideShareByGuide,
  guideActivitiesByGuide,
  recordingSessionsById,
  activityByWorkspace,
  onboardingEvents,
  salesInquiries,
  demoRequests,
  authSessions,
  USER_STATUSES,
  DEFAULT_ONBOARDING_PROGRESS,
  upsertUser,
  patchUser,
  markOnboardingProgress,
  createWorkspace,
  createGuide,
  createGuideRecord,
  upsertGuideSteps,
  appendGuideStep,
  startRecordingSession,
  appendRecordingStep,
  finishRecordingSession,
  shareGuideSettings,
  getShareSettings,
  canUserAccessGuide,
  listGuidesForUser,
  getGuideForUser,
  getPublicGuideBySlug,
  updateGuide,
  deleteGuide,
  duplicateGuide,
  incrementGuideView,
  updateGuideStep,
  deleteGuideStep,
  startGuideRecording,
  finishGuideRecording,
  getDashboardBootstrap,
  getRecentData,
  addFavorite,
  removeFavorite,
  isFavorite,
  getFavoriteGuides,
  getWorkspaceMembers,
  getMemberRole,
  updateMemberRole,
  removeMember,
  inviteMember,
  getPendingInvites,
  getWorkspaceGuides,
  getWorkspaceActivity,
  registerWorkspaceMember,
  addGuideActivity,
};
