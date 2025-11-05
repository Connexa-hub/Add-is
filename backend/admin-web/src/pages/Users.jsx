import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Search, Edit, Ban, CheckCircle, DollarSign, Eye, Trash2 } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAction, setWalletAction] = useState({ action: 'credit', amount: '', reason: '' });
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(1);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({ page, limit: 20, search });
      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletUpdate = async () => {
    try {
      await adminAPI.updateUserWallet(selectedUser._id, walletAction);
      alert('Wallet updated successfully');
      setShowWalletModal(false);
      setWalletAction({ action: 'credit', amount: '', reason: '' });
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update wallet');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await adminAPI.updateUserStatus(userId, !currentStatus);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`⚠️ WARNING: This will permanently delete the account for "${userName}" and ALL associated data including transactions, cards, and notifications. This action CANNOT be undone.\n\nAre you absolutely sure you want to delete this user?`)) {
      return;
    }

    try {
      await adminAPI.deleteUser(userId);
      alert('User deleted successfully');
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleViewDetails = async (userId) => {
    try {
      const response = await adminAPI.getUserDetails(userId);
      setSelectedUserDetails(response.data.data);
      setShowDetailsModal(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to load user details');
    }
  };

  const handleCleanupUnverified = async () => {
    if (!window.confirm(`Are you sure you want to delete all unverified accounts older than ${cleanupDays} day(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      setCleanupLoading(true);
      const response = await adminAPI.cleanupUnverifiedUsers(cleanupDays);
      alert(response.data.message || 'Cleanup completed successfully');
      setShowCleanupModal(false);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cleanup unverified users');
    } finally {
      setCleanupLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            User Management
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>Manage users, wallets, and account status</p>
        </div>
        <button
          className="btn btn-danger"
          onClick={() => setShowCleanupModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Trash2 size={16} />
          Cleanup Unverified Users
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Search size={20} color="var(--gray-400)" />
          <input
            type="text"
            className="input"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Wallet Balance</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>₦{user.walletBalance?.toLocaleString() || 0}</td>
                    <td>
                      <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-info"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                          onClick={() => handleViewDetails(user._id)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                          onClick={() => {
                            setSelectedUser(user);
                            setShowWalletModal(true);
                          }}
                          title="Update Wallet"
                        >
                          <DollarSign size={16} />
                        </button>
                        <button
                          className={`btn ${user.isActive ? 'btn-warning' : 'btn-success'}`}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                          onClick={() => handleStatusToggle(user._id, user.isActive)}
                          title={user.isActive ? 'Disable Account' : 'Activate Account'}
                        >
                          {user.isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                          onClick={() => handleDeleteUser(user._id, user.name)}
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </button>
            <span style={{ padding: '0.5rem 1rem' }}>
              Page {page} of {pagination.pages}
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.pages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showWalletModal && (
        <div className="modal-overlay" onClick={() => setShowWalletModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Update Wallet - {selectedUser?.name}
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Action</label>
              <select
                className="input"
                value={walletAction.action}
                onChange={(e) => setWalletAction({ ...walletAction, action: e.target.value })}
              >
                <option value="credit">Credit (Add Money)</option>
                <option value="debit">Debit (Remove Money)</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Amount (₦)</label>
              <input
                type="number"
                className="input"
                value={walletAction.amount}
                onChange={(e) => setWalletAction({ ...walletAction, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label">Reason</label>
              <textarea
                className="input"
                value={walletAction.reason}
                onChange={(e) => setWalletAction({ ...walletAction, reason: e.target.value })}
                placeholder="Reason for this transaction..."
                rows="3"
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={handleWalletUpdate}>
                Update Wallet
              </button>
              <button className="btn btn-secondary" onClick={() => setShowWalletModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedUserDetails && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              User Details - {selectedUserDetails.user?.name}
            </h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                Basic Information
              </h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.25rem' }}>
                  <span style={{ fontWeight: '500' }}>Email:</span>
                  <span>{selectedUserDetails.user?.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.25rem' }}>
                  <span style={{ fontWeight: '500' }}>Phone:</span>
                  <span>{selectedUserDetails.user?.phoneNumber || 'Not provided'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.25rem' }}>
                  <span style={{ fontWeight: '500' }}>Wallet Balance:</span>
                  <span style={{ fontWeight: '600', color: 'var(--success)' }}>₦{selectedUserDetails.user?.walletBalance?.toLocaleString() || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.25rem' }}>
                  <span style={{ fontWeight: '500' }}>Status:</span>
                  <span className={`badge ${selectedUserDetails.user?.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {selectedUserDetails.user?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.25rem' }}>
                  <span style={{ fontWeight: '500' }}>Registered:</span>
                  <span>{new Date(selectedUserDetails.user?.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {selectedUserDetails.user?.monnifyAccounts && selectedUserDetails.user.monnifyAccounts.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                  Monnify Virtual Accounts
                </h3>
                {selectedUserDetails.user.monnifyAccounts.map((account, index) => (
                  <div key={index} style={{ padding: '1rem', backgroundColor: 'var(--primary-light)', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Bank Name:</span>
                        <div style={{ fontWeight: '600' }}>{account.bankName}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Account Number:</span>
                        <div style={{ fontWeight: '600', fontSize: '1.125rem', color: 'var(--primary)' }}>{account.accountNumber}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>Account Name:</span>
                        <div style={{ fontWeight: '600' }}>{account.accountName}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedUserDetails.user?.monnifyAccountReference && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                  Monnify Reference
                </h3>
                <div style={{ padding: '0.5rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.25rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {selectedUserDetails.user.monnifyAccountReference}
                </div>
              </div>
            )}

            <button className="btn btn-secondary" onClick={() => setShowDetailsModal(false)} style={{ width: '100%' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {showCleanupModal && (
        <div className="modal-overlay" onClick={() => setShowCleanupModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--danger)' }}>
              Cleanup Unverified Users
            </h2>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--danger-light)', borderRadius: '0.5rem' }}>
              <p style={{ color: 'var(--danger)', fontWeight: '500', marginBottom: '0.5rem' }}>
                ⚠️ Warning: This action is permanent!
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                This will permanently delete all user accounts that:
              </p>
              <ul style={{ fontSize: '0.875rem', color: 'var(--gray-700)', marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                <li>Have not verified their email address</li>
                <li>Were created more than the specified number of days ago</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label">Delete accounts older than (days)</label>
              <input
                type="number"
                className="input"
                value={cleanupDays}
                onChange={(e) => setCleanupDays(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                placeholder="1"
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                Recommended: 1 day for regular cleanup, 7 days for bulk cleanup
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn btn-danger" 
                onClick={handleCleanupUnverified}
                disabled={cleanupLoading}
                style={{ flex: 1 }}
              >
                {cleanupLoading ? 'Processing...' : 'Delete Unverified Accounts'}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowCleanupModal(false)}
                disabled={cleanupLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
