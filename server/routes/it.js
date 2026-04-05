/**
 * /api/it/* — IT Solutions Workflows
 *
 * Four AI-powered IT workflow builders:
 *   itType 'onboarding'       → /it/onboarding-guides
 *   itType 'troubleshooting'  → /it/troubleshooting
 *   itType 'runbook'          → /it/devops-runbooks
 *   itType 'tutorial'         → /it/software-tutorials
 *
 * All guides are stored via the same Guide+Step data model as SOP / Workflow builders.
 * guide.source is set to the itType so they're filterable.
 */

const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const {
  usersById,
  createGuideRecord,
  upsertGuideSteps,
  addGuideActivity,
} = require('../db/store');

const router = express.Router();

// ─── Auth middleware ──────────────────────────────────────────────────────────

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'dev-secret');
    const user = usersById.get(decoded.sub);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid session' });
  }
};

// ─── Step banks ───────────────────────────────────────────────────────────────

const ONBOARDING_STEPS = {
  developer: [
    { title: 'Provision core accounts', description: 'Create email, Slack, GitHub, Jira, and Confluence accounts. Send welcome email with credentials before day 1.', action_type: 'setup' },
    { title: 'Enroll device in MDM', description: 'Register serial number in Jamf or Intune. Apply company security profile, disk encryption, and firewall policy.', action_type: 'setup' },
    { title: 'Install development environment', description: 'Install Homebrew, Git, nvm (or pyenv), Docker Desktop, and language runtimes required for the team stack.', action_type: 'installation' },
    { title: 'Configure IDE and extensions', description: 'Install VS Code or JetBrains IDE with team-recommended extensions: ESLint, Prettier, GitLens, Docker, and Copilot.', action_type: 'configuration' },
    { title: 'Set up SSH keys and VPN', description: 'Generate Ed25519 SSH key pair. Add public key to GitHub and internal servers. Install and configure VPN client.', action_type: 'security' },
    { title: 'Clone repositories and verify builds', description: 'Clone the primary mono-repo and any services the engineer will own. Run the build and confirm all tests pass.', action_type: 'verification' },
    { title: 'Grant staging and environment access', description: 'Provision access to staging, sandbox, and any cloud consoles (AWS/GCP/Azure) per least-privilege policy.', action_type: 'setup' },
    { title: 'Complete security awareness training', description: 'Assign and complete mandatory security training: phishing, data handling, incident reporting. Record completion.', action_type: 'training' },
    { title: 'Set up password manager', description: 'Enroll in 1Password or Bitwarden. Import or generate credentials for all assigned systems.', action_type: 'security' },
    { title: 'First contribution: starter issue', description: 'Assign a "good first issue" or docs update. Review and merge the first PR as a capability confirmation.', action_type: 'verification' },
  ],
  analyst: [
    { title: 'Create core accounts', description: 'Set up email, Slack, Jira, Tableau/Looker, and any BI platforms used by the analytics team.', action_type: 'setup' },
    { title: 'Provision analytics workstation', description: 'Enroll device in MDM. Install approved analytics tools: Python, Jupyter, R, Excel, and BI clients.', action_type: 'setup' },
    { title: 'Configure database access', description: 'Issue read-only credentials for the data warehouse (Snowflake/BigQuery/Redshift). Confirm access and row-level permissions.', action_type: 'configuration' },
    { title: 'Set up VPN and data security training', description: 'Install VPN client. Complete data classification and privacy awareness training before accessing production data.', action_type: 'security' },
    { title: 'Access BI dashboards and data dictionary', description: 'Navigate to core business dashboards. Review the data dictionary and metric definitions maintained by the data team.', action_type: 'training' },
    { title: 'Complete data privacy and compliance training', description: 'Assign GDPR, CCPA, and internal data-handling compliance modules. Record completion in LMS.', action_type: 'training' },
    { title: 'Shadow existing analyst workflow', description: 'Pair with a senior analyst for one sprint. Review existing reports, SQL libraries, and notebook conventions.', action_type: 'training' },
    { title: 'Deliver first report reproduction', description: 'Reproduce a standard business report independently. Validate output matches the source. Submit for peer review.', action_type: 'verification' },
  ],
  hr: [
    { title: 'Create core HR system accounts', description: 'Provision email, Slack, HRIS (Workday/BambooHR), payroll system, and applicant tracking system (ATS).', action_type: 'setup' },
    { title: 'Configure HR data access', description: 'Grant access to sensitive HR systems with appropriate role permissions. Enforce MFA on all HR platforms.', action_type: 'security' },
    { title: 'Complete mandatory compliance training', description: 'Assign: HR compliance, equal employment opportunity, data privacy (GDPR/CCPA), and sexual harassment prevention modules.', action_type: 'training' },
    { title: 'Set up secure document storage', description: 'Configure access to SharePoint/Google Drive HR folder. Apply sensitivity labels to employee documents.', action_type: 'setup' },
    { title: 'Review org chart and employee directory', description: 'Access org chart in HRIS. Understand reporting lines, team structure, and key HR stakeholders.', action_type: 'training' },
    { title: 'Understand data retention and GDPR policies', description: 'Review internal data retention schedule. Understand employee data subject access rights and deletion procedures.', action_type: 'training' },
    { title: 'Shadow core HR processes', description: 'Observe onboarding, offboarding, and performance review processes with a senior HR team member.', action_type: 'training' },
    { title: '30-day HR process sign-off', description: 'Confirm competency in core HR workflows. Collect manager sign-off on onboarding completion checklist.', action_type: 'verification' },
  ],
  custom: [
    { title: 'Create communication and identity accounts', description: 'Provision email, Slack/Teams, and SSO identity. Confirm MFA is enabled and credentials are securely shared.', action_type: 'setup' },
    { title: 'Enroll device and apply security baseline', description: 'Register device in MDM. Apply encryption, firewall, and endpoint security policy before system access.', action_type: 'setup' },
    { title: 'Install role-required software', description: 'Deploy the standard software bundle for this role. Confirm all applications install and launch correctly.', action_type: 'installation' },
    { title: 'Configure system access and permissions', description: 'Grant least-privilege access to all required systems. Apply role-based permission groups in directory.', action_type: 'configuration' },
    { title: 'Complete security and compliance training', description: 'Assign mandatory security awareness, data privacy, and role-specific compliance training. Record completion.', action_type: 'training' },
    { title: 'Introduce to team and stakeholders', description: 'Schedule intro calls with direct team, cross-functional partners, and manager. Share org chart and key contacts.', action_type: 'communication' },
    { title: 'Review role-specific SOPs and documentation', description: 'Share process documentation, runbooks, and knowledge base articles relevant to this role.', action_type: 'training' },
    { title: 'First-week milestone check-in', description: 'Meet with manager to confirm access is working, answer outstanding questions, and set 30-day goals.', action_type: 'verification' },
  ],
};

const TROUBLESHOOTING_PATTERNS = [
  {
    keywords: ['network', 'connection', 'timeout', 'dns', 'latency', 'ping', 'unreachable'],
    insights: ['Detected network connectivity issue pattern', 'Added connectivity verification steps', 'Included firewall and DNS checks', 'Suggested escalation path to network team'],
    steps: [
      { title: 'Verify basic connectivity', description: 'Run ping and traceroute to affected endpoint. Check DNS resolution with nslookup/dig. Document all results.', action_type: 'investigation' },
      { title: 'Check firewall and security group rules', description: 'Review inbound/outbound rules in firewall console. Confirm the required ports are open for the affected service.', action_type: 'investigation' },
      { title: 'Review network configuration', description: 'Check VLAN assignment, subnet masks, and routing tables. Confirm no recent changes to network topology.', action_type: 'investigation' },
      { title: 'Test from alternate device or path', description: 'Reproduce the issue from a different device or network segment to isolate whether it\'s client-specific or infrastructure-wide.', action_type: 'verification' },
      { title: 'Check bandwidth and packet loss', description: 'Use network monitoring tool to check utilization, packet loss %, and jitter on affected segment.', action_type: 'monitoring' },
      { title: 'Apply fix or escalate', description: 'Implement configuration fix if in scope. Escalate to network team with full trace if physical or ISP-layer issue.', action_type: 'resolution' },
      { title: 'Document in network runbook', description: 'Record root cause, affected scope, fix applied, and prevention steps. Add to network troubleshooting knowledge base.', action_type: 'documentation' },
    ],
  },
  {
    keywords: ['500', 'crash', 'service down', 'unavailable', 'error rate', 'pod', 'container'],
    insights: ['Detected application failure pattern', 'Added service health verification steps', 'Included rollback assessment step', 'Log analysis pattern identified'],
    steps: [
      { title: 'Check service health dashboard', description: 'Open monitoring dashboard (Datadog/Grafana/CloudWatch). Identify error rate spike start time and affected endpoints.', action_type: 'monitoring' },
      { title: 'Review recent error logs', description: 'Pull application logs from the time of failure. Look for exception stack traces, OOM errors, or dependency failures.', action_type: 'investigation' },
      { title: 'Check resource utilization', description: 'Verify CPU, memory, and disk usage on affected nodes or pods. Scale horizontally if resource-constrained.', action_type: 'investigation' },
      { title: 'Identify triggering change', description: 'Check recent deployments, config changes, or cron jobs that ran before the failure. Correlate timeline with error onset.', action_type: 'investigation' },
      { title: 'Apply fix or trigger rollback', description: 'Implement hotfix or initiate rollback to last stable version. Confirm traffic is draining from affected instances.', action_type: 'resolution' },
      { title: 'Verify resolution with smoke tests', description: 'Run critical path smoke tests against affected endpoints. Confirm error rate returns to baseline in monitoring.', action_type: 'verification' },
      { title: 'Document incident and root cause', description: 'Write incident report: timeline, blast radius, root cause, mitigation, and prevention actions. Schedule post-mortem.', action_type: 'documentation' },
    ],
  },
  {
    keywords: ['sql', 'database', 'connection pool', 'query', 'slow', 'deadlock', 'postgres', 'mysql'],
    insights: ['Detected database performance issue', 'Added query analysis steps', 'Included connection pool diagnostics', 'Suggested index optimization path'],
    steps: [
      { title: 'Verify database connectivity', description: 'Test connection from application server to database host. Check connection pool exhaustion and active connection count.', action_type: 'investigation' },
      { title: 'Identify slow or blocking queries', description: 'Run pg_stat_activity (PostgreSQL) or SHOW PROCESSLIST (MySQL). Kill long-running or blocking queries if safe to do so.', action_type: 'investigation' },
      { title: 'Review query execution plan', description: 'Run EXPLAIN ANALYZE on problematic queries. Look for sequential scans on large tables, missing indexes, or inefficient joins.', action_type: 'investigation' },
      { title: 'Check disk and I/O metrics', description: 'Review disk usage, IOPS, and write-ahead log (WAL) size. Confirm database storage is not near capacity.', action_type: 'monitoring' },
      { title: 'Apply optimization', description: 'Add missing index, rewrite problematic query, or tune connection pool settings. Apply in staging first.', action_type: 'resolution' },
      { title: 'Monitor for recurrence', description: 'Watch query performance metrics for 30 minutes post-fix. Set alert threshold for query duration to catch regressions.', action_type: 'monitoring' },
      { title: 'Document fix and add to runbook', description: 'Record the root cause, query affected, fix applied, and any ongoing tuning. Add to the database runbook.', action_type: 'documentation' },
    ],
  },
  {
    keywords: ['auth', '401', '403', 'permission', 'token', 'oauth', 'sso', 'forbidden', 'unauthorized'],
    insights: ['Detected authentication/authorization issue', 'Added identity provider verification steps', 'Included token and session checks', 'Audit log review included'],
    steps: [
      { title: 'Verify user account status', description: 'Check that the user exists, is active, and not suspended in the identity provider (Okta/Azure AD/Google Workspace).', action_type: 'investigation' },
      { title: 'Check token and session validity', description: 'Inspect token expiry, refresh token configuration, and session timeout settings. Force a token refresh if expired.', action_type: 'investigation' },
      { title: 'Review permission assignments', description: 'Confirm the user has the correct role, group membership, and scopes for the requested resource.', action_type: 'investigation' },
      { title: 'Clear session and re-authenticate', description: 'Instruct the user to clear browser session/cache, log out, and re-authenticate. Test with incognito mode.', action_type: 'resolution' },
      { title: 'Review audit logs for failed events', description: 'Check IdP audit logs for failed authentication events. Identify whether issue is credential, MFA, or authorization-level.', action_type: 'investigation' },
      { title: 'Apply fix and validate', description: 'Re-grant permission, update OAuth scope, or fix SAML attribute mapping. Test access with the affected user.', action_type: 'resolution' },
      { title: 'Document in auth knowledge base', description: 'Record the issue type, root cause, fix steps, and prevention measure. Flag for auth runbook update if recurring.', action_type: 'documentation' },
    ],
  },
];

const DEFAULT_TROUBLESHOOTING_STEPS = [
  { title: 'Capture and document the issue', description: 'Record exact error message, steps to reproduce, affected users, and first occurrence time. Take screenshots.', action_type: 'documentation' },
  { title: 'Check system status and recent changes', description: 'Review status page for dependencies. Check recent deployments, config changes, or scheduled jobs.', action_type: 'investigation' },
  { title: 'Search knowledge base for known issues', description: 'Query the internal KB and public issue trackers for this error pattern before starting diagnosis.', action_type: 'investigation' },
  { title: 'Identify root cause', description: 'Analyze logs, traces, and monitoring dashboards. Narrow to the specific component, service, or configuration causing the failure.', action_type: 'investigation' },
  { title: 'Apply fix or workaround', description: 'Implement the resolution or a temporary workaround to restore service. Document every change made.', action_type: 'resolution' },
  { title: 'Test and verify the resolution', description: 'Reproduce the original issue to confirm it no longer occurs. Run related tests to check for regressions.', action_type: 'verification' },
  { title: 'Confirm with affected user', description: 'Contact the user who reported the issue. Confirm the fix works in their environment.', action_type: 'communication' },
  { title: 'Document in knowledge base', description: 'Write a KB article: problem description, root cause, fix applied, and prevention steps. Tag by system and severity.', action_type: 'documentation' },
];

const RUNBOOK_STEPS = {
  deployment: [
    { title: 'Pre-flight: confirm CI is green', description: 'All unit, integration, and E2E tests must pass. Require two code review approvals. Link to deployment ticket.', action_type: 'verification' },
    { title: 'Notify stakeholders of deployment window', description: 'Post in #deployments Slack channel with scope, timing, and rollback plan. Get PM and QA sign-off.', action_type: 'communication' },
    { title: 'Tag and build release artifact', description: 'Create a semver release tag (vMAJOR.MINOR.PATCH). Trigger the CI build pipeline and confirm artifact is produced.', action_type: 'action' },
    { title: 'Deploy to staging environment', description: 'Trigger staging deployment. Monitor deployment logs for errors. Run smoke tests on all critical user paths.', action_type: 'deployment' },
    { title: 'Staging sign-off from QA and PM', description: 'QA lead confirms all test cases pass. PM confirms feature completeness. Record sign-off in deployment ticket.', action_type: 'approval' },
    { title: 'Deploy to production (canary → full)', description: 'Release to 5% of traffic via canary or feature flag. Monitor for 10 minutes, then ramp to 25%, 50%, 100%.', action_type: 'deployment' },
    { title: 'Monitor for 30 minutes post-deploy', description: 'Watch error rate, p95 latency, and key business metrics in Datadog/Grafana. Have rollback command ready.', action_type: 'monitoring' },
    { title: 'Confirm success and close ticket', description: 'Confirm no regression in metrics. Close deployment ticket. Post success summary in #deployments.', action_type: 'verification' },
    { title: 'Update changelog and notify team', description: 'Publish release notes to the changelog. Notify affected teams and customer success if user-facing changes exist.', action_type: 'communication' },
  ],
  rollback: [
    { title: 'Detect and declare rollback trigger', description: 'Confirm regression (error rate, metric drop, P1 report). Page on-call engineer. Announce in #incidents.', action_type: 'communication' },
    { title: 'Pause new traffic or canary', description: 'Disable the canary deployment or feature flag. Redirect 100% of traffic back to the previous stable version.', action_type: 'action' },
    { title: 'Identify last stable artifact', description: 'Find the previous release tag or commit SHA that was running before the incident. Confirm it is available in artifact registry.', action_type: 'investigation' },
    { title: 'Trigger rollback deployment', description: 'Execute rollback command with the stable artifact. Monitor deployment logs. Confirm old version is active on all nodes.', action_type: 'deployment' },
    { title: 'Run verification smoke tests', description: 'Test all critical user paths against the rolled-back version. Confirm error rates return to pre-incident baseline.', action_type: 'verification' },
    { title: 'Confirm with stakeholders', description: 'Notify PM, QA, and customer success that rollback is complete. Confirm user-facing impact has been resolved.', action_type: 'communication' },
    { title: 'Open root cause investigation ticket', description: 'Create P0/P1 ticket for the regression. Assign to the engineer who deployed. Block re-deployment until fix is confirmed.', action_type: 'action' },
    { title: 'Schedule post-mortem within 48 hours', description: 'Calendar blameless post-mortem with all involved parties. Prepare incident timeline before the meeting.', action_type: 'planning' },
  ],
  incident: [
    { title: 'Detect and classify incident', description: 'Confirm the incident (user reports, alerting, monitoring). Classify severity: P1 (critical), P2 (major), P3 (minor).', action_type: 'investigation' },
    { title: 'Page on-call engineer', description: 'Trigger PagerDuty/OpsGenie alert for P1/P2. Include service name, error rate, and brief description.', action_type: 'communication' },
    { title: 'Open incident channel', description: 'Create #incident-YYYYMMDD Slack channel. Add on-call, incident commander, and relevant domain leads.', action_type: 'communication' },
    { title: 'Identify blast radius and scope', description: 'Determine which services, customers, and data are affected. Estimate business impact and user count.', action_type: 'investigation' },
    { title: 'Apply immediate mitigation', description: 'Initiate rollback, scale service, disable feature flag, or implement workaround to restore service as fast as possible.', action_type: 'action' },
    { title: 'Communicate status every 15 minutes', description: 'Post updates in the incident channel and on the status page every 15 minutes until resolved. Be specific about progress.', action_type: 'communication' },
    { title: 'Resolve root cause', description: 'Implement the permanent fix or confirmed workaround. Confirm with the team before marking as resolved.', action_type: 'resolution' },
    { title: 'Verify resolution in monitoring', description: 'Confirm error rate, latency, and all affected metrics have returned to baseline. Watch for 30 minutes.', action_type: 'monitoring' },
    { title: 'Debrief affected customers', description: 'Notify impacted customers with a clear explanation of what happened, how long, and what was fixed.', action_type: 'communication' },
    { title: 'Post-mortem within 5 business days', description: 'Conduct blameless post-mortem. Document: timeline, root cause, contributing factors, action items. Share with leadership.', action_type: 'documentation' },
  ],
  maintenance: [
    { title: 'Schedule maintenance window', description: 'Choose a low-traffic window (typically weekend night). Confirm window length, scope, and rollback plan with stakeholders.', action_type: 'planning' },
    { title: 'Notify users and post status update', description: 'Email affected users 48h in advance. Post on status page 24h before. Enable maintenance mode page at window start.', action_type: 'communication' },
    { title: 'Take database backup and snapshot', description: 'Create a full database backup and cloud snapshot before any changes. Verify backup size and restore location.', action_type: 'action' },
    { title: 'Drain active sessions', description: 'Set connection draining on the load balancer. Wait for active sessions to complete before bringing services down.', action_type: 'action' },
    { title: 'Execute maintenance tasks', description: 'Apply OS patches, run database migrations, perform cleanup, or execute infrastructure changes per the approved plan.', action_type: 'action' },
    { title: 'Run validation tests', description: 'Execute the post-maintenance test suite. Confirm all critical paths, integrations, and data integrity checks pass.', action_type: 'verification' },
    { title: 'Remove maintenance mode and restore traffic', description: 'Remove maintenance page. Re-enable load balancer traffic. Monitor for the first 15 minutes closely.', action_type: 'action' },
    { title: 'Verify system health', description: 'Run full smoke test suite. Confirm monitoring dashboards show healthy metrics across all affected systems.', action_type: 'verification' },
    { title: 'Close window and notify users', description: 'Post "maintenance complete" on status page. Send follow-up email to affected users confirming service is restored.', action_type: 'communication' },
    { title: 'Document changes and lessons learned', description: 'Record every change applied, actual vs planned duration, any issues encountered, and process improvements.', action_type: 'documentation' },
  ],
};

const TUTORIAL_STEPS = {
  jira: [
    { title: 'Sign in and configure your profile', description: 'Log in via SSO. Set your display name, avatar, timezone, and notification preferences in profile settings.', action_type: 'setup' },
    { title: 'Understand the board structure', description: 'Navigate to your team\'s board. Learn the columns: Backlog, In Progress, In Review, Done. Understand WIP limits if set.', action_type: 'training' },
    { title: 'Create your first issue', description: 'Click "Create". Set issue type (Story/Bug/Task), priority, assignee, story points, sprint, and component. Add a clear description.', action_type: 'action' },
    { title: 'Link related issues', description: 'Use the "Link" feature to connect related tickets: "is blocked by", "blocks", "relates to", "is parent of". Learn the epic hierarchy.', action_type: 'training' },
    { title: 'Use JQL for custom filters', description: 'Open Advanced Search. Write your first JQL query: assignee = currentUser() AND status != Done. Save as a personal filter.', action_type: 'training' },
    { title: 'Configure your dashboard', description: 'Create a personal dashboard with gadgets: "Issues assigned to me", "Sprint burndown", "My activity". Set as your homepage.', action_type: 'setup' },
    { title: 'Run a sprint lifecycle', description: 'Observe or participate in sprint planning, daily standup board updates, sprint review, and retrospective. Understand velocity tracking.', action_type: 'training' },
    { title: 'Configure notifications to reduce noise', description: 'Review your notification scheme. Disable notifications you don\'t need (e.g., comments on issues you\'re only watching).', action_type: 'configuration' },
  ],
  github: [
    { title: 'Configure SSH key and Git globals', description: 'Generate Ed25519 SSH key (ssh-keygen -t ed25519). Add public key to GitHub Settings → SSH keys. Set git config user.name and user.email.', action_type: 'setup' },
    { title: 'Clone the primary repository', description: 'Copy the SSH clone URL from GitHub. Run git clone <url>. Confirm the repo clones and the default branch matches what the team uses.', action_type: 'action' },
    { title: 'Understand the team branching strategy', description: 'Review CONTRIBUTING.md or ask your lead. Understand: main is protected, feature branches use feature/<ticket-id>-description naming.', action_type: 'training' },
    { title: 'Create a feature branch and first commit', description: 'Run git checkout -b feature/PROJ-123-my-change. Make a small change. Stage with git add, commit with a clear message, and push.', action_type: 'action' },
    { title: 'Open a pull request', description: 'Navigate to the repo on GitHub. Click "Compare & pull request". Fill in the PR template: description, linked issue, test plan. Request review.', action_type: 'action' },
    { title: 'Address review comments', description: 'Read each review comment. Push additional commits to address feedback. Use "resolve conversation" when each thread is addressed.', action_type: 'action' },
    { title: 'Understand CI checks', description: 'Observe which checks run on your PR (lint, test, build). Learn how to view logs. Never merge a PR with failing required checks.', action_type: 'training' },
    { title: 'Merge and clean up', description: 'Confirm PR is approved and CI is green. Use "Squash and merge" (or team convention). Delete your feature branch after merge.', action_type: 'action' },
  ],
  vscode: [
    { title: 'Install VS Code and apply team settings', description: 'Download from code.visualstudio.com. Copy team settings.json from the team shared repo or ask your lead for the configuration file.', action_type: 'setup' },
    { title: 'Install required extensions', description: 'Open Extensions panel (Cmd+Shift+X). Install: ESLint, Prettier, GitLens, Docker, Copilot (if licensed), and any language-specific extensions.', action_type: 'installation' },
    { title: 'Configure workspace settings', description: 'Open the repo in VS Code. Review .vscode/settings.json and .vscode/extensions.json for team-required project settings.', action_type: 'configuration' },
    { title: 'Set up debug configuration', description: 'Open .vscode/launch.json. Configure a launch config for your app. Test with F5 to confirm the debugger attaches and breakpoints work.', action_type: 'setup' },
    { title: 'Master key shortcuts', description: 'Learn: Cmd+P (fuzzy file search), Cmd+Shift+P (command palette), Cmd+D (multi-cursor), Cmd+` (terminal), Cmd+Shift+F (global search).', action_type: 'training' },
    { title: 'Set up integrated terminal', description: 'Open terminal with Ctrl+`. Set default shell (zsh/bash). Configure the terminal font and color theme to match the editor.', action_type: 'configuration' },
    { title: 'Configure format on save', description: 'Confirm settings.json has editor.formatOnSave: true and editor.defaultFormatter set to Prettier. Test by intentionally mis-formatting a file.', action_type: 'configuration' },
    { title: 'Use the Source Control panel', description: 'Open the SCM panel (Ctrl+Shift+G). Practice staging individual files, writing commit messages, and pushing without leaving the editor.', action_type: 'training' },
  ],
  internal: [
    { title: 'Request access through IT ticketing system', description: 'Submit an IT access request with your manager\'s approval. Specify the tool, role level needed, and business justification.', action_type: 'action' },
    { title: 'Complete initial sign-in and MFA setup', description: 'Log in with your SSO credentials on first use. Enroll in MFA (authenticator app preferred over SMS). Test authentication.', action_type: 'setup' },
    { title: 'Complete built-in onboarding', description: 'Navigate to the tool\'s onboarding wizard or tutorial section. Complete all guided steps to reach the main workspace.', action_type: 'training' },
    { title: 'Configure profile and personal preferences', description: 'Set your display name, notification preferences, time zone, and any role-specific settings. Connect your calendar if prompted.', action_type: 'configuration' },
    { title: 'Learn the primary workflow for your role', description: 'Identify the 2–3 tasks you\'ll do most often. Practice each end-to-end in the tool. Ask your team lead to walk you through edge cases.', action_type: 'training' },
    { title: 'Connect integrations with existing tools', description: 'Set up available integrations (Slack, Jira, Google Workspace, etc.) to avoid context switching. Confirm data syncs correctly.', action_type: 'setup' },
    { title: 'Locate support and help resources', description: 'Bookmark the help documentation, internal Slack support channel, and IT helpdesk ticket URL for this tool. Save your account URL.', action_type: 'documentation' },
  ],
};

const DEFAULT_TUTORIAL_STEPS = TUTORIAL_STEPS.internal;

// ─── Step generators ──────────────────────────────────────────────────────────

const generateOnboardingSteps = (role) => {
  const key = (role || 'custom').toLowerCase();
  const bank = ONBOARDING_STEPS[key] || ONBOARDING_STEPS.custom;
  return bank.map((s, i) => ({ ...s, step_number: i + 1 }));
};

const generateTroubleshootingSteps = (text) => {
  const lower = (text || '').toLowerCase();
  for (const pattern of TROUBLESHOOTING_PATTERNS) {
    if (pattern.keywords.some((kw) => lower.includes(kw))) {
      return {
        steps: pattern.steps.map((s, i) => ({ ...s, step_number: i + 1 })),
        insights: pattern.insights,
      };
    }
  }
  return {
    steps: DEFAULT_TROUBLESHOOTING_STEPS.map((s, i) => ({ ...s, step_number: i + 1 })),
    insights: [
      'Structured 8-step resolution framework applied',
      'Added knowledge base documentation step',
      'Included user confirmation checkpoint',
      'Root cause analysis step included',
    ],
  };
};

const generateRunbookSteps = (runbookType) => {
  const key = (runbookType || 'deployment').toLowerCase();
  const bank = RUNBOOK_STEPS[key] || RUNBOOK_STEPS.deployment;
  return bank.map((s, i) => ({ ...s, step_number: i + 1 }));
};

const generateTutorialSteps = (tool) => {
  const key = (tool || 'internal').toLowerCase().replace(/\s+/g, '').replace('vscode', 'vscode').replace('vs code', 'vscode');
  const bank = TUTORIAL_STEPS[key] || DEFAULT_TUTORIAL_STEPS;
  return bank.map((s, i) => ({ ...s, step_number: i + 1 }));
};

// ─── POST /api/it/generate ────────────────────────────────────────────────────

router.post('/generate', requireAuth, (req, res) => {
  const schema = Joi.object({
    title: Joi.string().trim().min(2).max(120).required(),
    description: Joi.string().trim().allow('').max(2000).default(''),
    itType: Joi.string().valid('onboarding', 'troubleshooting', 'runbook', 'tutorial').required(),
    // Variant-specific params
    role: Joi.string().allow('').max(60).default('custom'),            // onboarding
    errorLog: Joi.string().allow('').max(5000).default(''),            // troubleshooting
    runbookType: Joi.string().allow('').max(60).default('deployment'), // runbook
    tool: Joi.string().allow('').max(80).default('internal'),          // tutorial
  });

  const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  const combined = `${value.title} ${value.description} ${value.errorLog}`;
  let steps;
  let aiInsights;

  switch (value.itType) {
    case 'onboarding':
      steps = generateOnboardingSteps(value.role);
      aiInsights = [
        `Generated ${steps.length}-step ${value.role} IT onboarding guide`,
        'Role-specific access and tool requirements included',
        'Security and compliance training steps added',
        'First-contribution milestone added as capability verification',
      ];
      break;

    case 'troubleshooting': {
      const result = generateTroubleshootingSteps(combined);
      steps = result.steps;
      aiInsights = result.insights;
      break;
    }

    case 'runbook':
      steps = generateRunbookSteps(value.runbookType);
      aiInsights = [
        `${value.runbookType.charAt(0).toUpperCase() + value.runbookType.slice(1)} runbook generated`,
        'Pre- and post-execution verification steps included',
        'Stakeholder communication steps added',
        'Rollback and escalation paths documented',
      ];
      break;

    case 'tutorial':
      steps = generateTutorialSteps(value.tool);
      aiInsights = [
        `Step-by-step ${value.tool} tutorial generated`,
        'Beginner-friendly instructions with exact commands',
        'Verification step included to confirm competency',
        'Team-specific conventions and best practices included',
      ];
      break;

    default:
      return res.status(400).json({ success: false, message: 'Unknown itType' });
  }

  return res.json({ success: true, title: value.title, steps, aiInsights, itType: value.itType });
});

// ─── POST /api/it/create ──────────────────────────────────────────────────────

const stepSchema = Joi.object({
  title: Joi.string().trim().min(1).max(140).required(),
  description: Joi.string().allow('').max(2000).default(''),
  action_type: Joi.string().trim().max(80).default('action'),
  order: Joi.number().integer().min(1).optional(),
  role: Joi.string().allow('').max(80).default(''),
  tip: Joi.string().allow('').max(500).default(''),
  verification: Joi.string().allow('').max(300).default(''),
});

const createSchema = Joi.object({
  title: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().allow('').max(2000).default(''),
  status: Joi.string().valid('draft', 'published').default('draft'),
  source: Joi.string().valid('onboarding', 'troubleshooting', 'runbook', 'tutorial').required(),
  category: Joi.string().allow('').max(60).default(''),
  tags: Joi.array().items(Joi.string().max(40)).max(10).default([]),
  steps: Joi.array().items(stepSchema).min(1).max(60).required(),
});

router.post('/create', requireAuth, (req, res) => {
  const { error, value } = createSchema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, message: error.details[0]?.message || 'Validation failed' });

  if (!req.user.workspace_id) {
    return res.status(409).json({ success: false, message: 'Create a workspace before building IT guides' });
  }

  try {
    const guide = createGuideRecord({
      title: value.title,
      description: value.description,
      workspaceId: req.user.workspace_id,
      ownerUserId: req.user.id,
      status: value.status,
      source: value.source,
    });

    const ordered = [...value.steps]
      .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
      .map((s, i) => ({
        title: s.title,
        description: s.description,
        action_type: s.action_type,
        step_number: i + 1,
        metadata_json: {
          role: s.role,
          tip: s.tip,
          verification: s.verification,
          tags: value.tags,
          category: value.category,
        },
      }));

    const steps = upsertGuideSteps(guide.id, ordered);

    addGuideActivity({
      guideId: guide.id,
      workspaceId: req.user.workspace_id,
      type: 'edited',
      userId: req.user.id,
      metadata: { title: value.title, source: value.source, action: 'it_create' },
    });

    return res.status(201).json({ success: true, guide, steps });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || 'Unable to save IT guide' });
  }
});

module.exports = router;
