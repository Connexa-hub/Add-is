import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const KYCManagement = () => {
  const [kycs, setKycs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    loadKYCs();
  }, [filter, page]);

  const loadKYCs = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/kyc/admin/list?status=${filter}&page=${page}&limit=20`);
      if (response.data.success) {
        setKycs(response.data.data.users);
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to load KYCs:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveKYC = async (userId) => {
    if (!confirm('Are you sure you want to approve this KYC submission?')) return;

    try {
      const notes = prompt('Add approval notes (optional):');
      await api.post(`/api/kyc/admin/${userId}/approve`, { notes });
      alert('KYC approved successfully');
      loadKYCs();
      setSelectedKYC(null);
    } catch (error) {
      alert('Failed to approve KYC: ' + (error.response?.data?.message || error.message));
    }
  };

  const rejectKYC = async (userId) => {
    const reason = prompt('Enter rejection reason (required):');
    if (!reason) return;

    try {
      const notes = prompt('Add additional notes (optional):');
      await api.post(`/api/kyc/admin/${userId}/reject`, { reason, notes });
      alert('KYC rejected');
      loadKYCs();
      setSelectedKYC(null);
    } catch (error) {
      alert('Failed to reject KYC: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      not_submitted: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.not_submitted}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">KYC Management</h1>
        <p className="text-gray-600 mt-1">Review and approve user verification submissions</p>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b flex gap-2">
          {['pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => { setFilter(status); setPage(1); }}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading KYC submissions...</div>
        ) : kycs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No KYC submissions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {kycs.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user.kyc?.status || 'not_submitted')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.kyc?.submittedAt ? new Date(user.kyc.submittedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedKYC(user)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t flex justify-between items-center">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {selectedKYC && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold">KYC Review - {selectedKYC.name}</h2>
              <button
                onClick={() => setSelectedKYC(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Full Name</label>
                    <p className="font-medium">{selectedKYC.kyc?.personal?.fullName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Date of Birth</label>
                    <p className="font-medium">
                      {selectedKYC.kyc?.personal?.dateOfBirth 
                        ? new Date(selectedKYC.kyc.personal.dateOfBirth).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">ID Number</label>
                    <p className="font-medium">{selectedKYC.kyc?.personal?.idNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Phone Number</label>
                    <p className="font-medium">{selectedKYC.kyc?.personal?.phoneNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">BVN</label>
                    <p className="font-medium">{selectedKYC.kyc?.personal?.bvn || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">NIN</label>
                    <p className="font-medium">{selectedKYC.kyc?.personal?.nin || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">State</label>
                    <p className="font-medium">{selectedKYC.kyc?.personal?.state || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">City</label>
                    <p className="font-medium">{selectedKYC.kyc?.personal?.city || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Nationality</label>
                    <p className="font-medium">{selectedKYC.kyc?.personal?.nationality || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-gray-600">Address</label>
                    <p className="font-medium">{selectedKYC.kyc?.personal?.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Documents</h3>
                <div className="grid grid-cols-3 gap-4">
                  {selectedKYC.kyc?.documents?.map((doc, idx) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <p className="text-sm font-medium mb-2">{doc.type.replace('_', ' ').toUpperCase()}</p>
                      <img
                        src={`http://localhost:3001${doc.url}`}
                        alt={doc.type}
                        className="w-full h-32 object-cover rounded cursor-pointer"
                        onClick={() => window.open(`http://localhost:3001${doc.url}`, '_blank')}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedKYC.kyc?.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                  <p className="text-red-700">{selectedKYC.kyc.rejectionReason}</p>
                </div>
              )}

              {selectedKYC.kyc?.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => approveKYC(selectedKYC.userId)}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
                  >
                    Approve KYC
                  </button>
                  <button
                    onClick={() => rejectKYC(selectedKYC.userId)}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700"
                  >
                    Reject KYC
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCManagement;