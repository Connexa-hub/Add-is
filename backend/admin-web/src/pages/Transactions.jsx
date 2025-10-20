import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Filter, Download, Eye } from 'lucide-react';
import Modal from '../components/Modal';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    page: 1,
  });
  const [pagination, setPagination] = useState({});
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getTransactions({
        ...filters,
        limit: 50,
      });
      setTransactions(response.data.data.transactions);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      success: 'badge-success',
      pending: 'badge-warning',
      failed: 'badge-danger',
      completed: 'badge-success',
    };
    return statusMap[status] || 'badge-info';
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Transactions
        </h1>
        <p style={{ color: 'var(--gray-600)' }}>Monitor all platform transactions</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="label">Type</label>
            <select
              className="input"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
            >
              <option value="">All Types</option>
              <option value="Electricity">Electricity</option>
              <option value="Data">Data</option>
              <option value="TV">TV Subscription</option>
              <option value="Wallet Funding">Wallet Funding</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>User Details</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    Loading...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {transaction.reference || transaction.paymentReference || 'N/A'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <strong>{transaction.userId?.name || transaction.user?.name || 'Unknown'}</strong>
                        <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                          {transaction.userId?.email || transaction.user?.email || 'No email'}
                        </span>
                        {transaction.userId?.phone && (
                          <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                            {transaction.userId.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${transaction.type === 'credit' ? 'badge-success' : 'badge-info'}`}>
                        {transaction.type || transaction.transactionType || 'N/A'}
                      </span>
                    </td>
                    <td>{transaction.category || 'N/A'}</td>
                    <td style={{ fontWeight: '600' }}>₦{transaction.amount?.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td>{new Date(transaction.createdAt).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowModal(true);
                        }}
                      >
                        <Eye size={16} />
                        Details
                      </button>
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
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              disabled={filters.page === 1}
            >
              Previous
            </button>
            <span style={{ padding: '0.5rem 1rem' }}>
              Page {filters.page} of {pagination.pages}
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={filters.page === pagination.pages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedTransaction(null);
        }}
        title="Transaction Details"
        type={selectedTransaction?.status === 'failed' ? 'error' : selectedTransaction?.status === 'completed' ? 'success' : 'info'}
        size="lg"
        primaryAction={{
          label: 'Close',
          onClick: () => {
            setShowModal(false);
            setSelectedTransaction(null);
          }
        }}
      >
        {selectedTransaction && (
          <div style={{ fontSize: '0.95rem', color: 'var(--gray-900)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.25rem' }}>Reference</p>
                <p style={{ fontFamily: 'monospace', color: 'var(--gray-900)' }}>{selectedTransaction.reference || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.25rem' }}>Amount</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>₦{selectedTransaction.amount?.toLocaleString()}</p>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--gray-50)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: '600', marginBottom: '0.75rem' }}>User Information</h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <p><strong>Name:</strong> {selectedTransaction.userId?.name || selectedTransaction.user?.name || 'Unknown'}</p>
                <p><strong>Email:</strong> {selectedTransaction.userId?.email || selectedTransaction.user?.email || 'N/A'}</p>
                {selectedTransaction.userId?.phone && <p><strong>Phone:</strong> {selectedTransaction.userId.phone}</p>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <p style={{ fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.25rem' }}>Type</p>
                <span className={`badge ${selectedTransaction.type === 'credit' ? 'badge-success' : 'badge-info'}`}>
                  {selectedTransaction.type || selectedTransaction.transactionType}
                </span>
              </div>
              <div>
                <p style={{ fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.25rem' }}>Category</p>
                <p>{selectedTransaction.category || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.25rem' }}>Status</p>
                <span className={`badge ${selectedTransaction.status === 'completed' ? 'badge-success' : selectedTransaction.status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>
                  {selectedTransaction.status}
                </span>
              </div>
              <div>
                <p style={{ fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.25rem' }}>Date</p>
                <p>{new Date(selectedTransaction.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {selectedTransaction.status === 'failed' && (
              <div style={{ backgroundColor: '#FEE2E2', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', borderLeft: '4px solid var(--danger)' }}>
                <h3 style={{ fontWeight: '600', color: '#991B1B', marginBottom: '0.5rem' }}>❌ Error Details</h3>
                <p style={{ color: '#7F1D1D' }}>{selectedTransaction.metadata?.error || selectedTransaction.description || 'No error details available'}</p>
              </div>
            )}

            {selectedTransaction.description && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.25rem' }}>Description</p>
                <p>{selectedTransaction.description}</p>
              </div>
            )}

            {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
              <div style={{ backgroundColor: 'var(--gray-50)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Metadata</h3>
                <pre style={{ fontSize: '0.875rem', overflow: 'auto', maxHeight: '200px' }}>
                  {JSON.stringify(selectedTransaction.metadata, null, 2)}
                </pre>
              </div>
            )}

            {selectedTransaction.details && Object.keys(selectedTransaction.details).length > 0 && (
              <div style={{ backgroundColor: 'var(--gray-50)', padding: '1rem', borderRadius: '8px' }}>
                <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Additional Details</h3>
                <pre style={{ fontSize: '0.875rem', overflow: 'auto', maxHeight: '200px' }}>
                  {JSON.stringify(selectedTransaction.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Transactions;
