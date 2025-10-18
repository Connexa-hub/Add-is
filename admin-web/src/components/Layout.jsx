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
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: sidebarOpen ? '250px' : '0',
          backgroundColor: 'var(--gray-800)',
          color: 'white',
          transition: 'width 0.3s',
          position: 'fixed',
          height: '100vh',
          overflowY: 'auto',
          zIndex: 100,
        }}
      >
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>VTU Admin</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: sidebarOpen ? 'block' : 'none',
              }}
            >
              <X size={24} />
            </button>
          </div>

          <nav>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    marginBottom: '0.5rem',
                    borderRadius: '0.375rem',
                    textDecoration: 'none',
                    color: 'white',
                    backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              marginTop: '2rem',
              borderRadius: '0.375rem',
              background: 'var(--danger)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div
        style={{
          flex: 1,
          marginLeft: sidebarOpen ? '250px' : '0',
          transition: 'margin-left 0.3s',
        }}
      >
        <header
          style={{
            backgroundColor: 'white',
            borderBottom: '1px solid var(--gray-200)',
            padding: '1rem 1.5rem',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
              }}
            >
              <Menu size={24} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.name || 'Admin'}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        <main style={{ padding: '1.5rem' }}>{children}</main>
      </div>
    </div>
  );
};

export default Layout;
