import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Users, CreditCard, DollarSign, TrendingUp, Activity } from 'lucide-react';

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

  const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            {title}
          </p>
          <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            {value}
          </h3>
          {subtitle && (
            <p style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>{subtitle}</p>
          )}
        </div>
        <div
          style={{
            backgroundColor: color || 'var(--primary)',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            opacity: 0.1,
          }}
        >
          <Icon size={24} style={{ color: color || 'var(--primary)' }} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {error}
        <button onClick={fetchData} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Dashboard Overview
        </h1>
        <p style={{ color: 'var(--gray-600)' }}>Welcome back! Here's what's happening today.</p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <StatCard
          icon={Users}
          title="Total Users"
          value={stats?.totalUsers || 0}
          subtitle={`${stats?.activeUsers || 0} active this month`}
          color="var(--primary)"
        />
        <StatCard
          icon={CreditCard}
          title="Total Transactions"
          value={stats?.totalTransactions || 0}
          subtitle={`${stats?.todayTransactions || 0} today`}
          color="var(--success)"
        />
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value={`₦${(stats?.totalRevenue || 0).toLocaleString()}`}
          subtitle={`₦${(stats?.todayRevenue || 0).toLocaleString()} today`}
          color="var(--warning)"
        />
        <StatCard
          icon={TrendingUp}
          title="Active Users"
          value={stats?.activeUsers || 0}
          subtitle="Last 30 days"
          color="var(--danger)"
        />
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          <Activity size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          Recent Activity
        </h2>
        <div style={{ overflowX: 'auto' }}>
          {analytics?.dailyStats && analytics.dailyStats.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transactions</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.dailyStats.map((stat, index) => (
                  <tr key={index}>
                    <td>{stat._id}</td>
                    <td>{stat.transactions}</td>
                    <td>₦{stat.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
              No activity data available
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
