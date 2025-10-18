
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  ArrowUp, 
  ArrowDown,
  RefreshCw,
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, analyticsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getAnalytics(7),
      ]);

      setStats(statsRes.data.data);
      setAnalytics(analyticsRes.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, color }) => (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p className="stat-label">{title}</p>
          <h3 className="stat-value">{value}</h3>
          {subtitle && (
            <p style={{ color: 'var(--gray-500)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={`stat-change ${trend > 0 ? 'positive' : 'negative'}`}>
              {trend > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              <span>{Math.abs(trend)}% vs last month</span>
            </div>
          )}
        </div>
        <div
          style={{
            width: '60px',
            height: '60px',
            background: `linear-gradient(135deg, ${color}20, ${color}10)`,
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={28} style={{ color }} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div className="loading-spinner" style={{ width: '3rem', height: '3rem' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--gray-500)' }}>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <p style={{ marginBottom: '1rem' }}>{error}</p>
        <button onClick={fetchData} className="btn btn-primary">
          <RefreshCw size={18} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--gray-900)' }}>
            Dashboard Overview
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>
            Welcome back! Here's what's happening with your platform today.
          </p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary">
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          icon={Users}
          title="Total Users"
          value={(stats?.totalUsers || 0).toLocaleString()}
          subtitle={`${stats?.activeUsers || 0} active this month`}
          trend={12.5}
          color="var(--primary)"
        />
        <StatCard
          icon={CreditCard}
          title="Total Transactions"
          value={(stats?.totalTransactions || 0).toLocaleString()}
          subtitle={`${stats?.todayTransactions || 0} today`}
          trend={8.2}
          color="var(--success)"
        />
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value={`₦${(stats?.totalRevenue || 0).toLocaleString()}`}
          subtitle={`₦${(stats?.todayRevenue || 0).toLocaleString()} today`}
          trend={15.3}
          color="var(--warning)"
        />
        <StatCard
          icon={TrendingUp}
          title="Active Users"
          value={(stats?.activeUsers || 0).toLocaleString()}
          subtitle="Last 30 days"
          trend={5.7}
          color="var(--info)"
        />
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <Activity size={20} />
            Recent Activity
          </h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {analytics?.dailyStats && analytics.dailyStats.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transactions</th>
                  <th>Revenue</th>
                  <th>Growth</th>
                </tr>
              </thead>
              <tbody>
                {analytics.dailyStats.map((stat, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: '500' }}>{stat._id}</td>
                    <td>{stat.transactions.toLocaleString()}</td>
                    <td style={{ fontWeight: '600' }}>₦{stat.revenue.toLocaleString()}</td>
                    <td>
                      <span className="badge badge-success">
                        <ArrowUp size={12} style={{ display: 'inline' }} /> 12%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <Activity size={48} />
              <p style={{ marginTop: '1rem', fontSize: '1rem', fontWeight: '500' }}>
                No activity data available
              </p>
              <p style={{ fontSize: '0.875rem' }}>
                Start by adding some users or processing transactions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
