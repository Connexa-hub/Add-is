import React, { useState, useEffect, useRef } from 'react';
import { Headphones, MessageCircle, AlertCircle, Send } from 'lucide-react';
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
  const [ticketDetails, setTicketDetails] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const chatEndRef = useRef(null);

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

  const fetchTicketDetails = async (ticketId) => {
    try {
      const response = await supportAPI.getTicketDetails(ticketId);
      if (response.data.success) {
        setTicketDetails(response.data.data);
        setTimeout(() => {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      setError('Failed to load ticket details');
    }
  };

  const handleOpenTicket = async (ticket) => {
    setSelectedTicket(ticket);
    await fetchTicketDetails(ticket.id);
  };

  const handleReply = async (ticketId) => {
    if (!replyText.trim()) return;
    
    try {
      setReplyLoading(true);
      await supportAPI.addReply(ticketId, replyText);
      setReplyText('');
      await fetchTicketDetails(ticketId);
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
      if (selectedTicket && selectedTicket.id === ticketId) {
        await fetchTicketDetails(ticketId);
      }
    } catch (error) {
      console.error('Status update error:', error);
      setError('Failed to update status');
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                          onClick={() => handleOpenTicket(ticket)}
                        >
                          View Chat
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selectedTicket && ticketDetails && (
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
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div className="card" style={{ 
              maxWidth: '700px', 
              width: '100%', 
              height: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden'
            }}>
              <div style={{ 
                padding: '1.5rem', 
                borderBottom: '1px solid var(--gray-200)',
                backgroundColor: 'var(--gray-50)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>{ticketDetails.subject}</h3>
                    <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      From: {ticketDetails.userId?.name} ({ticketDetails.userId?.email})
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className={`badge ${getStatusBadge(ticketDetails.status)}`}>
                        {ticketDetails.status}
                      </span>
                      <span className={`badge ${getPriorityBadge(ticketDetails.priority)}`}>
                        {ticketDetails.priority} priority
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTicket(null);
                      setTicketDetails(null);
                      setReplyText('');
                    }}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      fontSize: '1.5rem', 
                      cursor: 'pointer',
                      color: 'var(--gray-500)'
                    }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  {ticketDetails.status !== 'resolved' && (
                    <button
                      className="btn btn-success"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      onClick={() => handleStatusUpdate(ticketDetails._id, 'resolved')}
                    >
                      Mark Resolved
                    </button>
                  )}
                  {ticketDetails.status === 'open' && (
                    <button
                      className="btn btn-warning"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      onClick={() => handleStatusUpdate(ticketDetails._id, 'pending')}
                    >
                      Mark Pending
                    </button>
                  )}
                </div>
              </div>

              <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '1.5rem',
                backgroundColor: '#f9fafb'
              }}>
                <div style={{ 
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong style={{ color: 'var(--primary)' }}>{ticketDetails.userId?.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      {formatTime(ticketDetails.createdAt)}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--gray-700)' }}>{ticketDetails.message}</p>
                </div>

                {ticketDetails.replies && ticketDetails.replies.length > 0 && ticketDetails.replies.map((reply, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: '1rem',
                      padding: '1rem',
                      backgroundColor: reply.isAdmin ? '#e0f2fe' : 'white',
                      borderRadius: '8px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      marginLeft: reply.isAdmin ? '0' : '1rem',
                      marginRight: reply.isAdmin ? '1rem' : '0'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ color: reply.isAdmin ? 'var(--primary)' : 'var(--gray-700)' }}>
                        {reply.isAdmin ? 'Support Team' : (reply.userId?.name || 'User')}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                        {formatTime(reply.createdAt)}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--gray-700)' }}>{reply.message}</p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div style={{ 
                padding: '1rem 1.5rem', 
                borderTop: '1px solid var(--gray-200)',
                backgroundColor: 'white'
              }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <textarea
                    className="input-field"
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleReply(ticketDetails._id);
                      }
                    }}
                    placeholder="Type your response..."
                    style={{ 
                      resize: 'none',
                      flex: 1,
                      marginBottom: 0
                    }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => handleReply(ticketDetails._id)}
                    disabled={replyLoading || !replyText.trim()}
                    style={{ 
                      padding: '0.75rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {replyLoading ? 'Sending...' : (
                      <>
                        <Send size={16} />
                        Send
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Support;
