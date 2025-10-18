import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Filter, Download } from 'lucide-react';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    page: 1,
  });
  const [pagination, setPagination] = useState({});

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
                <th>User</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    Loading...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {transaction.reference}
                    </td>
                    <td>{transaction.userId?.name || transaction.userId?.email || 'N/A'}</td>
                    <td>{transaction.type}</td>
                    <td>₦{transaction.amount?.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td>{new Date(transaction.createdAt).toLocaleString()}</td>
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
    </div>
  );
};

export default Transactions;
