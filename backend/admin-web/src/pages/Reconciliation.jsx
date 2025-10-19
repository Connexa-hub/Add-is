import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, RefreshCw, Download, CheckCircle, XCircle } from 'lucide-react';
import { adminAPI } from '../services/api';

const Reconciliation = () => {
  const [loading, setLoading] = useState(true);
  const [reconciliationData, setReconciliationData] = useState({
    totalUserWalletBalance: 0,
    totalFundedAmount: 0,
    totalSpentAmount: 0,
    monnifyBalance: 0,
    vtpassBalance: 0,
    platformProfit: 0,
    pendingTransactions: [],
    failedTransactions: []
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReconciliationData();
  }, [dateRange]);

  const fetchReconciliationData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.get('/admin/reconciliation', {
        params: dateRange
      });
      setReconciliationData(response.data.data);
    } catch (error) {
      console.error('Error fetching reconciliation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (transactionId, reason) => {
    try {
      await adminAPI.post(`/admin/transactions/${transactionId}/refund`, { reason });
      alert('Refund processed successfully');
      fetchReconciliationData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to process refund');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount || 0);
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Financial Reconciliation
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>Monitor balances, profits, and handle refunds</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => fetchReconciliationData()}
          disabled={loading}
        >
          <RefreshCw size={18} style={{ marginRight: '0.5rem' }} />
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              className="input"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              className="input"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
            <div>
              <p style={{ opacity: 0.9, fontSize: '0.875rem' }}>Platform Profit</p>
              <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                {formatCurrency(reconciliationData.platformProfit)}
              </h3>
            </div>
            <TrendingUp size={32} style={{ opacity: 0.8 }} />
          </div>
        </div>

        <div className="card">
          <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>Total User Wallets</p>
          <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            {formatCurrency(reconciliationData.totalUserWalletBalance)}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>
            Sum of all user balances
          </p>
        </div>

        <div className="card">
          <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>Monnify Balance</p>
          <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            {formatCurrency(reconciliationData.monnifyBalance)}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>
            Available in payment gateway
          </p>
        </div>

        <div className="card">
          <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>VTPass Balance</p>
          <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            {formatCurrency(reconciliationData.vtpassBalance)}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.5rem' }}>
            Available for bill payments
          </p>
        </div>
      </div>

      {/* Profit Breakdown */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Revenue Breakdown
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Total Funded</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
              {formatCurrency(reconciliationData.totalFundedAmount)}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Total Spent</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>
              {formatCurrency(reconciliationData.totalSpentAmount)}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Net Profit Margin</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              {reconciliationData.totalFundedAmount > 0
                ? ((reconciliationData.platformProfit / reconciliationData.totalFundedAmount) * 100).toFixed(2)
                : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Failed Transactions Requiring Action */}
      {reconciliationData.failedTransactions?.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertTriangle style={{ color: 'var(--danger)' }} size={20} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              Failed Transactions ({reconciliationData.failedTransactions.length})
            </h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reconciliationData.failedTransactions.map((txn) => (
                  <tr key={txn._id}>
                    <td>{txn.userId?.name || txn.userId?.email}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{txn.reference}</td>
                    <td>{formatCurrency(txn.amount)}</td>
                    <td>{txn.type}</td>
                    <td>{new Date(txn.createdAt).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-warning"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                        onClick={() => {
                          const reason = prompt('Enter refund reason:');
                          if (reason) handleRefund(txn._id, reason);
                        }}
                      >
                        Process Refund
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monnify Contact Info */}
      <div className="card" style={{ background: 'var(--gray-50)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Monnify Support Contact
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Email Support</p>
            <p style={{ fontWeight: '600' }}>support@monnify.com</p>
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Phone Support</p>
            <p style={{ fontWeight: '600' }}>+234 1 888 5551</p>
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Dashboard</p>
            <a href="https://app.monnify.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: '600' }}>
              app.monnify.com
            </a>
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Status Page</p>
            <a href="https://status.monnify.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: '600' }}>
              status.monnify.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reconciliation;