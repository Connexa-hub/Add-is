import React, { useState } from 'react';
import { adminAPI } from '../services/api';
import { Send, Image, Bell } from 'lucide-react';

const Messages = () => {
  const [message, setMessage] = useState({
    title: '',
    message: '',
    type: 'info',
    actionType: 'system',
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.title || !message.message) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSending(true);
      setError('');
      setSuccess('');

      await adminAPI.broadcastNotification(message);

      setSuccess('Message sent successfully to all users!');
      setMessage({
        title: '',
        message: '',
        type: 'info',
        actionType: 'system',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const messageTemplates = [
    {
      title: 'Maintenance Notice',
      message: 'We will be performing scheduled maintenance on [DATE]. Services may be temporarily unavailable.',
      type: 'warning',
      actionType: 'system',
    },
    {
      title: 'Special Promotion',
      message: 'Get 5% cashback on all data purchases this week! Don\'t miss out on this limited-time offer.',
      type: 'promotion',
      actionType: 'promotion',
    },
    {
      title: 'Service Update',
      message: 'We\'ve added new features to make your experience better! Check out the latest updates.',
      type: 'info',
      actionType: 'system',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Send Messages
        </h1>
        <p style={{ color: 'var(--gray-600)' }}>
          Send announcements, promotions, and notifications to all users
        </p>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div>
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              <Bell size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Compose Message
            </h2>

            <form onSubmit={handleSendMessage}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Message Title</label>
                <input
                  type="text"
                  className="input"
                  value={message.title}
                  onChange={(e) => setMessage({ ...message, title: e.target.value })}
                  placeholder="Enter message title..."
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Message Content</label>
                <textarea
                  className="input"
                  value={message.message}
                  onChange={(e) => setMessage({ ...message, message: e.target.value })}
                  placeholder="Enter your message..."
                  rows="6"
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Message Type</label>
                <select
                  className="input"
                  value={message.type}
                  onChange={(e) => setMessage({ ...message, type: e.target.value })}
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="promotion">Promotion</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Action Type</label>
                <select
                  className="input"
                  value={message.actionType}
                  onChange={(e) => setMessage({ ...message, actionType: e.target.value })}
                >
                  <option value="system">System</option>
                  <option value="promotion">Promotion</option>
                  <option value="cashback">Cashback</option>
                  <option value="wallet">Wallet</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" disabled={sending} style={{ width: '100%' }}>
                <Send size={20} />
                {sending ? 'Sending...' : 'Send to All Users'}
              </button>
            </form>
          </div>
        </div>

        <div>
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              Message Templates
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messageTemplates.map((template, index) => (
                <div
                  key={index}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    border: '1px solid var(--gray-200)',
                    padding: '1rem',
                  }}
                  onClick={() => setMessage(template)}
                >
                  <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{template.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                    {template.message}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className={`badge badge-${template.type === 'promotion' ? 'success' : 'info'}`}>
                      {template.type}
                    </span>
                    <span className="badge badge-info">{template.actionType}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
