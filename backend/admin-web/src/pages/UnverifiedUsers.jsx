import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Loader } from 'lucide-react';
import { adminAPI } from '../services/api';

const UnverifiedUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchUnverifiedUsers();
  }, [pagination.page]);

  const fetchUnverifiedUsers = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getUnverifiedUsers({
        page: pagination.page,
        limit: pagination.limit,
      });

      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch unverified users:', error);
      alert('Failed to load unverified users');
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = async (email) => {
    if (!confirm(`Are you sure you want to manually verify ${email}?`)) {
      return;
    }

    const reason = prompt('Enter reason for manual verification:');
    if (!reason) return;

    setVerifying(email);
    try {
      await adminAPI.manualVerifyEmail(email, reason);
      alert(`Successfully verified ${email}`);
      fetchUnverifiedUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to verify user');
    } finally {
      setVerifying(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Unverified Users
        </h1>
        <p style={{ color: 'var(--gray-600)' }}>
          Manage users who haven't verified their email addresses
        </p>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Loader size={40} className="animate-spin" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: '1rem', color: 'var(--gray-600)' }}>Loading unverified users...</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Users size={48} style={{ margin: '0 auto', color: 'var(--gray-400)' }} />
            <p style={{ marginTop: '1rem', color: 'var(--gray-600)' }}>No unverified users found</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Name</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Email</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Created</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Expires</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '1rem' }}>{user.name}</td>
                      <td style={{ padding: '1rem' }}>{user.email}</td>
                      <td style={{ padding: '1rem' }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {user.verificationExpires ? (
                          <span
                            style={{
                              color: new Date(user.verificationExpires) < new Date() ? '#ef4444' : '#10b981',
                            }}
                          >
                            {new Date(user.verificationExpires) < new Date()
                              ? 'Expired'
                              : new Date(user.verificationExpires).toLocaleDateString()}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                          onClick={() => handleManualVerify(user.email)}
                          disabled={verifying === user.email}
                        >
                          {verifying === user.email ? (
                            <>
                              <Loader size={16} className="animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={16} />
                              Manual Verify
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <button
                  className="btn"
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                >
                  Previous
                </button>
                <span style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center' }}>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  className="btn"
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UnverifiedUsers;
