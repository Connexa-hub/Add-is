
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';

export default function QuickAmountGrids() {
  const navigate = useNavigate();
  const [grids, setGrids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGrid, setEditingGrid] = useState(null);
  const [formData, setFormData] = useState({
    serviceType: 'airtime',
    provider: '',
    providerId: '',
    amounts: '100,200,500,1000,2000,5000',
    columns: 3,
    rows: 2,
    minAmount: 50,
    maxAmount: 1000000,
    allowCustomInput: true,
    isActive: true,
    label: '',
    description: ''
  });

  const serviceTypes = [
    'airtime', 'data', 'electricity', 'tv-subscription', 
    'betting', 'internet', 'education', 'insurance', 'other'
  ];

  useEffect(() => {
    fetchGrids();
  }, []);

  const fetchGrids = async () => {
    try {
      const response = await api.get('/api/vtu/quick-amounts/list');
      if (response.data.success) {
        setGrids(response.data.data.grids);
      }
    } catch (error) {
      console.error('Failed to fetch grids:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amounts: formData.amounts.split(',').map(a => parseFloat(a.trim())).filter(a => !isNaN(a)),
        layout: {
          columns: parseInt(formData.columns),
          rows: parseInt(formData.rows)
        }
      };

      if (editingGrid) {
        await api.put(`/api/vtu/quick-amounts/${editingGrid._id}`, payload);
      } else {
        await api.post('/api/vtu/quick-amounts', payload);
      }

      setShowModal(false);
      setEditingGrid(null);
      resetForm();
      fetchGrids();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save grid');
    }
  };

  const handleEdit = (grid) => {
    setEditingGrid(grid);
    setFormData({
      serviceType: grid.serviceType,
      provider: grid.provider,
      providerId: grid.providerId,
      amounts: grid.amounts.join(','),
      columns: grid.layout.columns,
      rows: grid.layout.rows,
      minAmount: grid.minAmount,
      maxAmount: grid.maxAmount,
      allowCustomInput: grid.allowCustomInput,
      isActive: grid.isActive,
      label: grid.label || '',
      description: grid.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this grid?')) return;
    try {
      await api.delete(`/api/vtu/quick-amounts/${id}`);
      fetchGrids();
    } catch (error) {
      alert('Failed to delete grid');
    }
  };

  const resetForm = () => {
    setFormData({
      serviceType: 'airtime',
      provider: '',
      providerId: '',
      amounts: '100,200,500,1000,2000,5000',
      columns: 3,
      rows: 2,
      minAmount: 50,
      maxAmount: 1000000,
      allowCustomInput: true,
      isActive: true,
      label: '',
      description: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Quick Amount Grids</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage quick amount configurations for different services and providers
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            Add Grid
          </button>
        </div>
      </div>

      <div className="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Service Type</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Provider</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amounts</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Layout</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {grids.map((grid) => (
              <tr key={grid._id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                  {grid.serviceType}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{grid.provider}</td>
                <td className="px-3 py-4 text-sm text-gray-500">
                  {grid.amounts.slice(0, 4).map(a => `₦${a}`).join(', ')}
                  {grid.amounts.length > 4 && '...'}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {grid.layout.columns}x{grid.layout.rows}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                    grid.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {grid.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button
                    onClick={() => handleEdit(grid)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(grid._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingGrid(null);
          resetForm();
        }}
        title={editingGrid ? 'Edit Quick Amount Grid' : 'Create Quick Amount Grid'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Service Type</label>
            <select
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            >
              {serviceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Provider</label>
            <input
              type="text"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., MTN, IKEDC"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Provider ID (VTPass serviceID)</label>
            <input
              type="text"
              value={formData.providerId}
              onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., mtn, ikeja-electric"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amounts (comma-separated)
            </label>
            <input
              type="text"
              value={formData.amounts}
              onChange={(e) => setFormData({ ...formData, amounts: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="100,200,500,1000,2000,5000"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Columns</label>
              <input
                type="number"
                min="1"
                max="4"
                value={formData.columns}
                onChange={(e) => setFormData({ ...formData, columns: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rows</label>
              <input
                type="number"
                min="1"
                max="6"
                value={formData.rows}
                onChange={(e) => setFormData({ ...formData, rows: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Min Amount</label>
              <input
                type="number"
                value={formData.minAmount}
                onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Amount</label>
              <input
                type="number"
                value={formData.maxAmount}
                onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.allowCustomInput}
              onChange={(e) => setFormData({ ...formData, allowCustomInput: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Allow custom input</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Active</label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditingGrid(null);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
            >
              {editingGrid ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
