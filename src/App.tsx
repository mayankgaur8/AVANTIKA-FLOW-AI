import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Providers
import { OnboardingProvider } from './context/OnboardingContext';
import { SalesInquiryProvider } from './context/SalesInquiryContext';
import { ToastProvider } from './context/ToastContext';
import { TourProvider } from './context/TourContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Global modals & overlays
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { TalkToSalesModal } from './components/TalkToSalesModal';
import { ProductTour } from './components/ProductTour';
import { RequestDemoModal } from './components/RequestDemoModal';

// Layout & landing
import { Navigation, Hero, CTASection, Footer, BackgroundDecor } from './components';
import { DashboardErrorBoundary } from './components/DashboardErrorBoundary';
import { LogoStrip } from './components/LogoStrip';
import { HowItWorks } from './components/HowItWorks';
import { FeatureShowcase } from './components/FeatureShowcase';
import { Testimonials } from './components/Testimonials';

// Post-login onboarding pages
import { OnboardingTeamPage } from './pages/onboarding/OnboardingTeamPage';
import { OnboardingInvitePage } from './pages/onboarding/OnboardingInvitePage';
import { OnboardingIntroPage } from './pages/onboarding/OnboardingIntroPage';

// Auth pages
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { WelcomePage } from './pages/WelcomePage';
import { SignInPage } from './pages/SignInPage';
import { RejectedAccessPage } from './pages/RejectedAccessPage';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { GuidePage } from './pages/GuidePage';
import { RecentPage } from './pages/RecentPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { TeamPage } from './pages/TeamPage';
import { SOPBuilderPage } from './pages/SOPBuilderPage';
import { ProcessCapturePage } from './pages/ProcessCapturePage';
import { StandardizePage } from './pages/StandardizePage';
import { TrainingBuilderPage } from './pages/TrainingBuilderPage';
import { AdminPage } from './pages/AdminPage';
import { VerifyEmailPendingPage } from './pages/VerifyEmailPendingPage';
import { EmailVerifiedSuccessPage } from './pages/EmailVerifiedSuccessPage';

// IT workflow pages
import { ITOnboardingPage } from './pages/ITOnboardingPage';
import { ITTroubleshootingPage } from './pages/ITTroubleshootingPage';
import { ITDevOpsPage } from './pages/ITDevOpsPage';
import { ITTutorialsPage } from './pages/ITTutorialsPage';

// Finance workflow pages
import { InvoiceProcessingPage } from './pages/InvoiceProcessingPage';
import { ExpenseApprovalPage } from './pages/ExpenseApprovalPage';
import { AuditDocsPage } from './pages/AuditDocsPage';
import { FinanceToolTrainingPage } from './pages/FinanceToolTrainingPage';

// Customer workflow pages
import { CustomerOnboardingFlowsPage } from './pages/CustomerOnboardingFlowsPage';
import { SupportPlaybooksPage } from './pages/SupportPlaybooksPage';
import { DemoGuidesPage } from './pages/DemoGuidesPage';
import { SalesWorkflowsPage } from './pages/SalesWorkflowsPage';

// HR workflow pages
import { HROnboardingGuidesPage } from './pages/HROnboardingGuidesPage';
import { HRTrainingProgramsPage } from './pages/HRTrainingProgramsPage';
import { HRKnowledgeBasePage } from './pages/HRKnowledgeBasePage';
import { HRComplianceSOPsPage } from './pages/HRComplianceSOPsPage';

// Solution pages
import { OperationsPage } from './pages/OperationsPage';
import { ITPage } from './pages/ITPage';
import { HRPage } from './pages/HRPage';
import { FinancePage } from './pages/FinancePage';
import { CustomerPage } from './pages/CustomerPage';

// Product pages
import { CapturePage } from './pages/CapturePage';
import { OptimizePage } from './pages/OptimizePage';
import { WorkflowAIPage } from './pages/WorkflowAIPage';
import { WorkflowRecordPage } from './pages/WorkflowRecordPage';
import { WorkflowExamplesPage } from './pages/WorkflowExamplesPage';
import { WorkflowTemplatesPage } from './pages/WorkflowTemplatesPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { OptimizeAgentsPage } from './pages/OptimizeAgentsPage';

// New site pages
import { PricingPage } from './pages/PricingPage';
import { AboutPage } from './pages/AboutPage';
import { BlogPage } from './pages/BlogPage';
import { CareersPage } from './pages/CareersPage';
import { PressPage } from './pages/PressPage';
import { ContactPage } from './pages/ContactPage';
import { DocsPage } from './pages/DocsPage';
import { CommunityPage } from './pages/CommunityPage';
import { ChangelogPage } from './pages/ChangelogPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { CookiePolicyPage } from './pages/CookiePolicyPage';
import { GDPRPage } from './pages/GDPRPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { CaseStudiesPage } from './pages/CaseStudiesPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { CustomerSpotlightPage } from './pages/CustomerSpotlightPage';
import { ResourcesTemplatesPage } from './pages/ResourcesTemplatesPage';
import { ResourcesSecurityPage } from './pages/ResourcesSecurityPage';
import { ResourcesGuidesPage } from './pages/ResourcesGuidesPage';

// Contexts used on home page
import { useLocation } from 'react-router-dom';
import { useTour } from './context/TourContext';

function DashboardRouteGuard() {
  const { state, user, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-[#050c18]" />;
  if (state === 'rejected_or_blocked') return <RejectedAccessPage />;
  if (state === 'authenticated_unverified' || state === 'email_verification_pending') return <VerifyEmailPendingPage />;
  // onboarding_incomplete but already has workspace → let them into the dashboard
  // (happens when navigating from onboarding/intro before setSession re-derives state)
  if (state === 'onboarding_incomplete') {
    if (user?.workspace_id) return <DashboardPage />;
    return <Navigate to="/onboarding/team" replace />;
  }
  if (state === 'email_verified_no_team') return <Navigate to="/onboarding/team" replace />;
  if (state === 'email_verified_with_team') return <DashboardPage />;
  return <SignInPage />;
}

// Guard that wraps every /onboarding/* route:
// - anonymous → sign in
// - already onboarded → dashboard (no going back)
// - everything else (onboarding_incomplete / email_verified_no_team) → allow
function OnboardingRouteGuard({ children }: { children: React.ReactNode }) {
  const { state, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-[#f0f4ff]" />;
  if (state === 'anonymous') return <Navigate to="/signin" replace />;
  if (state === 'rejected_or_blocked') return <Navigate to="/rejected-access" replace />;
  if (state === 'authenticated_unverified' || state === 'email_verification_pending')
    return <Navigate to="/verify-email-pending" replace />;
  if (state === 'email_verified_with_team') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function HomePage() {
  const location = useLocation();
  const { startTour } = useTour();
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="relative min-h-screen" style={{ background: '#050c18' }}>
      <BackgroundDecor />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative"
        style={{ zIndex: 1 }}
      >
        <Navigation />
        <main>
          <Hero onTakeTour={startTour} onRequestDemo={() => setDemoOpen(true)} />
          <LogoStrip />
          <HowItWorks />
          <FeatureShowcase />
          <Testimonials />
          <CTASection />
        </main>
        <Footer />
      </motion.div>
      <RequestDemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} sourcePage={location.pathname} />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <SalesInquiryProvider>
        <OnboardingProvider>
          <TourProvider>
            <AuthProvider>
            {/* Global overlays */}
            <OnboardingModal />
            <TalkToSalesModal />
            <ProductTour />

            <Routes>
              {/* Landing */}
              <Route path="/" element={<HomePage />} />

              {/* Auth */}
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/verify-email-pending" element={<VerifyEmailPendingPage />} />
              <Route path="/email-verified-success" element={<EmailVerifiedSuccessPage />} />
              <Route path="/rejected-access" element={<RejectedAccessPage />} />
              <Route path="/dashboard" element={<DashboardErrorBoundary><DashboardRouteGuard /></DashboardErrorBoundary>} />
              <Route path="/app" element={<DashboardErrorBoundary><DashboardRouteGuard /></DashboardErrorBoundary>} />
              <Route path="/dashboard/recent" element={<DashboardErrorBoundary><RecentPage /></DashboardErrorBoundary>} />
              <Route path="/dashboard/favorites" element={<DashboardErrorBoundary><FavoritesPage /></DashboardErrorBoundary>} />
              <Route path="/dashboard/team" element={<DashboardErrorBoundary><TeamPage /></DashboardErrorBoundary>} />
              <Route path="/workflow-ai/sop-builder" element={<DashboardErrorBoundary><SOPBuilderPage /></DashboardErrorBoundary>} />
              <Route path="/workflow-ai/process-capture" element={<DashboardErrorBoundary><ProcessCapturePage /></DashboardErrorBoundary>} />
              <Route path="/workflow-ai/standardize" element={<DashboardErrorBoundary><StandardizePage /></DashboardErrorBoundary>} />
              <Route path="/workflow-ai/training-builder" element={<DashboardErrorBoundary><TrainingBuilderPage /></DashboardErrorBoundary>} />
              <Route path="/it/onboarding-guides" element={<DashboardErrorBoundary><ITOnboardingPage /></DashboardErrorBoundary>} />
              <Route path="/it/troubleshooting" element={<DashboardErrorBoundary><ITTroubleshootingPage /></DashboardErrorBoundary>} />
              <Route path="/it/devops-runbooks" element={<DashboardErrorBoundary><ITDevOpsPage /></DashboardErrorBoundary>} />
              <Route path="/it/software-tutorials" element={<DashboardErrorBoundary><ITTutorialsPage /></DashboardErrorBoundary>} />
              {/* Finance workflow pages */}
              <Route path="/finance/invoice-processing" element={<DashboardErrorBoundary><InvoiceProcessingPage /></DashboardErrorBoundary>} />
              <Route path="/finance/expense-approvals" element={<DashboardErrorBoundary><ExpenseApprovalPage /></DashboardErrorBoundary>} />
              <Route path="/finance/audit-docs" element={<DashboardErrorBoundary><AuditDocsPage /></DashboardErrorBoundary>} />
              <Route path="/finance/tool-training" element={<DashboardErrorBoundary><FinanceToolTrainingPage /></DashboardErrorBoundary>} />
              {/* Customer workflow pages */}
              <Route path="/customer/onboarding-flows" element={<DashboardErrorBoundary><CustomerOnboardingFlowsPage /></DashboardErrorBoundary>} />
              <Route path="/customer/support-playbooks" element={<DashboardErrorBoundary><SupportPlaybooksPage /></DashboardErrorBoundary>} />
              <Route path="/customer/demo-guides" element={<DashboardErrorBoundary><DemoGuidesPage /></DashboardErrorBoundary>} />
              <Route path="/customer/sales-workflows" element={<DashboardErrorBoundary><SalesWorkflowsPage /></DashboardErrorBoundary>} />
              {/* HR workflow pages */}
              <Route path="/hr/onboarding-guides" element={<DashboardErrorBoundary><HROnboardingGuidesPage /></DashboardErrorBoundary>} />
              <Route path="/hr/training-programs" element={<DashboardErrorBoundary><HRTrainingProgramsPage /></DashboardErrorBoundary>} />
              <Route path="/hr/knowledge-base" element={<DashboardErrorBoundary><HRKnowledgeBasePage /></DashboardErrorBoundary>} />
              <Route path="/hr/compliance-sops" element={<DashboardErrorBoundary><HRComplianceSOPsPage /></DashboardErrorBoundary>} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/guides/:guideId" element={<DashboardErrorBoundary><GuidePage /></DashboardErrorBoundary>} />
              <Route path="/welcome" element={<WelcomePage />} />

              {/* Post-login onboarding flow (new users only) */}
              <Route path="/onboarding/team" element={<OnboardingRouteGuard><OnboardingTeamPage /></OnboardingRouteGuard>} />
              <Route path="/onboarding/invite" element={<OnboardingRouteGuard><OnboardingInvitePage /></OnboardingRouteGuard>} />
              <Route path="/onboarding/intro" element={<OnboardingRouteGuard><OnboardingIntroPage /></OnboardingRouteGuard>} />

              {/* Solutions */}
              <Route path="/solutions/operations" element={<OperationsPage />} />
              <Route path="/solutions/it" element={<ITPage />} />
              <Route path="/solutions/hr" element={<HRPage />} />
              <Route path="/solutions/finance" element={<FinancePage />} />
              <Route path="/solutions/customer" element={<CustomerPage />} />

              {/* Product (legacy routes kept + new /product/* aliases) */}
              <Route path="/capture" element={<CapturePage />} />
              <Route path="/capture/setup" element={<CapturePage />} />
              <Route path="/product/capture" element={<CapturePage />} />
              <Route path="/optimize" element={<OptimizePage />} />
              <Route path="/product/optimize" element={<OptimizePage />} />
              <Route path="/workflow-ai" element={<WorkflowAIPage />} />
              <Route path="/workflow-ai/record" element={<DashboardErrorBoundary><WorkflowRecordPage /></DashboardErrorBoundary>} />
              <Route path="/workflow-ai/examples" element={<DashboardErrorBoundary><WorkflowExamplesPage /></DashboardErrorBoundary>} />
              <Route path="/workflow-ai/templates" element={<DashboardErrorBoundary><WorkflowTemplatesPage /></DashboardErrorBoundary>} />
              <Route path="/platform/workflow-ai" element={<WorkflowAIPage />} />
              <Route path="/product/workflow-ai" element={<WorkflowAIPage />} />
              <Route path="/integrations" element={<IntegrationsPage />} />
              <Route path="/platform/integrations" element={<IntegrationsPage />} />
              <Route path="/product/integrations" element={<IntegrationsPage />} />
              <Route path="/optimize-agents" element={<OptimizeAgentsPage />} />
              <Route path="/platform/agents" element={<OptimizeAgentsPage />} />

              {/* Discover / Customers */}
              <Route path="/discover/case-studies" element={<CaseStudiesPage />} />
              <Route path="/discover/reviews" element={<ReviewsPage />} />
              <Route path="/customers/spotlight" element={<CustomerSpotlightPage />} />

              {/* Pricing */}
              <Route path="/pricing" element={<PricingPage />} />

              {/* Company */}
              <Route path="/about" element={<AboutPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/careers" element={<CareersPage />} />
              <Route path="/press" element={<PressPage />} />
              <Route path="/contact" element={<ContactPage />} />

              {/* Resources */}
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/templates" element={<ResourcesTemplatesPage />} />
              <Route path="/resources/templates" element={<ResourcesTemplatesPage />} />
              <Route path="/resources/security" element={<ResourcesSecurityPage />} />
              <Route path="/resources/guides" element={<ResourcesGuidesPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/changelog" element={<ChangelogPage />} />

              {/* Legal */}
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/cookie-policy" element={<CookiePolicyPage />} />
              <Route path="/gdpr" element={<GDPRPage />} />

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            </AuthProvider>
          </TourProvider>
        </OnboardingProvider>
      </SalesInquiryProvider>
    </ToastProvider>
  );
}

export default App;
