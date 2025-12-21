import React from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";

// Context & Auth
import { AuthProvider } from "./context/AuthContext";
import {
	RequireAuth,
	RequireSubscription,
	RequireAdmin,
} from "./components/ProtectedRoutes";

// Utilities
import ScrollToTop from "./components/ScrollToTop";

// Layouts
import { PublicLayout } from "./components/PublicLayout";
import { DashboardLayout } from "./components/DashboardLayout";

// Modals
import { MaintenancePopup } from "./components/modals/MaintenancePopup";

// Public Pages
import { LandingPage } from "./components/pages/LandingPage";
import { LoginPage } from "./components/pages/LoginPage";
import { SignUpPage } from "./components/pages/SignUpPage";
import { LiveDemoPage } from "./components/pages/LiveDemoPage";
import { FeaturesPage } from "./components/pages/FeaturesPage";
import { PricingPage } from "./components/pages/PricingPage";
import { EnterprisePage } from "./components/pages/EnterprisePage";
import { ChangelogPage } from "./components/pages/ChangelogPage";
import { DocsPage } from "./components/pages/DocsPage";
import { ApiPage } from "./components/pages/ApiPage";
import { StatusPage } from "./components/pages/StatusPage";
import { CommunityPage } from "./components/pages/CommunityPage";
import { AboutPage } from "./components/pages/AboutPage";
import { BlogPage } from "./components/pages/BlogPage";
import { LegalPage } from "./components/pages/LegalPage";
import { ContactPage } from "./components/pages/ContactPage";

// New Enterprise Resource Pages
import { SecurityWhitepaperPage } from "./components/pages/SecurityWhitepaperPage";
import { ContactSalesPage } from "./components/pages/ContactSalesPage";

// Community Forum Pages
import { ForumPage } from "./components/pages/ForumPage";
import { DiscussionPage } from "./components/pages/DiscussionPage";

// Protected Pages
import { DashboardHome } from "./components/pages/DashboardHome";
import { CreateInstance } from "./components/pages/CreateInstance";
import { InstanceDetails } from "./components/pages/InstanceDetails";
import { SettingsPage } from "./components/pages/SettingsPage";
import { PlansPage } from "./components/pages/PlansPage";
import { ProfilePage } from "./components/pages/ProfilePage";
import { InstanceList } from "./components/pages/InstanceList";
import { CheckoutPage } from "./components/pages/CheckoutPage";

// Admin Pages
import { AdminUsersPage } from "./components/pages/AdminUsersPage";
import { AdminTenantsPage } from "./components/pages/AdminTenantsPage";
import { AdminTenantDetailPage } from "./components/pages/AdminTenantDetailPage";
import { AdminServicesPage } from "./components/pages/AdminServicesPage";
import { MaintenancePage } from "./components/pages/MaintenancePage";

const App: React.FC = () => {
	return (
		<AuthProvider>
			<Router>
				<ScrollToTop />
				<MaintenancePopup />
				<Routes>
					{/* --- Public Routes (Wrapped in PublicLayout) --- */}
					<Route element={<PublicLayout />}>
						<Route path='/' element={<LandingPage />} />
						<Route path='/features' element={<FeaturesPage />} />
						<Route path='/pricing' element={<PricingPage />} />
						<Route path='/enterprise' element={<EnterprisePage />} />
						<Route path='/changelog' element={<ChangelogPage />} />

						<Route path='/docs' element={<DocsPage />} />
						<Route path='/api-reference' element={<ApiPage />} />
						<Route path='/status' element={<StatusPage />} />
						<Route path='/community' element={<CommunityPage />} />

						<Route path='/about' element={<AboutPage />} />
						<Route path='/blog' element={<BlogPage />} />
						<Route path='/legal' element={<LegalPage />} />
						<Route path='/contact' element={<ContactPage />} />

						{/* New Pages */}
						<Route
							path='/resources/security-whitepaper'
							element={<SecurityWhitepaperPage />}
						/>

						{/* Community Forum Routes */}
						<Route path='/resources/community/forum' element={<ForumPage />} />
						<Route
							path='/resources/community/discuss/:id'
							element={<DiscussionPage />}
						/>
					</Route>

					{/* --- Auth Routes (No Layout or Simple Layout) --- */}
					<Route path='/login' element={<LoginPage />} />
					<Route path='/signup' element={<SignUpPage />} />

					{/* --- Demo Route (Standalone) --- */}
					<Route path='/demo' element={<LiveDemoPage />} />

					{/* --- Sales Page (Standalone Layout for Focus) --- */}
					<Route path='/enterprise/contact' element={<ContactSalesPage />} />

					{/* --- Protected Dashboard Routes --- */}
					<Route element={<RequireAuth />}>
						<Route element={<DashboardLayout />}>
							<Route path='/dashboard' element={<DashboardHome />} />
							<Route path='/dashboard/instances' element={<InstanceList />} />
							<Route path='/create' element={<CreateInstance />} />
							<Route path='/instance/:id' element={<InstanceDetails />} />
							<Route path='/settings' element={<SettingsPage />} />
							<Route path='/profile' element={<ProfilePage />} />
							<Route path='/plans' element={<PlansPage />} />
							<Route path='/checkout/:checkoutId' element={<CheckoutPage />} />

							{/* Example of Tier-Gated Route */}
							<Route
								element={<RequireSubscription requiredPlan='enterprise' />}>
								<Route
									path='/dashboard/audit-logs'
									element={
										<div className='p-8'>
											<h1>Enterprise Audit Logs</h1>
										</div>
									}
								/>
							</Route>

							{/* --- Admin Routes (Require Admin Role) --- */}
							<Route element={<RequireAdmin />}>
								<Route path='/admin/users' element={<AdminUsersPage />} />
								<Route path='/admin/tenants' element={<AdminTenantsPage />} />
								<Route path='/admin/tenants/:id' element={<AdminTenantDetailPage />} />
								<Route path='/admin/services' element={<AdminServicesPage />} />
								<Route
									path='/admin/maintenance'
									element={<MaintenancePage />}
								/>
							</Route>
						</Route>
					</Route>

					{/* --- Fallback: Redirect to Home --- */}
					<Route path='*' element={<Navigate to='/' replace />} />
				</Routes>
			</Router>
		</AuthProvider>
	);
};

export default App;
