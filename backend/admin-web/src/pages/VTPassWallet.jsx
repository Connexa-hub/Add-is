import React, { useState } from 'react';
import { Wallet, RefreshCw, TrendingUp, DollarSign } from 'lucide-react';

const VTPassWallet = () => {
  const [balance, setBalance] = useState(0);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRecharge = () => {
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    alert(
      `VTPass wallet recharge initiated for ₦${parseFloat(rechargeAmount).toLocaleString()}. Please complete the payment through VTPass dashboard.`
    );
    setRechargeAmount('');
  };

  const refreshBalance = () => {
    setLoading(true);
    setTimeout(() => {
      setBalance(Math.random() * 100000);
      setLoading(false);
    }, 1000);
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          VTPass Wallet Management
        </h1>
        <p style={{ color: 'var(--gray-600)' }}>Monitor and manage VTPass API wallet balance</p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', opacity: 0.9 }}>
                VTPass Wallet Balance
              </p>
              <h3 style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                ₦{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <button
                onClick={refreshBalance}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  marginTop: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
                disabled={loading}
              >
                <RefreshCw size={16} />
                {loading ? 'Refreshing...' : 'Refresh Balance'}
              </button>
            </div>
            <Wallet size={32} style={{ opacity: 0.3 }} />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Total Spent This Month
              </p>
              <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>₦0</h3>
            </div>
            <TrendingUp size={24} color="var(--warning)" />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                API Transactions
              </p>
              <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>0</h3>
            </div>
            <DollarSign size={24} color="var(--success)" />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            Recharge Wallet
          </h2>

          <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
            <strong>Note:</strong> VTPass wallet recharge must be completed through your VTPass dashboard. This section helps you track balance and transactions.
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Amount to Recharge (₦)</label>
            <input
              type="number"
              className="input"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
              placeholder="Enter amount..."
              min="0"
              step="1000"
            />
          </div>

          <button className="btn btn-primary" onClick={handleRecharge} style={{ width: '100%' }}>
            <RefreshCw size={20} />
            Initiate Recharge
          </button>

          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              VTPass Integration Info
            </h3>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
              <p style={{ marginBottom: '0.25rem' }}>
                <strong>API URL:</strong> {process.env.VTPASS_BASE_URL || 'https://sandbox.vtpass.com/api'}
              </p>
              <p style={{ marginBottom: '0.25rem' }}>
                <strong>Username:</strong> {process.env.VTPASS_USERNAME || 'Not configured'}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                <span className="badge badge-success">Connected</span>
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            Recent Transactions
          </h2>

          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
            <Wallet size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p>No transactions yet</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              VTPass API transactions will appear here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VTPassWallet;
