
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  LayoutDashboard,
  Users,
  Wallet,
  TrendingUp,
  Activity,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [statsRes, analyticsRes, transactionsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/analytics'),
        api.get('/admin/transactions?limit=10'),
      ]);

      setStats(statsRes.data);
      setAnalytics(analyticsRes.data);
      setRecentTransactions(transactionsRes.data.transactions || []);
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <CheckCircle size={16} />;
      case 'pending':
        return <Clock size={16} />;
      case 'failed':
        return <AlertCircle size={16} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      gradient: 'from-cyan-400 to-blue-500',
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      change: '+8.2%',
      trend: 'up',
      icon: Users,
      gradient: 'from-purple-400 to-pink-500',
    },
    {
      title: 'Total Transactions',
      value: stats?.totalTransactions || 0,
      change: '+15.3%',
      trend: 'up',
      icon: Activity,
      gradient: 'from-green-400 to-emerald-500',
    },
    {
      title: 'Wallet Balance',
      value: formatCurrency(stats?.totalWalletBalance || 0),
      change: '+5.7%',
      trend: 'up',
      icon: Wallet,
      gradient: 'from-orange-400 to-red-500',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`bg-gradient-to-br ${stat.gradient} p-3 rounded-xl shadow-md`}>
                <stat.icon className="text-white" size={24} />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm font-semibold bg-green-50 px-3 py-1 rounded-full">
                <ArrowUpRight size={14} />
                <span>{stat.change}</span>
              </div>
            </div>
            <h3 className="text-gray-500 text-sm font-semibold mb-1 uppercase tracking-wide">{stat.title}</h3>
            <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div
          onClick={() => navigate('/users')}
          className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl p-6 text-white cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all"
        >
          <div className="bg-white bg-opacity-20 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <Users size={28} />
          </div>
          <h3 className="text-xl font-bold mb-2">Manage Users</h3>
          <p className="text-cyan-50 text-sm">View and manage all registered users</p>
        </div>

        <div
          onClick={() => navigate('/transactions')}
          className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl p-6 text-white cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all"
        >
          <div className="bg-white bg-opacity-20 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <Activity size={28} />
          </div>
          <h3 className="text-xl font-bold mb-2">Transactions</h3>
          <p className="text-purple-50 text-sm">Monitor all platform transactions</p>
        </div>

        <div
          onClick={() => navigate('/vtpass-wallet')}
          className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-6 text-white cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all"
        >
          <div className="bg-white bg-opacity-20 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <Wallet size={28} />
          </div>
          <h3 className="text-xl font-bold mb-2">Payment Integration</h3>
          <p className="text-green-50 text-sm">Check VTPass balance & fund wallet</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Recent Transactions</h2>
          <button
            onClick={() => navigate('/transactions')}
            className="text-cyan-500 hover:text-cyan-600 font-semibold text-sm flex items-center gap-1 bg-cyan-50 px-4 py-2 rounded-lg hover:bg-cyan-100 transition-colors"
          >
            <span>View All</span>
            <ArrowUpRight size={16} />
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">
                        {transaction.user?.name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-500">{transaction.user?.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-900">{transaction.category}</div>
                      <div className="text-xs text-gray-500">{transaction.type}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          transaction.status
                        )}`}
                      >
                        {getStatusIcon(transaction.status)}
                        {transaction.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(transaction.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <CreditCard className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 font-medium">No recent transactions</p>
            <p className="text-gray-500 text-sm mt-1">Transactions will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
