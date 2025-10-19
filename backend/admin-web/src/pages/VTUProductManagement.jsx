import { useState, useEffect } from 'react';
import api from '../services/api';

const VTUProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'airtime',
    network: '',
    category: 'general',
    denomination: '',
    price: '',
    vendorCode: '',
    vendor: 'vtpass',
    description: '',
    validity: '',
    commission: 0,
    isActive: true,
    isPopular: false,
    displayOrder: 0
  });
  const [editingId, setEditingId] = useState(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/vtu/admin/products?limit=100');
      if (response.data.success) {
        setProducts(response.data.data.products);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        denomination: formData.denomination ? parseFloat(formData.denomination) : undefined,
        price: parseFloat(formData.price),
        commission: parseFloat(formData.commission),
        displayOrder: parseInt(formData.displayOrder)
      };

      if (editingId) {
        await api.put(`/api/vtu/admin/products/${editingId}`, payload);
        alert('Product updated successfully');
      } else {
        await api.post('/api/vtu/admin/products', payload);
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
      await api.delete(`/api/vtu/admin/products/${id}`);
      alert('Product deleted successfully');
      loadProducts();
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  const editProduct = (product) => {
    setFormData({
      title: product.title,
      type: product.type,
      network: product.network,
      category: product.category,
      denomination: product.denomination || '',
      price: product.price,
      vendorCode: product.vendorCode,
      vendor: product.vendor,
      description: product.description || '',
      validity: product.validity || '',
      commission: product.commission,
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
      type: 'airtime',
      network: '',
      category: 'general',
      denomination: '',
      price: '',
      vendorCode: '',
      vendor: 'vtpass',
      description: '',
      validity: '',
      commission: 0,
      isActive: true,
      isPopular: false,
      displayOrder: 0
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredProducts = filterType === 'all' 
    ? products 
    : products.filter(p => p.type === filterType);

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">VTU Product Management</h1>
          <p className="text-gray-600 mt-1">Manage airtime, data, and bill payment products</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Add Product
        </button>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b flex gap-2 overflow-x-auto">
          {['all', 'airtime', 'data', 'electricity', 'cable'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                filterType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading products...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{product.title}</div>
                        <div className="text-sm text-gray-500">{product.vendorCode}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {product.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{product.network}</td>
                    <td className="px-6 py-4 font-medium">₦{product.price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <span className={`px-2 py-1 text-xs rounded ${
                          product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold">{editingId ? 'Edit' : 'Add'} Product</h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
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
                    <option value="electricity">Electricity</option>
                    <option value="cable">Cable/TV</option>
                    <option value="internet">Internet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Network *</label>
                  <input
                    type="text"
                    value={formData.network}
                    onChange={(e) => setFormData({...formData, network: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="MTN, GLO, AIRTEL, etc."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="general, bundle, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Denomination</label>
                  <input
                    type="number"
                    value={formData.denomination}
                    onChange={(e) => setFormData({...formData, denomination: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="100, 500, 1000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Commission (%)</label>
                  <input
                    type="number"
                    value={formData.commission}
                    onChange={(e) => setFormData({...formData, commission: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Vendor Code *</label>
                  <input
                    type="text"
                    value={formData.vendorCode}
                    onChange={(e) => setFormData({...formData, vendorCode: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="VTU_MTN_100"
                    required
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

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  rows="2"
                />
              </div>

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
