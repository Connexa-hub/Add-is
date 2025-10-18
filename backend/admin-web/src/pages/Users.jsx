import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Search, Edit, Ban, CheckCircle, DollarSign, Eye } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAction, setWalletAction] = useState({ action: 'credit', amount: '', reason: '' });

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

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          User Management
        </h1>
        <p style={{ color: 'var(--gray-600)' }}>Manage users, wallets, and account status</p>
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
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                          onClick={() => {
                            setSelectedUser(user);
                            setShowWalletModal(true);
                          }}
                        >
                          <DollarSign size={16} />
                        </button>
                        <button
                          className={`btn ${user.isActive ? 'btn-danger' : 'btn-success'}`}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                          onClick={() => handleStatusToggle(user._id, user.isActive)}
                        >
                          {user.isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
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
    </div>
  );
};

export default Users;
