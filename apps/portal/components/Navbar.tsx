import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Box, Menu, X, ChevronDown, 
  Layout, Server, Shield, Activity, 
  FileText, Code, Users, LogOut, User, Settings
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Handle scroll effect for border/blur
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavDropdown = ({ label, items }: { label: string, items: { name: string, to: string, icon?: any }[] }) => (
    <div className="relative group">
      <button className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-indigo-600 py-2 transition-colors">
        {label}
        <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
      </button>
      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[200px]">
        <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-2 overflow-hidden">
          {items.map((item) => (
            <Link 
              key={item.name} 
              to={item.to}
              className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {item.icon && <item.icon className="w-4 h-4 text-slate-400" />}
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-slate-200' : 'bg-white border-b border-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Box className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">WPCube</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <NavDropdown 
              label="Product" 
              items={[
                { name: 'Features', to: '/features', icon: Layout },
                { name: 'Pricing', to: '/pricing', icon: Server },
                { name: 'Enterprise', to: '/enterprise', icon: Shield },
                { name: 'Changelog', to: '/changelog', icon: Activity },
              ]} 
            />
            <NavDropdown 
              label="Resources" 
              items={[
                { name: 'Documentation', to: '/docs', icon: FileText },
                { name: 'API Reference', to: '/api-reference', icon: Code },
                { name: 'System Status', to: '/status', icon: Activity },
                { name: 'Community', to: '/community', icon: Users },
              ]} 
            />
            <Link to="/about" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Company</Link>
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link 
                  to="/dashboard"
                  className="text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  Dashboard
                </Link>
                
                {/* User Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-200 uppercase">
                      {user?.name ? user.name.substring(0, 2) : 'ME'}
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)}></div>
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="px-4 py-3 border-b border-slate-100">
                          <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                        <div className="py-1">
                          <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600">
                            <User className="w-4 h-4" /> Profile
                          </Link>
                          <Link to="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600">
                            <Settings className="w-4 h-4" /> Settings
                          </Link>
                        </div>
                        <div className="border-t border-slate-100 py-1">
                          <button 
                            onClick={handleLogout}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <LogOut className="w-4 h-4" /> Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link 
                  to="/login"
                  className="text-sm font-medium text-slate-700 hover:text-slate-900 px-4 py-2"
                >
                  Log in
                </Link>
                <Link 
                  to="/signup"
                  className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-all shadow-md shadow-slate-200 hover:shadow-slate-300 hover:-translate-y-0.5"
                >
                  Start Free Trial
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 absolute w-full left-0 shadow-lg max-h-[calc(100vh-64px)] overflow-y-auto">
          <div className="p-4 space-y-6">
            
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Product</h3>
              <Link to="/features" className="block text-slate-600 font-medium pl-2 border-l-2 border-transparent hover:border-indigo-600 hover:text-indigo-600 transition-all" onClick={() => setMobileMenuOpen(false)}>Features</Link>
              <Link to="/pricing" className="block text-slate-600 font-medium pl-2 border-l-2 border-transparent hover:border-indigo-600 hover:text-indigo-600 transition-all" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link to="/enterprise" className="block text-slate-600 font-medium pl-2 border-l-2 border-transparent hover:border-indigo-600 hover:text-indigo-600 transition-all" onClick={() => setMobileMenuOpen(false)}>Enterprise</Link>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resources</h3>
              <Link to="/docs" className="block text-slate-600 font-medium pl-2 border-l-2 border-transparent hover:border-indigo-600 hover:text-indigo-600 transition-all" onClick={() => setMobileMenuOpen(false)}>Documentation</Link>
              <Link to="/status" className="block text-slate-600 font-medium pl-2 border-l-2 border-transparent hover:border-indigo-600 hover:text-indigo-600 transition-all" onClick={() => setMobileMenuOpen(false)}>System Status</Link>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 px-2 mb-2">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm border border-indigo-200 uppercase">
                      {user?.name ? user.name.substring(0, 2) : 'ME'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                  </div>
                  <Link to="/dashboard" className="w-full py-3 text-center bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    Go to Dashboard
                  </Link>
                  <button onClick={handleLogout} className="w-full py-3 text-center text-red-600 font-medium bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="w-full py-3 text-center text-slate-700 font-medium bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
                  <Link to="/signup" className="w-full py-3 text-center bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors" onClick={() => setMobileMenuOpen(false)}>Start Free Trial</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};