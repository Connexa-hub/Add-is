
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
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/users', label: 'Users', icon: Users },
    { path: '/transactions', label: 'Transactions', icon: CreditCard },
    { path: '/messages', label: 'Messages', icon: MessageSquare },
    { path: '/support', label: 'Support', icon: Headphones },
    { path: '/cashback', label: 'Cashback', icon: Gift },
    { path: '/vtpass-wallet', label: 'VTPass Wallet', icon: Wallet },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? '280px' : '0',
          backgroundColor: 'white',
          borderRight: '1px solid var(--gray-200)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'fixed',
          height: '100vh',
          overflowY: 'auto',
          zIndex: 100,
          boxShadow: sidebarOpen ? 'var(--shadow-lg)' : 'none',
        }}
      >
        <div style={{ padding: '1.5rem' }}>
          {/* Logo */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--gray-200)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.25rem',
              }}>
                V
              </div>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--gray-900)' }}>
                  VTU Admin
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Management Portal</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--gray-500)',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: 'var(--radius)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                    padding: '0.875rem 1rem',
                    marginBottom: '0.25rem',
                    borderRadius: 'var(--radius)',
                    textDecoration: 'none',
                    color: isActive ? 'var(--primary)' : 'var(--gray-700)',
                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                    transition: 'all 0.2s',
                    fontWeight: isActive ? '600' : '500',
                    fontSize: '0.875rem',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '60%',
                      background: 'var(--primary)',
                      borderRadius: '0 3px 3px 0',
                    }} />
                  )}
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--gray-200)' }}>
            <button
              onClick={handleLogout}
              className="btn btn-danger"
              style={{
                width: '100%',
                justifyContent: 'center',
              }}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          marginLeft: sidebarOpen ? '280px' : '0',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <header
          style={{
            backgroundColor: 'white',
            borderBottom: '1px solid var(--gray-200)',
            padding: '1rem 1.5rem',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="btn btn-secondary btn-sm"
              >
                <Menu size={20} />
              </button>

              {/* Search Bar */}
              <div className="search-box" style={{ minWidth: '300px' }}>
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search users, transactions..."
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Notifications */}
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius)',
                  position: 'relative',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <Bell size={20} color="var(--gray-600)" />
                <span style={{
                  position: 'absolute',
                  top: '0.25rem',
                  right: '0.25rem',
                  width: '8px',
                  height: '8px',
                  background: 'var(--danger)',
                  borderRadius: '50%',
                  border: '2px solid white',
                }} />
              </button>

              {/* User Menu */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: 'none',
                    border: '1px solid var(--gray-200)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--gray-200)'}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                  }}>
                    {(user?.name || 'Admin').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-900)' }}>
                      {user?.name || 'Admin'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      {user?.email}
                    </p>
                  </div>
                  <ChevronDown size={16} color="var(--gray-500)" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ padding: '2rem' }}>{children}</main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && window.innerWidth < 768 && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99,
          }}
        />
      )}
    </div>
  );
};

export default Layout;
