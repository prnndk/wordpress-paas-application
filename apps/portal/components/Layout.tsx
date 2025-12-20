import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Plus, LogOut, Box } from 'lucide-react';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('wpcube_auth');
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <div 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => navigate('/dashboard')}
              >
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
                  <Box className="w-5 h-5" />
                </div>
                <span className="font-bold text-xl text-gray-900 tracking-tight">WPCube</span>
              </div>
              
              <nav className="hidden md:flex space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard') 
                      ? 'bg-brand-50 text-brand-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </span>
                </button>
                <button
                  onClick={() => navigate('/create')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/create') 
                      ? 'bg-brand-50 text-brand-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Instance
                  </span>
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-medium text-sm">
                  JD
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">John Doe</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};