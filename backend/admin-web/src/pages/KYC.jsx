import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Eye, FileText, User } from 'lucide-react';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const KYC = () => {
  const [kycSubmissions, setKycSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchKYCSubmissions();
  }, [page, statusFilter]);

  const fetchKYCSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/kyc/admin/list', {
        params: { page, limit: 20, status: statusFilter },
      });
      setKycSubmissions(response.data.data.users);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching KYC submissions:', error);
      alert(error.response?.data?.message || 'Failed to fetch KYC submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowModal(true);
    setActionType(null);
    setRejectionReason('');
    setNotes('');
  };

  const handleApprove = async () => {
    if (!selectedUser) return;
    
    setProcessing(true);
    try {
      await api.post(`/kyc/admin/${selectedUser.userId}/approve`, { notes });
      alert('KYC approved successfully');
      setShowModal(false);
      setSelectedUser(null);
      fetchKYCSubmissions();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve KYC');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedUser || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    
    setProcessing(true);
    try {
      await api.post(`/kyc/admin/${selectedUser.userId}/reject`, {
        reason: rejectionReason,
        notes,
      });
      alert('KYC rejected successfully');
      setShowModal(false);
      setSelectedUser(null);
      fetchKYCSubmissions();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reject KYC');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          KYC Verification
        </h1>
        <p style={{ color: 'var(--gray-600)' }}>Review and manage user verification submissions</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                className={`btn ${statusFilter === status ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                style={{ textTransform: 'capitalize' }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KYC List */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '1rem', color: 'var(--gray-600)' }}>Loading KYC submissions...</p>
          </div>
        ) : kycSubmissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <FileText size={48} color="var(--gray-400)" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: '1rem', color: 'var(--gray-600)' }}>No {statusFilter} KYC submissions</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Full Name</th>
                  <th>ID Number</th>
                  <th>Phone</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {kycSubmissions.map((user) => (
                  <tr key={user.userId}>
                    <td>
                      <div>
                        <div style={{ fontWeight: '600' }}>{user.name}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td>{user.kyc?.personal?.fullName || 'N/A'}</td>
                    <td>{user.kyc?.personal?.idNumber || 'N/A'}</td>
                    <td>{user.kyc?.personal?.phoneNumber || 'N/A'}</td>
                    <td>{formatDate(user.kyc?.submittedAt)}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor:
                            user.kyc?.status === 'approved'
                              ? 'var(--success-light)'
                              : user.kyc?.status === 'rejected'
                              ? 'var(--error-light)'
                              : 'var(--warning-light)',
                          color:
                            user.kyc?.status === 'approved'
                              ? 'var(--success)'
                              : user.kyc?.status === 'rejected'
                              ? 'var(--error)'
                              : 'var(--warning)',
                        }}
                      >
                        {user.kyc?.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleViewDetails(user)}
                      >
                        <Eye size={16} style={{ marginRight: '0.25rem' }} />
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', padding: '1rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </button>
            <span style={{ padding: '0.5rem 1rem' }}>
              Page {page} of {pagination.totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>KYC Review</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>

            {/* User Info */}
            <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--gray-50)' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                User Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Name</div>
                  <div style={{ fontWeight: '600' }}>{selectedUser.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Email</div>
                  <div style={{ fontWeight: '600' }}>{selectedUser.email}</div>
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                Personal Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Full Legal Name</div>
                  <div style={{ fontWeight: '600' }}>{selectedUser.kyc?.personal?.fullName || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Date of Birth</div>
                  <div style={{ fontWeight: '600' }}>
                    {selectedUser.kyc?.personal?.dateOfBirth
                      ? new Date(selectedUser.kyc.personal.dateOfBirth).toLocaleDateString()
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>ID Number</div>
                  <div style={{ fontWeight: '600' }}>{selectedUser.kyc?.personal?.idNumber || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Phone Number</div>
                  <div style={{ fontWeight: '600' }}>{selectedUser.kyc?.personal?.phoneNumber || 'N/A'}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Address</div>
                  <div style={{ fontWeight: '600' }}>{selectedUser.kyc?.personal?.address || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>City</div>
                  <div style={{ fontWeight: '600' }}>{selectedUser.kyc?.personal?.city || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>State</div>
                  <div style={{ fontWeight: '600' }}>{selectedUser.kyc?.personal?.state || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                Uploaded Documents
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                {selectedUser.kyc?.documents?.map((doc, index) => (
                  <div key={index}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                      {doc.type.replace('_', ' ').toUpperCase()}
                    </div>
                    <img
                      src={doc.url}
                      alt={doc.type}
                      style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }}
                      onClick={() => window.open(doc.url, '_blank')}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Action Form */}
            {selectedUser.kyc?.status === 'pending' && (
              <div className="card" style={{ backgroundColor: 'var(--gray-50)' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="label">Admin Notes (Optional)</label>
                  <textarea
                    className="input"
                    rows="3"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add internal notes about this review..."
                  />
                </div>

                {actionType === 'reject' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="label">Rejection Reason *</label>
                    <textarea
                      className="input"
                      rows="3"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide a clear reason for rejection..."
                      required
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem' }}>
                  {actionType === 'approve' ? (
                    <>
                      <button
                        className="btn btn-success"
                        onClick={handleApprove}
                        disabled={processing}
                      >
                        {processing ? 'Processing...' : 'Confirm Approval'}
                      </button>
                      <button className="btn btn-secondary" onClick={() => setActionType(null)}>
                        Cancel
                      </button>
                    </>
                  ) : actionType === 'reject' ? (
                    <>
                      <button
                        className="btn btn-error"
                        onClick={handleReject}
                        disabled={processing || !rejectionReason.trim()}
                      >
                        {processing ? 'Processing...' : 'Confirm Rejection'}
                      </button>
                      <button className="btn btn-secondary" onClick={() => setActionType(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-success" onClick={() => setActionType('approve')}>
                        <CheckCircle size={16} style={{ marginRight: '0.25rem' }} />
                        Approve KYC
                      </button>
                      <button className="btn btn-error" onClick={() => setActionType('reject')}>
                        <XCircle size={16} style={{ marginRight: '0.25rem' }} />
                        Reject KYC
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KYC;
