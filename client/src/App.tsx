/**
 * Main Application Component for TuneMantra Music Distribution Platform
 * 
 * This file defines the routing structure and core layout for the entire application.
 * It serves as the central organization point for all frontend features and pages.
 * 
 * Key concepts for beginners:
 * 
 * 1. Component Structure: The App component is the root of the component tree,
 *    containing all other UI components as descendants.
 * 
 * 2. Routing System: This file configures wouter (a lightweight React router)
 *    to handle navigation between different pages based on URL paths.
 * 
 * 3. Code Splitting: Uses React.lazy() to load page components only when needed,
 *    improving initial load performance by reducing bundle size.
 * 
 * 4. Authentication Protection: Wraps routes with ProtectedRoute components
 *    to ensure users are authenticated before accessing protected pages.
 * 
 * 5. Layout Management: Organizes UI with consistent layouts for regular pages,
 *    settings pages, and admin pages, maintaining a cohesive user experience.
 * 
 * 6. Global State Management: Sets up providers for authentication, feature access,
 *    and data fetching that make these services available throughout the app.
 * 
 * The routing structure is organized by functional area (catalog management,
 * analytics, settings, etc.) to keep related features together.
 */

// Import routing components from wouter (a lightweight router for React)
import { Switch, Route } from "wouter";

// Import React hooks for code splitting and suspense
import { Suspense, lazy } from "react";

// Import UI components and providers
import { Toaster } from "@/components/ui/toaster";  // Toast notifications
// Debug helpers
import { DebugNavigation } from "./components/debug/DebugNavigation";  // Debug navigation helper
import { QueryClientProvider } from "@tanstack/react-query";  // Data fetching library
import { queryClient } from "./lib/queryClient";  // Pre-configured query client
import { AuthProvider } from "./hooks/use-auth";  // Authentication context provider
import { AdminAuthProvider } from "./hooks/use-admin-auth";  // Admin authentication context provider
import { FeatureAccessProvider } from "./hooks/use-feature-access";  // Feature access control provider
import { ProtectedRoute } from "./lib/protected-route";  // Route wrapper that requires authentication
import AdminProtectedRoute from "./lib/admin-protected-route";  // Route wrapper that requires admin privileges
import { RoleProtectedRoute } from "./lib/role-protected-route";  // Route wrapper that requires specific roles
import { MainLayout } from "./components/layout/main-layout";  // Main application layout with navigation
import { CoreUIMainLayout } from "./components/layout/core-ui-main-layout";  // CoreUI-styled main application layout
import { SettingsLayout } from "./pages/settings/layout";  // Settings section layout
import { AdminDashboardLayout } from "./components/layout/admin-dashboard-layout";  // Admin panel layout
import { AnalyticsLayout } from "./components/layout/analytics-layout";  // Analytics section layout
import { CatalogLayout } from "./components/layout/catalog-layout";  // Catalog section layout
import { Spinner } from "./components/ui/spinner";  // Loading spinner component
import { Web3Provider } from "./web3/Web3Provider";  // Web3 blockchain integration provider

/**
 * Lazy-loaded page components
 * 
 * Using React.lazy() for code splitting - this means each page's code will only be loaded
 * when the user navigates to that page, improving initial load time.
 * 
 * The "@/pages/..." syntax is an alias for "src/pages/..." configured in the TypeScript and Vite settings.
 */

// Home and authentication pages
const HomePage = lazy(() => import("@/pages/core-ui-home-page"));  // Dashboard/home page (CoreUI styled)
const LegacyHomePage = lazy(() => import("@/pages/home-page"));  // Old dashboard/home page
const AuthPage = lazy(() => import("@/pages/auth-page"));  // Login/signup page
const LoginDebugPage = lazy(() => import("@/pages/login-debug"));  // Debug page for authentication

// Catalog management pages
const TracksPage = lazy(() => import("@/pages/catalog/tracks"));  // List of music tracks
const ReleasesPage = lazy(() => import("@/pages/catalog/releases"));  // List of releases (albums, singles, etc.)
const BulkUploadPage = lazy(() => import("@/pages/catalog/bulk-upload"));  // Bulk content upload
const UploadPage = lazy(() => import("@/pages/upload-page"));  // Upload new content

// Analytics and reporting pages
const AnalyticsDashboard = lazy(() => import("@/pages/analytics/dashboard"));  // Main analytics dashboard
const TrendsPage = lazy(() => import("@/pages/analytics/trends"));  // Trend analysis
const RevenuePage = lazy(() => import("@/pages/analytics/revenue"));  // Revenue reports
const EngagementPage = lazy(() => import("@/pages/analytics/engagement"));  // User engagement metrics
const ImportReportsPage = lazy(() => import("@/pages/analytics/import-reports"));  // Import analytics reports

// Settings and user management pages
const ProfileSettings = lazy(() => import("@/pages/settings/profile"));  // User profile settings
const TeamManagementPage = lazy(() => import("@/pages/settings/team-management"));  // Team member management
const PermissionTemplatesPage = lazy(() => import("@/pages/settings/permission-templates"));  // Permission templates
const ManagedArtistsPage = lazy(() => import("@/pages/settings/managed-artists"));  // Artist manager's view of artists

// Payment and royalty pages
const PaymentsPage = lazy(() => import("@/pages/payments"));  // Payment history and details
const RoyaltySplitsPage = lazy(() => import("@/pages/royalty-splits"));  // Configure revenue splitting
const PaymentsManagementPage = lazy(() => import("@/pages/payments-management"));  // Payment settings

// Distribution and scheduling pages
const DistributionSchedulePage = lazy(() => import("@/pages/catalog/distribution-schedule"));  // Schedule releases
const DistributionAnalyticsPage = lazy(() => import("@/pages/catalog/distribution-analytics"));  // Distribution metrics

// Rights management pages
const RightsPage = lazy(() => import("@/pages/rights"));  // Main rights management page
const RightsOverviewPage = lazy(() => import("@/pages/rights/overview"));  // Rights overview
const RightsLicensesPage = lazy(() => import("@/pages/rights/licenses"));  // License management
const RightsCopyrightsPage = lazy(() => import("@/pages/rights/copyrights"));  // Copyright management
const RightsPublishingPage = lazy(() => import("@/pages/rights/publishing"));  // Publishing rights
const RightsLegalPage = lazy(() => import("@/pages/rights/legal"));  // Legal documents
const RightsAssociationsPage = lazy(() => import("@/pages/rights/associations"));  // Organization associations

// Other regular user pages
const SubLabelsPage = lazy(() => import("@/pages/settings/sub-labels"));  // Sub-label management
const SupportTicketsPage = lazy(() => import("@/pages/support-tickets"));  // Support ticket list
const SupportPage = lazy(() => import("@/pages/support-page"));  // Support portal
const SubscriptionPlansPage = lazy(() => import("@/pages/subscription-plans"));  // Subscription plan selection
const NotFound = lazy(() => import("@/pages/not-found"));  // 404 page

// Demo and test pages
const LampDemoPage = lazy(() => import("@/pages/lamp-demo"));  // Demo page
const ExportTestPage = lazy(() => import("@/pages/export-test"));  // Export testing

// Audio fingerprinting pages
const AudioFingerprintingPage = lazy(() => import("@/pages/audio-fingerprinting"));  // Audio fingerprinting overview
const FingerprintDemoPage = lazy(() => import("@/pages/fingerprint-demo"));  // Fingerprint demo tool
const EnhancedTrackManagerDemo = lazy(() => import("@/pages/enhanced-track-manager-demo"));  // Enhanced track manager

// Blockchain / Web3 pages
const Web3RightsPage = lazy(() => import("@/pages/Web3Rights"));  // Web3 rights management page
const BlockchainTestPage = lazy(() => import("@/pages/blockchain-test"));  // Blockchain test page

/**
 * Admin pages
 * 
 * These are imported directly (not lazy-loaded) to ensure the admin
 * interface loads quickly and completely once an admin logs in.
 */
import AdminDashboard from "@/pages/admin/dashboard";  // Main admin dashboard
import AccountApprovalPage from "@/pages/admin/accounts-approval";  // User account approval page
import AdminUsersPage from "@/pages/admin/users";  // User management page
import ManagedArtistsAdmin from "@/pages/admin/managed-artists";  // Artist management from admin view
import TicketsManagement from "@/pages/admin/tickets";  // Support ticket management
import ContentManagement from "@/pages/admin/content";  // Content moderation
import QualityManagement from "@/pages/admin/quality";  // Quality control panel
import ContentQualityPage from "@/pages/admin/content-quality";  // Content quality metrics
import DataImportsPage from "@/pages/admin/imports";  // Data import management
import AdminSettingsPage from "@/pages/admin/settings";  // Admin settings panel
import AdminLogin from "@/pages/admin/login";  // Admin login page
import StatisticsPage from "@/pages/admin/statistics";  // Platform statistics
import ExportHubPage from "@/pages/admin/export-hub";  // Content export hub
import SuperAdminDashboard from "@/pages/super-admin/dashboard";  // Super admin dashboard
import DocumentationPage from "@/pages/documentation-page";  // Unified documentation page

/**
 * Layout wrapper components
 * 
 * These components wrap pages with appropriate layouts and ensure authentication.
 * They help maintain consistent UI across different sections of the application.
 */

/**
 * ProtectedPage component
 * 
 * Wraps a regular user page with the main application layout and ensures the user is authenticated.
 * The main layout includes navigation sidebar, header, and footer.
 * 
 * @param component - The page component to render inside the layout
 */
function ProtectedPage({ component: Component }: { component: React.ComponentType }) {
  return (
    <CoreUIMainLayout>
      <Component />
    </CoreUIMainLayout>
  );
}

/**
 * ProtectedSettingsPage component
 * 
 * Wraps a settings page with the settings layout, which includes the settings
 * navigation sidebar in addition to the main layout elements.
 * 
 * @param component - The settings page component to render inside the layout
 */
function ProtectedSettingsPage({ component: Component }: { component: React.ComponentType }) {
  return (
    <SettingsLayout>
      <Component />
    </SettingsLayout>
  );
}

/**
 * ProtectedAdminPage component
 * 
 * Wraps an admin page with the admin dashboard layout and ensures the user has admin privileges.
 * This adds extra security to admin pages and provides consistent admin UI.
 * 
 * @param component - The admin page component to render inside the layout
 */
function ProtectedAdminPage({ component: Component }: { component: React.ComponentType }) {
  return (
    <AdminProtectedRoute path="" component={() => (
      <AdminDashboardLayout>
        <Component />
      </AdminDashboardLayout>
    )} />
  );
}

/**
 * SuspenseLoader component
 * 
 * Loading indicator displayed while lazy-loaded components are being fetched.
 * This creates a better user experience by showing a loading spinner instead of
 * a blank page during code loading.
 */
function SuspenseLoader() {
  return (
    <div className="flex items-center justify-center w-full h-[calc(100vh-4rem)] bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Spinner size="lg" className="text-primary" />
      </div>
    </div>
  );
}

/**
 * Main App component
 * 
 * This is the root component of the application that sets up:
 * 1. Global state providers (data fetching, authentication, feature access)
 * 2. Code splitting through Suspense
 * 3. The complete routing structure for all application pages
 * 4. Global UI elements like the toast notification system
 * 
 * @returns The fully configured application with routing
 */
function App() {
  return (
    // Set up React Query for data fetching
    <QueryClientProvider client={queryClient}>
      {/* Authentication context provider handles user login state */}
      <AuthProvider>
        {/* Admin authentication context provider handles admin login state */}
        <AdminAuthProvider>
          {/* Web3 provider for blockchain integration */}
          <Web3Provider>
            {/* Feature access provider controls which features users can access based on role/plan */}
            <FeatureAccessProvider>
            {/* Suspense enables code splitting with a loading indicator */}
            <Suspense fallback={<SuspenseLoader />}>
            {/* Route switching based on URL path */}
            <Switch>
              {/* ============================================================ */}
              {/* DASHBOARD ROUTE - The main landing page after login         */}
              {/* ============================================================ */}
              <Route path="/">
                <ProtectedRoute path="/" component={() => <ProtectedPage component={HomePage} />} />
              </Route>
              
              {/* ============================================================ */}
              {/* CATALOG MANAGEMENT SECTION                                  */}
              {/* These routes handle music uploads and catalog management    */}
              {/* ============================================================ */}
              <Route path="/upload">
                <ProtectedRoute path="/upload" component={() => (
                  <CoreUIMainLayout>
                    <UploadPage />
                  </CoreUIMainLayout>
                )} />
              </Route>
              
              {/* Catalog section with catalog layout wrapper */}
              <Route path="/catalog">
                <ProtectedRoute path="/catalog" component={() => (
                  <CoreUIMainLayout>
                    <CatalogLayout>
                      <ReleasesPage />
                    </CatalogLayout>
                  </CoreUIMainLayout>
                )} />
              </Route>
              <Route path="/catalog/tracks">
                <ProtectedRoute path="/catalog/tracks" component={() => (
                  <CoreUIMainLayout>
                    <CatalogLayout>
                      <TracksPage />
                    </CatalogLayout>
                  </CoreUIMainLayout>
                )} />
              </Route>
              <Route path="/catalog/releases">
                <ProtectedRoute path="/catalog/releases" component={() => (
                  <CoreUIMainLayout>
                    <CatalogLayout>
                      <ReleasesPage />
                    </CatalogLayout>
                  </CoreUIMainLayout>
                )} />
              </Route>
              <Route path="/catalog/bulk-upload">
                <ProtectedRoute path="/catalog/bulk-upload" component={() => (
                  <CoreUIMainLayout>
                    <CatalogLayout>
                      <BulkUploadPage />
                    </CatalogLayout>
                  </CoreUIMainLayout>
                )} />
              </Route>
              <Route path="/catalog/distribution-schedule">
                <ProtectedRoute path="/catalog/distribution-schedule" component={() => (
                  <CoreUIMainLayout>
                    <CatalogLayout>
                      <DistributionSchedulePage />
                    </CatalogLayout>
                  </CoreUIMainLayout>
                )} />
              </Route>
              <Route path="/catalog/distribution-analytics">
                <ProtectedRoute path="/catalog/distribution-analytics" component={() => (
                  <CoreUIMainLayout>
                    <CatalogLayout>
                      <DistributionAnalyticsPage />
                    </CatalogLayout>
                  </CoreUIMainLayout>
                )} />
              </Route>
              
              {/* ============================================================ */}
              {/* ANALYTICS SECTION                                           */}
              {/* Performance tracking, statistics, and reporting             */}
              {/* ============================================================ */}
              
              {/* Analytics section with analytics layout wrapper */}
              <Route path="/analytics">
                <ProtectedRoute path="/analytics" component={() => (
                  <CoreUIMainLayout>
                    <AnalyticsLayout>
                      <AnalyticsDashboard />
                    </AnalyticsLayout>
                  </CoreUIMainLayout>
                )} />
              </Route>
              <Route path="/analytics/dashboard">
                <ProtectedRoute path="/analytics/dashboard" component={() => (
                  <CoreUIMainLayout>
                    <AnalyticsLayout>
                      <AnalyticsDashboard />
                    </AnalyticsLayout>
                  </CoreUIMainLayout>
                )} />
              </Route>
              <Route path="/analytics/trends">
                <ProtectedRoute path="/analytics/trends" component={() => (
                  <CoreUIMainLayout>
                    <AnalyticsLayout>
                      <TrendsPage />
                    </AnalyticsLayout>
                  </CoreUIMainLayout>
                )} />
              </Route>
              <Route path="/analytics/engagement">
                <ProtectedRoute path="/analytics/engagement" component={() => (
                  <CoreUIMainLayout>
                    <AnalyticsLayout>
                      <EngagementPage />
                    </AnalyticsLayout>
                  </CoreUIMainLayout>
                )} />
              </Route>
              <Route path="/analytics/revenue">
                <ProtectedRoute path="/analytics/revenue" component={() => (
                  <CoreUIMainLayout>
                    <AnalyticsLayout>
                      <RevenuePage />
                    </AnalyticsLayout>
                  </CoreUIMainLayout>
                )} />
              </Route>
              <Route path="/analytics/import-reports">
                <RoleProtectedRoute 
                  path="/analytics/import-reports" 
                  component={() => (
                    <CoreUIMainLayout>
                      <AnalyticsLayout>
                        <ImportReportsPage />
                      </AnalyticsLayout>
                    </CoreUIMainLayout>
                  )}
                  adminOnly={true}
                />
              </Route>
              
              {/* ============================================================ */}
              {/* PAYMENTS AND ROYALTIES SECTION                              */}
              {/* Financial management, revenue sharing, payment processing   */}
              {/* ============================================================ */}
              <Route path="/payments">
                <ProtectedRoute path="/payments" component={() => <ProtectedPage component={PaymentsPage} />} />
              </Route>
              <Route path="/payments-management">
                <RoleProtectedRoute 
                  path="/payments-management" 
                  component={() => <ProtectedPage component={PaymentsManagementPage} />}
                  adminOnly={true}
                />
              </Route>
              <Route path="/royalty-splits">
                <ProtectedRoute path="/royalty-splits" component={() => <ProtectedPage component={RoyaltySplitsPage} />} />
              </Route>
              
              {/* ============================================================ */}
              {/* RIGHTS MANAGEMENT SECTION                                   */}
              {/* Copyright, licensing, and legal rights management           */}
              {/* ============================================================ */}
              <Route path="/rights">
                <ProtectedRoute path="/rights" component={() => <ProtectedPage component={RightsPage} />} />
              </Route>
              <Route path="/rights/web3">
                <ProtectedRoute path="/rights/web3" component={() => <ProtectedPage component={Web3RightsPage} />} />
              </Route>
              <Route path="/rights/overview">
                <ProtectedRoute path="/rights/overview" component={() => <ProtectedPage component={RightsOverviewPage} />} />
              </Route>
              <Route path="/rights/licenses">
                <ProtectedRoute path="/rights/licenses" component={() => <ProtectedPage component={RightsLicensesPage} />} />
              </Route>
              <Route path="/rights/copyrights">
                <ProtectedRoute path="/rights/copyrights" component={() => <ProtectedPage component={RightsCopyrightsPage} />} />
              </Route>
              <Route path="/rights/publishing">
                <ProtectedRoute path="/rights/publishing" component={() => <ProtectedPage component={RightsPublishingPage} />} />
              </Route>
              <Route path="/rights/associations">
                <ProtectedRoute path="/rights/associations" component={() => <ProtectedPage component={RightsAssociationsPage} />} />
              </Route>
              <Route path="/rights/legal">
                <ProtectedRoute path="/rights/legal" component={() => <ProtectedPage component={RightsLegalPage} />} />
              </Route>
              
              {/* ============================================================ */}
              {/* USER SETTINGS SECTION                                       */}
              {/* Account settings, team management, permissions              */}
              {/* Note: These use the SettingsLayout wrapper                  */}
              {/* ============================================================ */}
              <Route path="/settings">
                {/* Default settings page is profile */}
                <ProtectedRoute path="/settings" component={() => <ProtectedSettingsPage component={ProfileSettings} />} />
              </Route>
              <Route path="/settings/profile">
                <ProtectedRoute path="/settings/profile" component={() => <ProtectedSettingsPage component={ProfileSettings} />} />
              </Route>
              <Route path="/settings/team">
                <ProtectedRoute path="/settings/team" component={() => <ProtectedSettingsPage component={TeamManagementPage} />} />
              </Route>
              <Route path="/settings/permissions">
                <ProtectedRoute path="/settings/permissions" component={() => <ProtectedSettingsPage component={PermissionTemplatesPage} />} />
              </Route>
              <Route path="/settings/users">
                {/* Placeholder component - not yet implemented */}
                <RoleProtectedRoute 
                  path="/settings/users" 
                  component={() => <ProtectedSettingsPage component={() => <div>User Management</div>} />}
                  adminOnly={true}
                />
              </Route>
              <Route path="/settings/roles">
                {/* Placeholder component - not yet implemented */}
                <RoleProtectedRoute 
                  path="/settings/roles" 
                  component={() => <ProtectedSettingsPage component={() => <div>Role Management</div>} />}
                  adminOnly={true}
                />
              </Route>
              <Route path="/settings/catalog">
                {/* Placeholder component - not yet implemented */}
                <ProtectedRoute path="/settings/catalog" component={() => <ProtectedSettingsPage component={() => <div>Catalog Settings</div>} />} />
              </Route>
              <Route path="/settings/billing">
                <RoleProtectedRoute 
                  path="/settings/billing" 
                  component={() => <ProtectedSettingsPage component={SubscriptionPlansPage} />}
                  adminOnly={true}
                />
              </Route>
              <Route path="/settings/sub-labels">
                <ProtectedRoute
                  path="/settings/sub-labels"
                  component={() => <ProtectedSettingsPage component={SubLabelsPage} />}
                />
              </Route>
              <Route path="/settings/managed-artists">
                <ProtectedRoute
                  path="/settings/managed-artists"
                  component={() => <ProtectedSettingsPage component={ManagedArtistsPage} />}
                />
              </Route>
              
              {/* ============================================================ */}
              {/* SUPPORT AND SUBSCRIPTION SECTION                            */}
              {/* Help center, support tickets, subscription management       */}
              {/* ============================================================ */}
              <Route path="/support">
                <ProtectedRoute
                  path="/support"
                  component={() => <ProtectedPage component={SupportPage} />}
                />
              </Route>
              <Route path="/subscription-plans">
                <ProtectedRoute
                  path="/subscription-plans"
                  component={() => <ProtectedPage component={SubscriptionPlansPage} />}
                />
              </Route>
              
              {/* ============================================================ */}
              {/* PUBLIC ROUTES (no authentication required)                  */}
              {/* Authentication and debugging pages                          */}
              {/* ============================================================ */}
              <Route path="/login-debug" component={LoginDebugPage} />
              <Route path="/auth" component={AuthPage} />
              
              {/* ============================================================ */}
              {/* DEMO AND TESTING ROUTES                                     */}
              {/* ============================================================ */}
              <Route path="/lamp-demo" component={LampDemoPage} />
              <Route path="/export-test" component={ExportTestPage} />
              <Route path="/legacy-home" component={LegacyHomePage} />
              <Route path="/audio-fingerprinting" component={AudioFingerprintingPage} />
              <Route path="/fingerprint-demo" component={FingerprintDemoPage} />
              <Route path="/enhanced-track-manager-demo" component={EnhancedTrackManagerDemo} />
              <Route path="/blockchain-test" component={BlockchainTestPage} />
              
              {/* ============================================================ */}
              {/* BLOCKCHAIN & WEB3 SECTION (routes located in other sections) */}
              {/* Blockchain-based rights and royalty management               */}
              {/* ============================================================ */}
              
              {/* ============================================================ */}
              {/* ADMIN ROUTES                                                */}
              {/* These routes use AdminProtectedRoute wrapper which          */}
              {/* requires admin privileges                                   */}
              {/* ============================================================ */}
              {/* Admin login page (public) */}
              <Route path="/admin/login" component={AdminLogin} />
              
              {/* Protected admin pages */}
              <Route path="/admin/dashboard">
                <AdminProtectedRoute path="/admin/dashboard" component={() => (
                  <AdminDashboardLayout>
                    <AdminDashboard />
                  </AdminDashboardLayout>
                )} />
              </Route>
              <Route path="/admin/accounts">
                <AdminProtectedRoute path="/admin/accounts" component={() => (
                  <AdminDashboardLayout>
                    <AdminUsersPage />
                  </AdminDashboardLayout>
                )} />
              </Route>
              <Route path="/admin/accounts/approvals">
                <AdminProtectedRoute path="/admin/accounts/approvals" component={() => (
                  <AdminDashboardLayout>
                    <AccountApprovalPage />
                  </AdminDashboardLayout>
                )} />
              </Route>
              <Route path="/admin/managed-artists">
                <AdminProtectedRoute path="/admin/managed-artists" component={() => (
                  <AdminDashboardLayout>
                    <ManagedArtistsAdmin />
                  </AdminDashboardLayout>
                )} />
              </Route>
              <Route path="/admin/tickets">
                <AdminProtectedRoute path="/admin/tickets" component={() => (
                  <AdminDashboardLayout>
                    <TicketsManagement />
                  </AdminDashboardLayout>
                )} />
              </Route>
              <Route path="/admin/content">
                <AdminProtectedRoute path="/admin/content" component={() => (
                  <AdminDashboardLayout>
                    <ContentQualityPage />
                  </AdminDashboardLayout>
                )} />
              </Route>
              <Route path="/admin/imports">
                <AdminProtectedRoute path="/admin/imports" component={() => (
                  <AdminDashboardLayout>
                    <DataImportsPage />
                  </AdminDashboardLayout>
                )} />
              </Route>
              <Route path="/admin/settings">
                <AdminProtectedRoute path="/admin/settings" component={() => (
                  <AdminDashboardLayout>
                    <AdminSettingsPage />
                  </AdminDashboardLayout>
                )} />
              </Route>
              <Route path="/admin/statistics">
                <AdminProtectedRoute path="/admin/statistics" component={() => (
                  <AdminDashboardLayout>
                    <StatisticsPage />
                  </AdminDashboardLayout>
                )} />
              </Route>
              <Route path="/admin/export-hub">
                <AdminProtectedRoute path="/admin/export-hub" component={() => (
                  <AdminDashboardLayout>
                    <ExportHubPage />
                  </AdminDashboardLayout>
                )} />
              </Route>
              
              {/* ============================================================ */}
              {/* SUPER ADMIN ROUTES (for system administrators)              */}
              {/* ============================================================ */}
              <Route path="/super-admin/dashboard">
                <AdminProtectedRoute path="/super-admin/dashboard" component={() => (
                  <AdminDashboardLayout>
                    <SuperAdminDashboard />
                  </AdminDashboardLayout>
                )} />
              </Route>
              
              {/* ============================================================ */}
              {/* DOCUMENTATION ROUTE - Unified documentation                  */}
              {/* Single comprehensive documentation page                      */}
              {/* ============================================================ */}
              <Route path="/documentation">
                <ProtectedRoute path="/documentation" component={() => <ProtectedPage component={DocumentationPage} />} />
              </Route>

              {/* ============================================================ */}
              {/* NOT FOUND ROUTE - This must be the last route defined       */}
              {/* It catches any URLs that don't match defined routes         */}
              {/* ============================================================ */}
              <Route component={NotFound} />
            </Switch>
            
            {/* Global toast notification container */}
            <Toaster />
            {/* Debug Navigation Helper - Only visible in development */}
            {import.meta.env.DEV && <DebugNavigation />}
          </Suspense>
            </FeatureAccessProvider>
          </Web3Provider>
        </AdminAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;