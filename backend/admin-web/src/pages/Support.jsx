import React, { useState, useEffect } from 'react';
import { Headphones, MessageCircle, AlertCircle } from 'lucide-react';
import { supportAPI } from '../services/api';

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    open: 0,
    pending: 0,
    resolvedToday: 0
  });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await supportAPI.getTickets();
      if (response.data.success) {
        const ticketData = response.data.data || [];
        
        // Transform tickets to match UI format
        const formattedTickets = ticketData.map(ticket => ({
          id: ticket._id,
          user: ticket.userId?.name || 'Unknown User',
          email: ticket.userId?.email || 'N/A',
          subject: ticket.subject,
          message: ticket.message,
          priority: ticket.priority || 'medium',
          status: ticket.status,
          createdAt: new Date(ticket.createdAt)
        }));
        
        setTickets(formattedTickets);
        
        // Calculate stats
        const newStats = {
          open: formattedTickets.filter(t => t.status === 'open').length,
          pending: formattedTickets.filter(t => t.status === 'pending').length,
          resolvedToday: formattedTickets.filter(t => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return t.status === 'resolved' && new Date(t.createdAt) >= today;
          }).length
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      setError(error.response?.data?.message || 'Failed to load support tickets. Please try again later.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleReply = async (ticketId) => {
    if (!replyText.trim()) return;
    
    try {
      setReplyLoading(true);
      await supportAPI.replyToTicket(ticketId, replyText);
      setReplyText('');
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      console.error('Reply error:', error);
      setError('Failed to send reply');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      await supportAPI.updateTicketStatus(ticketId, newStatus);
      fetchTickets();
    } catch (error) {
      console.error('Status update error:', error);
      setError('Failed to update status');
    }
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
              <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{stats.open}</h3>
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
              <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{stats.pending}</h3>
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
              <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>{stats.resolvedToday}</h3>
            </div>
            <Headphones size={24} color="var(--success)" />
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Support Tickets</h2>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

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
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    Loading support tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
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
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {ticket.status === 'open' && (
                          <button 
                            className="btn btn-warning" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                            onClick={() => handleStatusUpdate(ticket.id, 'pending')}
                          >
                            Mark Pending
                          </button>
                        )}
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          Reply
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selectedTicket && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="card" style={{ maxWidth: '600px', width: '90%', padding: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Reply to: {selectedTicket.subject}</h3>
              <p style={{ marginBottom: '1rem', color: 'var(--gray-600)' }}>
                From: {selectedTicket.user} ({selectedTicket.email})
              </p>
              <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: '8px' }}>
                <strong>Original Message:</strong>
                <p style={{ marginTop: '0.5rem' }}>{selectedTicket.message}</p>
              </div>
              <div className="input-group">
                <label className="input-label">Your Response</label>
                <textarea
                  className="input-field"
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response here..."
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleReply(selectedTicket.id)}
                  disabled={replyLoading || !replyText.trim()}
                >
                  {replyLoading ? 'Sending...' : 'Send Reply & Resolve'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedTicket(null);
                    setReplyText('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Support;
