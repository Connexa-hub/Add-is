import React, { useState } from 'react';
import { Gift, TrendingUp, Users, DollarSign } from 'lucide-react';

const Cashback = () => {
  const [settings, setSettings] = useState({
    dataPercentage: 5,
    electricityPercentage: 2,
    tvPercentage: 3,
    minimumTransaction: 500,
    enabled: true,
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setTimeout(() => {
      alert('Cashback settings updated successfully!');
      setSaving(false);
    }, 1000);
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Cashback Management
        </h1>
        <p style={{ color: 'var(--gray-600)' }}>Configure cashback rewards and view analytics</p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Total Cashback Paid
              </p>
              <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>₦0</h3>
            </div>
            <DollarSign size={24} color="var(--success)" />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Active Users
              </p>
              <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>0</h3>
            </div>
            <Users size={24} color="var(--primary)" />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                This Month
              </p>
              <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>₦0</h3>
            </div>
            <TrendingUp size={24} color="var(--warning)" />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            <Gift size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Cashback Settings
          </h2>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label">
              Cashback Status
              <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                {settings.enabled ? '(Enabled)' : '(Disabled)'}
              </span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                style={{ width: '20px', height: '20px' }}
              />
              Enable cashback rewards
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Data Purchase Cashback (%)</label>
            <input
              type="number"
              className="input"
              value={settings.dataPercentage}
              onChange={(e) => setSettings({ ...settings, dataPercentage: e.target.value })}
              min="0"
              max="100"
              step="0.1"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Electricity Payment Cashback (%)</label>
            <input
              type="number"
              className="input"
              value={settings.electricityPercentage}
              onChange={(e) => setSettings({ ...settings, electricityPercentage: e.target.value })}
              min="0"
              max="100"
              step="0.1"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label">TV Subscription Cashback (%)</label>
            <input
              type="number"
              className="input"
              value={settings.tvPercentage}
              onChange={(e) => setSettings({ ...settings, tvPercentage: e.target.value })}
              min="0"
              max="100"
              step="0.1"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="label">Minimum Transaction Amount (₦)</label>
            <input
              type="number"
              className="input"
              value={settings.minimumTransaction}
              onChange={(e) => setSettings({ ...settings, minimumTransaction: e.target.value })}
              min="0"
              step="100"
            />
          </div>

          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ width: '100%' }}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          <div className="alert alert-info" style={{ marginTop: '1rem' }}>
            <strong>Note:</strong> Cashback will be automatically credited to users' wallets after successful transactions.
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            Recent Cashback Transactions
          </h2>

          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
            <Gift size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p>No cashback transactions yet</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Cashback will appear here once users make eligible purchases
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cashback;
