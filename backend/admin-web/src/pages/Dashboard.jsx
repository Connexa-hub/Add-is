import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Users,
  Wallet,
  TrendingUp,
  Activity,
  DollarSign,
  RefreshCw,
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await api.get('/admin/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} size={48} />
          <p style={{ color: 'var(--gray-600)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: '#2BE2FA',
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: '#10B981',
    },
    {
      title: 'Total Transactions',
      value: stats?.totalTransactions || 0,
      icon: Activity,
      color: '#F59E0B',
    },
    {
      title: 'Active Users (30d)',
      value: stats?.activeUsers || 0,
      icon: TrendingUp,
      color: '#3B82F6',
    },
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
            Dashboard Overview
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>Welcome back! Here's what's happening today.</p>
        </div>
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="btn btn-secondary"
        >
          <RefreshCw size={18} style={{ marginRight: '0.5rem' }} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                background: `linear-gradient(135deg, ${stat.color}, ${stat.color}dd)`,
                padding: '0.75rem',
                borderRadius: '12px',
                boxShadow: `0 4px 12px ${stat.color}40`
              }}>
                <stat.icon style={{ color: 'white' }} size={24} />
              </div>
            </div>
            <p className="stat-label">{stat.title}</p>
            <p className="stat-value">{stat.value}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem' }} className="card">
        <div className="card-header">
          <h2 className="card-title">Quick Stats</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Today's Transactions</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--gray-900)' }}>
              {stats?.todayTransactions || 0}
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Today's Revenue</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--gray-900)' }}>
              {formatCurrency(stats?.todayRevenue || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
