import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDashboard } from "@/context/DashboardContext";
import { Lock, ArrowRight } from "lucide-react";

/**
 * 1. RequireAuth
 * Ensures the user is logged in. If not, redirects to login page
 * while saving the attempted location for a redirect-back.
 */
export const RequireAuth: React.FC = () => {
	const { isAuthenticated, isLoading } = useAuth();
	const location = useLocation();

	if (isLoading) {
		return (
			<div className='p-10 text-center text-slate-500'>Authenticating...</div>
		);
	}

	if (!isAuthenticated) {
		// Redirect them to the /login page, but save the current location they were
		// trying to go to when they were redirected. This allows us to send them
		// along to that page after they login, which is a nicer user experience.
		return <Navigate to='/login' state={{ from: location }} replace />;
	}

	return <Outlet />;
};

/**
 * 2. RequireSubscription
 * Ensures the user has a specific plan level or higher.
 * Hierarchy: starter < pro < business < enterprise
 */
interface RequireSubscriptionProps {
	requiredPlan:
		| "hobby"
		| "starter"
		| "starter_plus"
		| "pro"
		| "pro_plus"
		| "business"
		| "business_plus"
		| "agency"
		| "enterprise";
}

const PLAN_WEIGHTS = {
	free: 0,
	hobby: 1,
	starter: 2,
	starter_plus: 3,
	pro: 4,
	pro_plus: 5,
	business: 6,
	business_plus: 7,
	agency: 8,
	enterprise: 9,
};

export const RequireSubscription: React.FC<RequireSubscriptionProps> = ({
	requiredPlan,
}) => {
	const { user } = useAuth();
	const { subscription } = useDashboard();
	const location = useLocation();

	if (!user) return <Navigate to='/login' state={{ from: location }} replace />;

	const currentPlan = subscription?.planName?.toLowerCase() || "starter";
	const userPlanWeight =
		PLAN_WEIGHTS[currentPlan as keyof typeof PLAN_WEIGHTS] || 0;
	const requiredWeight = PLAN_WEIGHTS[requiredPlan];

	if (userPlanWeight < requiredWeight) {
		// User does not have access.
		// In a real app, this might redirect to a specific "Upgrade" page or render a Lock UI.
		return (
			<div className='min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4'>
				<div className='bg-white p-8 rounded-2xl shadow-xl max-w-md text-center border border-slate-100'>
					<div className='w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6'>
						<Lock className='w-8 h-8' />
					</div>
					<h2 className='text-2xl font-bold text-slate-900 mb-2'>
						Upgrade Required
					</h2>
					<p className='text-slate-600 mb-6'>
						The feature <strong>{location.pathname}</strong> requires the{" "}
						<span className='font-bold capitalize text-indigo-600'>
							{requiredPlan}
						</span>{" "}
						plan or higher. You are currently on the{" "}
						<span className='font-bold capitalize'>{currentPlan}</span> plan.
					</p>
					<div className='flex gap-4 justify-center'>
						<a
							href='/#/dashboard'
							className='px-4 py-2 text-slate-600 font-medium hover:text-slate-900'>
							Back to Dashboard
						</a>
						<a
							href='/#/settings?tab=billing'
							className='px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2'>
							Upgrade Now <ArrowRight className='w-4 h-4' />
						</a>
					</div>
				</div>
			</div>
		);
	}

	return <Outlet />;
};

/**
 * 3. RequireAdmin
 * Ensures the user has admin role. If not, redirects to dashboard.
 */
export const RequireAdmin: React.FC = () => {
	const { user, isLoading } = useAuth();
	const location = useLocation();

	if (isLoading) {
		return (
			<div className='p-10 text-center text-slate-500'>
				Checking permissions...
			</div>
		);
	}

	if (!user) {
		return <Navigate to='/login' state={{ from: location }} replace />;
	}

	// Check if user has admin role
	const isAdmin = user.roles?.includes("admin") || false;

	if (!isAdmin) {
		return (
			<div className='min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4'>
				<div className='bg-white p-8 rounded-2xl shadow-xl max-w-md text-center border border-slate-100'>
					<div className='w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6'>
						<Lock className='w-8 h-8' />
					</div>
					<h2 className='text-2xl font-bold text-slate-900 mb-2'>
						Access Denied
					</h2>
					<p className='text-slate-600 mb-6'>
						You do not have permission to access{" "}
						<strong>{location.pathname}</strong>. This area is restricted to
						administrators only.
					</p>
					<div className='flex gap-4 justify-center'>
						<a
							href='/dashboard'
							className='px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2'>
							Back to Dashboard <ArrowRight className='w-4 h-4' />
						</a>
					</div>
				</div>
			</div>
		);
	}

	return <Outlet />;
};
