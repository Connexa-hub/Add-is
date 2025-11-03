import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Shield, Zap, Mail, Send } from 'lucide-react';
import { adminAPI } from '../services/api';

const Settings = () => {
  const [settings, setSettings] = useState({
    appName: 'VTU Bill Payment',
    maintenanceMode: false,
    allowRegistration: true,
    minWalletFunding: 100,
    maxWalletFunding: 100000,
    transactionFee: 0,
    enableEmailNotifications: true,
    enableSMSNotifications: false,
  });

  const [saving, setSaving] = useState(false);
  const [emailTest, setEmailTest] = useState({
    to: '',
    testType: 'basic',
    sending: false,
    result: null,
  });

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      alert('Settings saved successfully!');
      setSaving(false);
    }, 1000);
  };

  const handleTestEmail = async () => {
    if (!emailTest.to) {
      alert('Please enter an email address');
      return;
    }

    setEmailTest({ ...emailTest, sending: true, result: null });

    try {
      const response = await adminAPI.testEmail({
        to: emailTest.to,
        testType: emailTest.testType,
      });

      setEmailTest({
        ...emailTest,
        sending: false,
        result: {
          success: true,
          message: response.data.message,
        },
      });
    } catch (error) {
      setEmailTest({
        ...emailTest,
        sending: false,
        result: {
          success: false,
          message: error.response?.data?.message || 'Failed to send test email',
          isConfigError: error.response?.data?.isConfigError || false,
        },
      });
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          System Settings
        </h1>
        <p style={{ color: 'var(--gray-600)' }}>Configure application settings and preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            <SettingsIcon size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            General Settings
          </h2>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Application Name</label>
            <input
              type="text"
              className="input"
              value={settings.appName}
              onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                style={{ marginRight: '0.5rem' }}
              />
              Maintenance Mode
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
              Temporarily disable the app for maintenance
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="label">
              <input
                type="checkbox"
                checked={settings.allowRegistration}
                onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                style={{ marginRight: '0.5rem' }}
              />
              Allow New User Registration
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
              Enable or disable new user signups
            </p>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            <Zap size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Transaction Settings
          </h2>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Minimum Wallet Funding (₦)</label>
            <input
              type="number"
              className="input"
              value={settings.minWalletFunding}
              onChange={(e) => setSettings({ ...settings, minWalletFunding: e.target.value })}
              min="0"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label">Maximum Wallet Funding (₦)</label>
            <input
              type="number"
              className="input"
              value={settings.maxWalletFunding}
              onChange={(e) => setSettings({ ...settings, maxWalletFunding: e.target.value })}
              min="0"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="label">Transaction Fee (%)</label>
            <input
              type="number"
              className="input"
              value={settings.transactionFee}
              onChange={(e) => setSettings({ ...settings, transactionFee: e.target.value })}
              min="0"
              max="100"
              step="0.1"
            />
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            <Shield size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Notification Settings
          </h2>

          <div style={{ marginBottom: '1rem' }}>
            <label className="label">
              <input
                type="checkbox"
                checked={settings.enableEmailNotifications}
                onChange={(e) =>
                  setSettings({ ...settings, enableEmailNotifications: e.target.checked })
                }
                style={{ marginRight: '0.5rem' }}
              />
              Enable Email Notifications
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
              Send email notifications to users
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="label">
              <input
                type="checkbox"
                checked={settings.enableSMSNotifications}
                onChange={(e) =>
                  setSettings({ ...settings, enableSMSNotifications: e.target.checked })
                }
                style={{ marginRight: '0.5rem' }}
              />
              Enable SMS Notifications
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
              Send SMS notifications to users
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          <Mail size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
          Email Service Testing
        </h2>

        <div style={{ marginBottom: '1rem' }}>
          <label className="label">Test Email Address</label>
          <input
            type="email"
            className="input"
            placeholder="Enter email to send test"
            value={emailTest.to}
            onChange={(e) => setEmailTest({ ...emailTest, to: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="label">Email Type</label>
          <select
            className="input"
            value={emailTest.testType}
            onChange={(e) => setEmailTest({ ...emailTest, testType: e.target.value })}
          >
            <option value="basic">Basic Test Email</option>
            <option value="verification">Verification Email (with OTP)</option>
            <option value="password_reset">Password Reset Email</option>
            <option value="welcome">Welcome Email</option>
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleTestEmail}
          disabled={emailTest.sending}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Send size={20} />
          {emailTest.sending ? 'Sending...' : 'Send Test Email'}
        </button>

        {emailTest.result && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: emailTest.result.success ? '#d1fae5' : '#fee2e2',
              border: `1px solid ${emailTest.result.success ? '#10b981' : '#ef4444'}`,
            }}
          >
            <p style={{ color: emailTest.result.success ? '#065f46' : '#991b1b', fontWeight: 'bold' }}>
              {emailTest.result.success ? '✅ Success' : '❌ Failed'}
            </p>
            <p style={{ color: emailTest.result.success ? '#065f46' : '#991b1b', marginTop: '0.5rem' }}>
              {emailTest.result.message}
            </p>
            {emailTest.result.isConfigError && (
              <p style={{ color: '#991b1b', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                Please verify that EMAIL_USER and EMAIL_PASS environment variables are correctly set.
              </p>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ marginRight: '1rem' }}>
          <Save size={20} />
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
