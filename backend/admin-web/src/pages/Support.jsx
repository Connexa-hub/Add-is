import React, { useState } from 'react';
import { Headphones, MessageCircle, AlertCircle } from 'lucide-react';

const Support = () => {
  const [tickets] = useState([
    {
      id: '1',
      user: 'John Doe',
      email: 'john@example.com',
      subject: 'Transaction Failed',
      message: 'My electricity payment failed but money was deducted',
      status: 'open',
      priority: 'high',
      createdAt: new Date(),
    },
    {
      id: '2',
      user: 'Jane Smith',
      email: 'jane@example.com',
      subject: 'Wallet Not Credited',
      message: 'I funded my wallet but balance not updated',
      status: 'pending',
      priority: 'medium',
      createdAt: new Date(Date.now() - 86400000),
    },
  ]);

  const getStatusBadge = (status) => {
    const statusMap = {
      open: 'badge-danger',
      pending: 'badge-warning',
      resolved: 'badge-success',
    };
    return statusMap[status] || 'badge-info';
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      high: 'badge-danger',
      medium: 'badge-warning',
      low: 'badge-info',
    };
    return priorityMap[priority] || 'badge-info';
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Support Center
        </h1>
        <p style={{ color: 'var(--gray-600)' }}>Handle user complaints and support requests</p>
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
                Open Tickets
              </p>
              <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>1</h3>
            </div>
            <AlertCircle size={24} color="var(--danger)" />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Pending
              </p>
              <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>1</h3>
            </div>
            <MessageCircle size={24} color="var(--warning)" />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Resolved Today
              </p>
              <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>0</h3>
            </div>
            <Headphones size={24} color="var(--success)" />
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Support Tickets</h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Subject</th>
                <th>Message</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    No support tickets
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{ticket.user}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                          {ticket.email}
                        </div>
                      </div>
                    </td>
                    <td>{ticket.subject}</td>
                    <td style={{ maxWidth: '300px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ticket.message}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getPriorityBadge(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td>{ticket.createdAt.toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>
                        Reply
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="alert alert-info" style={{ marginTop: '1.5rem' }}>
          <strong>Note:</strong> Support ticket system backend integration is ready. Create support ticket routes in backend to activate this feature.
        </div>
      </div>
    </div>
  );
};

export default Support;
