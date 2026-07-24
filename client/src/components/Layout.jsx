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

  const SidebarContent = () => (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <ArrowRightLeft className="w-5 h-5 text-white" />
          </div>
          Nexpay
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
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
      <div className="p-4 border-t border-dark-800">
        <div className="flex items-center px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-sm font-bold text-white mr-3 uppercase">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-dark-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center px-4 py-2 text-sm font-medium text-danger-500 rounded-lg hover:bg-danger-500/10 transition-colors"
        >
          <LogOut className="mr-3 w-5 h-5" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Mobile sidebar backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-900 border-r border-dark-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center justify-between p-4 bg-dark-900 border-b border-dark-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg">Nexpay</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-md text-dark-400 hover:text-white hover:bg-dark-800"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
