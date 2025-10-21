import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  MessageSquare,
  Headphones,
  Gift,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Building2,
  Activity,
  Shield,
  Image,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Users', path: '/users' },
    { icon: Shield, label: 'KYC Management', path: '/kyc' },
    { icon: Image, label: 'Banners', path: '/banners' },
    { icon: ShoppingBag, label: 'VTU Products', path: '/vtu-products' },
    { icon: Activity, label: 'Transactions', path: '/transactions' },
    { icon: Wallet, label: 'Payment Integration', path: '/vtpass-wallet' },
    { icon: TrendingUp, label: 'Reconciliation', path: '/reconciliation' },
    { icon: Gift, label: 'Cashback', path: '/cashback' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: Headphones, label: 'Support', path: '/support' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <div className="flex items-center gap-3">
                <img 
                  src="/splash-icon.png" 
                  alt="Logo" 
                  className="w-10 h-10 object-contain"
                />
                <div>
                  <p className="text-xs text-gray-400">Admin Portal</p>
                </div>
              </div>
            ) : (
              <img 
                src="/splash-icon.png" 
                alt="Logo" 
                className="w-10 h-10 object-contain mx-auto"
              />
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors lg:block hidden"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    location.pathname === item.path
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-cyan-400'
                  }`}
                >
                  <item.icon size={20} />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 w-full transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
              >
                <Menu size={24} />
              </button>

              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search users, transactions..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const searchTerm = e.currentTarget.value;
                      if (searchTerm.includes('@')) {
                        navigate(`/users?search=${searchTerm}`);
                      } else {
                        navigate(`/transactions?search=${searchTerm}`);
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => navigate('/messages')}
                title="Notifications"
              >
                <Bell size={24} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                    A
                  </div>
                  <ChevronDown size={16} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}