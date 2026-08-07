import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ArrowRightLeft, Users, ShieldAlert, LogOut, Menu, X } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['user', 'admin', 'auditor'] },
    { name: 'Admin Panel', path: '/admin', icon: Users, roles: ['admin'] },
    { name: 'Audit Log', path: '/audit', icon: ShieldAlert, roles: ['admin', 'auditor'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role || 'user'));

  return (
    <div className="h-screen overflow-hidden bg-dark-950 flex flex-col">
      {/* Top Navbar */}
      <header className="flex-shrink-0 bg-dark-900 border-b border-dark-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left side: Logo and Desktop Nav */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center gap-2 mr-8">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white text-lg tracking-tight">Nexpay</span>
              </div>
              <nav className="hidden lg:flex lg:space-x-1 lg:items-center">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-primary-600/10 text-primary-500'
                            : 'text-dark-400 hover:bg-dark-800 hover:text-dark-100'
                        }`
                      }
                    >
                      <Icon className="mr-2 w-4 h-4" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Right side: User Profile & Actions (Desktop) */}
            <div className="hidden lg:flex lg:items-center lg:space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-sm font-bold text-white mr-3 uppercase">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white leading-tight">{user?.name}</span>
                  <span className="text-xs text-dark-400 leading-tight">{user?.email}</span>
                </div>
              </div>
              <div className="w-px h-6 bg-dark-800 mx-2"></div>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm font-medium text-danger-500 rounded-md hover:bg-danger-500/10 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-dark-400 hover:text-white hover:bg-dark-800 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 z-40 bg-dark-900 border-b border-dark-800 shadow-xl flex flex-col">
          <nav className="px-2 pt-2 pb-3 space-y-1">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-3 text-base font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary-600/10 text-primary-500'
                        : 'text-dark-400 hover:bg-dark-800 hover:text-dark-100'
                    }`
                  }
                >
                  <Icon className="mr-3 w-5 h-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
          <div className="pt-4 pb-3 border-t border-dark-800">
            <div className="flex items-center px-5 mb-3">
              <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-base font-bold text-white mr-3 uppercase">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-white truncate">{user?.name}</p>
                <p className="text-sm text-dark-400 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="px-2">
              <button
                onClick={handleLogout}
                className="flex w-full items-center px-3 py-3 text-base font-medium text-danger-500 rounded-md hover:bg-danger-500/10 transition-colors"
              >
                <LogOut className="mr-3 w-5 h-5" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu backdrop (transparent but captures clicks to close menu) */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 top-16 z-30 bg-black/50 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto relative z-0">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
