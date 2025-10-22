import { useState, useEffect } from 'react';
import api from '../services/api';

const VTUProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    displayName: '',
    type: 'airtime',
    category: 'airtime',
    network: '',
    serviceID: '',
    variationCode: '',
    sellingPrice: '',
    vendorCode: '',
    vendor: 'vtpass',
    description: '',
    validity: '',
    commissionRate: 0,
    isActive: true,
    isPopular: false,
    displayOrder: 0
  });
  const [editingId, setEditingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterNetwork, setFilterNetwork] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);

  const categories = [
    { key: 'all', label: 'All Products', category: null },
    { key: 'airtime', label: 'Airtime', category: 'airtime' },
    { key: 'data', label: 'Data', category: 'data' },
    { key: 'tv-subscription', label: 'TV Subscription', category: 'tv-subscription' },
    { key: 'electricity-bill', label: 'Electricity', category: 'electricity-bill' },
    { key: 'education', label: 'Education', category: 'education' },
    { key: 'insurance', label: 'Insurance', category: 'insurance' },
    { key: 'other-services', label: 'Other Services', category: 'other-services' },
    { key: 'betting', label: 'Betting', category: 'betting' }
  ];

  useEffect(() => {
    loadProducts();
    loadSyncStatus();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: 500 });
      const response = await api.get(`/admin/vtu/products?${params}`);
      if (response.data.success) {
        setProducts(response.data.data.products);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      alert('Failed to load products: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const response = await api.get('/admin/vtu/sync/status');
      if (response.data.success) {
        setSyncStatus(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const handleSync = async (category = null) => {
    if (!confirm(`Are you sure you want to sync ${category || 'all categories'} with VTPass?`)) return;
    
    try {
      setSyncing(true);
      const payload = category ? { category } : {};
      const response = await api.post('/admin/vtu/sync', payload);
      
      if (response.data.success) {
        alert(`Sync completed! ${response.data.data.totalProducts || 0} products synced.`);
        loadProducts();
        loadSyncStatus();
      }
    } catch (error) {
      alert('Sync failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        sellingPrice: parseFloat(formData.sellingPrice),
        commissionRate: parseFloat(formData.commissionRate),
        displayOrder: parseInt(formData.displayOrder)
      };

      if (editingId) {
        await api.put(`/admin/vtu/products/${editingId}`, payload);
        alert('Product updated successfully');
      } else {
        await api.post('/admin/vtu/products', payload);
        alert('Product created successfully');
      }
      resetForm();
      loadProducts();
    } catch (error) {
      alert('Failed to save product: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/admin/vtu/products/${id}`);
      alert('Product deleted successfully');
      loadProducts();
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  const toggleProductStatus = async (id) => {
    try {
      await api.put(`/admin/vtu/products/${id}/toggle`);
      loadProducts();
    } catch (error) {
      alert('Failed to toggle product status');
    }
  };

  const editProduct = (product) => {
    setFormData({
      title: product.title,
      displayName: product.displayName || product.title,
      type: product.type,
      category: product.category,
      network: product.network,
      serviceID: product.serviceID || '',
      variationCode: product.variationCode || '',
      sellingPrice: product.sellingPrice || product.price,
      vendorCode: product.vendorCode,
      vendor: product.vendor,
      description: product.description || '',
      validity: product.validity || '',
      commissionRate: product.commissionRate || product.commission || 0,
      isActive: product.isActive,
      isPopular: product.isPopular,
      displayOrder: product.displayOrder
    });
    setEditingId(product._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      displayName: '',
      type: 'airtime',
      category: 'airtime',
      network: '',
      serviceID: '',
      variationCode: '',
      sellingPrice: '',
      vendorCode: '',
      vendor: 'vtpass',
      description: '',
      validity: '',
      commissionRate: 0,
      isActive: true,
      isPopular: false,
      displayOrder: 0
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleBulkStatusUpdate = async (isActive) => {
    if (selectedProducts.length === 0) {
      alert('Please select products first');
      return;
    }
    
    try {
      await api.post('/admin/vtu/products/bulk-update', {
        productIds: selectedProducts,
        isActive
      });
      alert(`${selectedProducts.length} products updated successfully`);
      setSelectedProducts([]);
      loadProducts();
    } catch (error) {
      alert('Failed to update products');
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p._id));
    }
  };

  const filteredProducts = products.filter(product => {
    if (filterCategory !== 'all' && product.category !== filterCategory) return false;
    if (filterNetwork && !product.network.toLowerCase().includes(filterNetwork.toLowerCase())) return false;
    if (filterStatus === 'active' && !product.isActive) return false;
    if (filterStatus === 'inactive' && product.isActive) return false;
    if (searchTerm && !product.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !product.vendorCode.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">VTU Product Management</h1>
            <p className="text-gray-600 mt-1">Manage VTPass products across all service categories</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSync()}
              disabled={syncing}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {syncing ? '🔄 Syncing...' : '🔄 Sync with VTPass'}
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Add Product
            </button>
          </div>
        </div>

        {syncStatus && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">
                  Last Sync: {syncStatus.lastSyncTime ? new Date(syncStatus.lastSyncTime).toLocaleString() : 'Never'}
                </p>
                <p className="text-sm text-gray-600">
                  Total Products: {syncStatus.totalProducts} | Active: {syncStatus.activeProducts}
                </p>
              </div>
              <div className="text-sm">
                <span className={`px-3 py-1 rounded-full ${
                  syncStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
                  syncStatus.status === 'syncing' ? 'bg-yellow-100 text-yellow-800' :
                  syncStatus.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {syncStatus.status || 'Idle'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="flex gap-2 overflow-x-auto mb-4">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setFilterCategory(cat.key)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  filterCategory === cat.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded-lg px-3 py-2"
            />
            <input
              type="text"
              placeholder="Filter by network..."
              value={filterNetwork}
              onChange={(e) => setFilterNetwork(e.target.value)}
              className="border rounded-lg px-3 py-2"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            {selectedProducts.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkStatusUpdate(true)}
                  className="flex-1 bg-green-500 text-white px-3 py-2 rounded-lg text-sm"
                >
                  Activate ({selectedProducts.length})
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate(false)}
                  className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg text-sm"
                >
                  Deactivate ({selectedProducts.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading products...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                      No products found. Click "Sync with VTPass" to import products.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product._id)}
                          onChange={() => toggleProductSelection(product._id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{product.displayName || product.title}</div>
                          <div className="text-sm text-gray-500">{product.vendorCode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{product.network}</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">{product.serviceID || '-'}</td>
                      <td className="px-6 py-4 font-medium">₦{(product.sellingPrice || product.price || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm">{(product.commissionRate || product.commission || 0)}%</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => toggleProductStatus(product._id)}
                            className={`px-2 py-1 text-xs rounded ${
                              product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {product.isActive ? 'Active' : 'Inactive'}
                          </button>
                          {product.isPopular && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                              Popular
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => editProduct(product)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteProduct(product._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t bg-gray-50 text-sm text-gray-600">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold">{editingId ? 'Edit' : 'Add'} Product</h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Display Name</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="airtime">Airtime</option>
                    <option value="data">Data</option>
                    <option value="tv-subscription">TV Subscription</option>
                    <option value="electricity-bill">Electricity Bill</option>
                    <option value="education">Education</option>
                    <option value="insurance">Insurance</option>
                    <option value="other-services">Other Services</option>
                    <option value="betting">Betting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="airtime">Airtime</option>
                    <option value="data">Data</option>
                    <option value="cable">Cable/TV</option>
                    <option value="electricity">Electricity</option>
                    <option value="education">Education</option>
                    <option value="insurance">Insurance</option>
                    <option value="internet">Internet</option>
                    <option value="betting">Betting</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Network *</label>
                  <input
                    type="text"
                    value={formData.network}
                    onChange={(e) => setFormData({...formData, network: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="MTN, GLO, DSTV, etc."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Service ID *</label>
                  <input
                    type="text"
                    value={formData.serviceID}
                    onChange={(e) => setFormData({...formData, serviceID: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="mtn, dstv, waec, etc."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Variation Code</label>
                  <input
                    type="text"
                    value={formData.variationCode}
                    onChange={(e) => setFormData({...formData, variationCode: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vendor Code *</label>
                  <input
                    type="text"
                    value={formData.vendorCode}
                    onChange={(e) => setFormData({...formData, vendorCode: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Unique identifier"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₦) *</label>
                  <input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({...formData, commissionRate: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  rows="2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Validity</label>
                  <input
                    type="text"
                    value={formData.validity}
                    onChange={(e) => setFormData({...formData, validity: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="30 days, 7 days, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({...formData, displayOrder: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-medium">Active</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({...formData, isPopular: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-medium">Popular</label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Update' : 'Create'} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VTUProductManagement;
